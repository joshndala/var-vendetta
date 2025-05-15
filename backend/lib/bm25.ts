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
    // Fetch all snippets from the database
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
      bm25Engine.consolidate();
      console.log(`BM25 index consolidated with ${currentDocId} documents`);
    }
  } catch (error) {
    console.error('Error loading documents from database:', error);
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
    
    if (bm25Engine) {
      const docId = currentDocId++;
      bm25Engine.addDoc({ text }, docId.toString());
      documentMap.set(docId, snippetId);
      
      // Consolidate after adding new documents
      bm25Engine.consolidate();
      return true;
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