import { Snippet } from '../types';
import prisma from './prisma';

// Dynamically import wink-bm25-text-search (CommonJS module)
const initializeBM25 = async () => {
  try {
    const winkBM25 = await import('wink-bm25-text-search');
    return winkBM25.default();
  } catch (error) {
    console.error('Error importing wink-bm25-text-search:', error);
    throw new Error('Failed to initialize BM25 search engine');
  }
};

let bm25Engine: any = null;
let documentMap: Map<number, string> = new Map(); // Map document IDs to Snippet IDs
let currentDocId = 0;

// Flag to track if consolidation has happened
let isConsolidated = false;

// Improved tokenize function for BM25
const tokenize = (text: string): string[] => {
  if (!text) return [];
  
  // Convert to lowercase
  const lowercase = text.toLowerCase();
  
  // Remove punctuation and split by whitespace
  // Keep alphanumeric characters, spaces, and certain important characters
  const tokens = lowercase
    .replace(/[^\w\s'-]/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ')       // Normalize whitespace
    .trim()
    .split(/\s+/);              // Split by whitespace
  
  // Filter out stop words and very short tokens
  const stopWords = new Set(['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'is', 'was', 'are']);
  return tokens
    .filter(token => token.length > 1)
    .filter(token => !stopWords.has(token));
};

/**
 * Initialize the BM25 search engine
 */
export async function initializeBM25Engine(): Promise<void> {
  try {
    if (!bm25Engine) {
      console.log('Initializing BM25 search engine');
      bm25Engine = await initializeBM25();
      
      // Configure the BM25 engine with field weights and tokenizer
      bm25Engine.defineConfig({ fldWeights: { text: 1 } });
      bm25Engine.definePrepTasks([tokenize]);
      
      // Reset the consolidated flag
      isConsolidated = false;
      
      // Load existing documents from the database
      await loadDocumentsFromDb();
      console.log(`BM25 engine initialized with ${currentDocId} documents`);
    }
  } catch (error) {
    console.error('Error initializing BM25 engine:', error);
    throw new Error(`Failed to initialize BM25 engine: ${error}`);
  }
}

/**
 * Load existing documents from the database into the BM25 index
 */
async function loadDocumentsFromDb(): Promise<void> {
  if (!bm25Engine) return;
  
  try {
    // Check if the Snippet table exists by trying a count operation first
    try {
      await prisma.snippet.count();
    } catch (error: any) {
      if (error.code === 'P2021') {
        // Table doesn't exist yet, which is fine for a new database
        console.log('Snippet table does not exist yet. This is normal for a new database.');
        return;
      }
      // If it's another type of error, re-throw it
      throw error;
    }
    
    // If we got here, the table exists, so we can proceed to fetch snippets
    const snippets = await prisma.snippet.findMany({
      orderBy: {
        startTime: 'asc'
      }
    });
    
    console.log(`Loading ${snippets.length} documents into BM25 index`);
    
    // Add each snippet as a document
    for (const snippet of snippets) {
      if (snippet.text && snippet.text.trim() !== '') {
        const docId = currentDocId++;
        bm25Engine.addDoc({ text: snippet.text }, docId.toString());
        documentMap.set(docId, snippet.id);
      }
    }
    
    // Consolidate the added documents
    if (currentDocId > 0) {
      try {
        bm25Engine.consolidate();
        isConsolidated = true; // Mark as consolidated
        console.log(`BM25 index consolidated with ${currentDocId} documents`);
      } catch (error: any) {
        if (error.message && error.message.includes('document collection is too small for consolidation')) {
          console.log('Not enough documents for BM25 consolidation. This is normal for a new database.');
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('Error loading documents from database:', error);
    // Don't throw here, just log the error and continue
  }
}

/**
 * Add a document to the BM25 index
 */
export async function addDocument(snippetId: string, text: string): Promise<boolean> {
  try {
    if (!text || text.trim() === '') {
      console.warn(`Skipping empty text for snippet ${snippetId}`);
      return false;
    }
    
    if (!bm25Engine) {
      await initializeBM25Engine();
    }
    
    try {
      // Try to add the document to the current engine
      if (bm25Engine) {
        const docId = currentDocId++;
        bm25Engine.addDoc({ text }, docId.toString());
        documentMap.set(docId, snippetId);
        
        // Consolidate after adding new documents if not already consolidated
        if (!isConsolidated) {
          bm25Engine.consolidate();
          isConsolidated = true;
        }
        return true;
      }
    } catch (error: any) {
      // Check if the error is related to post-consolidation adding
      if (error.message && error.message.includes('post consolidation adding/learning is not possible')) {
        console.log('Reinitializing BM25 engine to add new documents...');
        
        // Store the current document mappings
        const oldDocumentMap = new Map(documentMap);
        
        // Reset the engine and reload from database (will include the new document)
        await resetBM25Index();
        
        // After reset, ensure the snippet is included (it should be, as it's in the database)
        const snippetInSearch = await searchDocuments(text, 10);
        const isIncluded = snippetInSearch.some(result => result.snippetId === snippetId);
        
        if (isIncluded) {
          console.log(`Document for snippet ${snippetId} successfully included in reinitialized index.`);
          return true;
        } else {
          console.warn(`Document for snippet ${snippetId} may not be included in the search index.`);
          return false;
        }
      } else {
        // If it's a different error, rethrow it
        throw error;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error adding document for snippet ${snippetId}:`, error);
    return false;
  }
}

/**
 * Search for documents in the BM25 index
 */
export async function searchDocuments(
  query: string,
  k: number = 5
): Promise<Array<{ snippetId: string; score: number }>> {
  try {
    if (!query || query.trim() === '') {
      return [];
    }
    
    if (!bm25Engine) {
      await initializeBM25Engine();
    }
    
    if (!bm25Engine || currentDocId === 0) {
      return [];
    }
    
    // Perform BM25 search
    const results = bm25Engine.search(query, k);
    
    // Map results to snippet IDs and scores
    return results
      .map((result: [string, number]) => {
        const [docId, score] = result;
        const docIdNum = parseInt(docId);
        return {
          snippetId: documentMap.get(docIdNum) || '',
          score
        };
      })
      .filter((result: { snippetId: string }) => result.snippetId !== '');
  } catch (error) {
    console.error('Error searching documents:', error);
    return [];
  }
}

/**
 * Get the BM25 index stats
 */
export function getBM25Stats(): { docCount: number; vocabSize: number } {
  if (!bm25Engine) {
    return { docCount: 0, vocabSize: 0 };
  }
  
  return { 
    docCount: currentDocId,
    vocabSize: bm25Engine.getTerms().length
  };
}

/**
 * Reset the BM25 index (useful for testing)
 */
export async function resetBM25Index(): Promise<void> {
  bm25Engine = null;
  documentMap.clear();
  currentDocId = 0;
  isConsolidated = false;
  await initializeBM25Engine();
}

/**
 * Get the terms (vocabulary) used in the BM25 index
 */
export function getBM25Terms(): string[] {
  if (!bm25Engine) {
    return [];
  }
  
  return bm25Engine.getTerms();
} 