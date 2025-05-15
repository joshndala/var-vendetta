import { IndexFlatL2 } from 'faiss-node';
import { Snippet } from '../types';
import prisma from './prisma';

// Define the dimensionality based on the embedding model used
// all-MiniLM-L6-v2 model produces 384-dimensional embeddings
const EMBEDDING_DIMENSION = 384;

let faissIndex: IndexFlatL2 | null = null;
const snippetMap: Map<number, string> = new Map(); // Map FAISS IDs to Snippet IDs

/**
 * Initialize the FAISS index
 */
export async function initializeFaissIndex(): Promise<void> {
  try {
    if (!faissIndex) {
      console.log('Initializing FAISS index with dimension:', EMBEDDING_DIMENSION);
      faissIndex = new IndexFlatL2(EMBEDDING_DIMENSION);
      
      // Load existing embeddings from the database
      await loadEmbeddingsFromDb();
      console.log(`FAISS index initialized with ${faissIndex.ntotal()} vectors`);
    }
  } catch (error) {
    console.error('Error initializing FAISS index:', error);
    throw new Error(`Failed to initialize FAISS index: ${error}`);
  }
}

/**
 * Load existing embeddings from the database into the FAISS index
 */
async function loadEmbeddingsFromDb(): Promise<void> {
  if (!faissIndex) return;
  
  try {
    // Get all snippets with embeddings
    const snippets = await prisma.snippet.findMany({
      where: {
        embeddings: {
          not: null
        }
      }
    });
    
    console.log(`Loading ${snippets.length} embeddings from database`);
    
    for (let i = 0; i < snippets.length; i++) {
      const snippet = snippets[i];
      if (snippet.embeddings) {
        try {
          // Parse embeddings from JSON string
          const embeddings = JSON.parse(snippet.embeddings) as number[];
          
          // Validate embedding dimensions
          if (embeddings.length !== EMBEDDING_DIMENSION) {
            console.warn(`Skipping embedding for snippet ${snippet.id}: expected dimension ${EMBEDDING_DIMENSION}, got ${embeddings.length}`);
            continue;
          }
          
          // Add to FAISS index and map the index to snippet ID
          const currentIndex = faissIndex.ntotal();
          faissIndex.add(embeddings);
          snippetMap.set(currentIndex, snippet.id);
        } catch (parseError) {
          console.error(`Error parsing embeddings for snippet ${snippet.id}:`, parseError);
        }
      }
    }
  } catch (error) {
    console.error('Error loading embeddings from database:', error);
  }
}

/**
 * Add an embedding to the FAISS index
 */
export async function addEmbedding(snippetId: string, embedding: number[]): Promise<boolean> {
  try {
    // Validate embedding dimensions
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(`Invalid embedding dimension: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`);
    }
    
    if (!faissIndex) {
      await initializeFaissIndex();
    }
    
    if (faissIndex) {
      // Add to FAISS index and map the index to snippet ID
      const newIndex = faissIndex.ntotal();
      faissIndex.add(embedding);
      snippetMap.set(newIndex, snippetId);
      
      // Store the embedding in the database
      await prisma.snippet.update({
        where: { id: snippetId },
        data: { embeddings: JSON.stringify(embedding) }
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error adding embedding for snippet ${snippetId}:`, error);
    return false;
  }
}

/**
 * Search for similar embeddings in the FAISS index
 */
export async function searchSimilarEmbeddings(
  embedding: number[],
  k: number = 5
): Promise<Array<{ snippetId: string; distance: number }>> {
  try {
    // Validate embedding dimensions
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(`Invalid embedding dimension: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`);
    }
    
    if (!faissIndex) {
      await initializeFaissIndex();
    }
    
    if (!faissIndex || faissIndex.ntotal() === 0) {
      return [];
    }
    
    // Limit k to the number of vectors in the index
    const adjustedK = Math.min(k, faissIndex.ntotal());
    
    // Perform vector search
    const searchResults = faissIndex.search(embedding, adjustedK);
    
    // Map results to snippet IDs and filter out any invalid results
    return searchResults.labels.map((label, i) => ({
      snippetId: snippetMap.get(label) || '',
      distance: searchResults.distances[i]
    })).filter(result => result.snippetId !== '');
  } catch (error) {
    console.error('Error searching similar embeddings:', error);
    return [];
  }
}

/**
 * Get the FAISS index stats
 */
export function getFaissStats(): { ntotal: number; dimension: number } {
  if (!faissIndex) {
    return { ntotal: 0, dimension: EMBEDDING_DIMENSION };
  }
  
  return { 
    ntotal: faissIndex.ntotal(),
    dimension: EMBEDDING_DIMENSION
  };
}

/**
 * Reset the FAISS index (useful for testing or when reindexing)
 */
export async function resetFaissIndex(): Promise<void> {
  faissIndex = null;
  snippetMap.clear();
  await initializeFaissIndex();
} 