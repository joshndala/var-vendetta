import { IndexFlatL2 } from 'faiss-node';
import { Snippet } from '../types';
import { supabase } from './supabase';

// Define the dimensionality based on the embedding model used
// Cohere embed-english-v3.0 model produces 1024-dimensional embeddings
const EMBEDDING_DIMENSION = 1024;

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
    // Check if the Snippet table exists by trying a count operation first
    try {
      const { count, error } = await supabase
        .from('snippets')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log('Snippet table does not exist yet. This is normal for a new database.');
        return;
      }
    } catch (error) {
      console.log('Snippet table does not exist yet. This is normal for a new database.');
      return;
    }
    
    // Get all snippets with embeddings
    const { data: snippets, error } = await supabase
      .from('snippets')
      .select('*')
      .not('embeddings', 'is', null);
    
    if (error) {
      console.error('Error fetching snippets with embeddings:', error);
      return;
    }
    
    console.log(`Loading ${snippets.length} embeddings from database`);
    
    for (let i = 0; i < snippets.length; i++) {
      const snippet = snippets[i];
      if (snippet.embeddings) {
        try {
          // Embeddings are already JSONB arrays, no need to parse
          const embeddings = snippet.embeddings as number[];
          
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
          console.error(`Error processing embeddings for snippet ${snippet.id}:`, parseError);
        }
      }
    }
  } catch (error) {
    console.error('Error loading embeddings from database:', error);
    // Don't throw here to allow the application to continue
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
      const { error } = await supabase
        .from('snippets')
        .update({ embeddings: embedding })
        .eq('id', snippetId);
      
      if (error) {
        console.error('Error storing embedding in database:', error);
        return false;
      }
      
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