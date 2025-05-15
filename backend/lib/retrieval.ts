import { SearchResult, Snippet } from '../types';
import { searchDocuments } from './bm25';
import { searchSimilarEmbeddings } from './faiss';
import prisma from './prisma';

/**
 * Perform a hybrid search using both BM25 and FAISS
 */
export async function hybridSearch(
  query: string,
  embeddingVector: number[] | null = null,
  k: number = 5
): Promise<SearchResult[]> {
  // Perform BM25 search on text query
  const bm25Results = await searchDocuments(query, k);
  
  // If embedding vector is provided, perform FAISS search
  let faissResults: Array<{ snippetId: string; distance: number }> = [];
  if (embeddingVector) {
    faissResults = await searchSimilarEmbeddings(embeddingVector, k);
  }
  
  // Combine results
  const mergedResults = await mergeResults(bm25Results, faissResults, k);
  
  return mergedResults;
}

/**
 * Merge and re-rank results from BM25 and FAISS
 */
async function mergeResults(
  bm25Results: Array<{ snippetId: string; score: number }>,
  faissResults: Array<{ snippetId: string; distance: number }>,
  k: number = 5
): Promise<SearchResult[]> {
  // Get unique snippet IDs from both result sets
  const snippetIds = new Set<string>();
  
  // Add non-empty IDs
  bm25Results.forEach(r => { if (r.snippetId) snippetIds.add(r.snippetId); });
  faissResults.forEach(r => { if (r.snippetId) snippetIds.add(r.snippetId); });

  // If no valid snippet IDs, return empty results
  if (snippetIds.size === 0) {
    return [];
  }

  // Fetch all snippets in one database query
  const snippets = await prisma.snippet.findMany({
    where: {
      id: {
        in: Array.from(snippetIds)
      }
    }
  });

  // Create a map for quick lookup
  const snippetMap = new Map<string, Snippet>();
  snippets.forEach((snippet: any) => {
    snippetMap.set(snippet.id, snippet as Snippet);
  });

  // Create result objects for BM25 results
  const bm25SearchResults: SearchResult[] = [];
  for (const result of bm25Results) {
    const snippet = snippetMap.get(result.snippetId);
    if (snippet) {
      bm25SearchResults.push({
        id: snippet.id,
        text: snippet.text,
        score: result.score,
        source: 'bm25',
        sessionId: snippet.sessionId,
        timestamp: snippet.startTime
      });
    }
  }

  // Create result objects for FAISS results
  const faissSearchResults: SearchResult[] = [];
  for (const result of faissResults) {
    const snippet = snippetMap.get(result.snippetId);
    if (snippet) {
      // Convert distance to score (lower distance = higher score)
      const score = 1 / (1 + result.distance);
      faissSearchResults.push({
        id: snippet.id,
        text: snippet.text,
        score,
        source: 'faiss',
        sessionId: snippet.sessionId,
        timestamp: snippet.startTime
      });
    }
  }
  
  // Combine all results
  const allResults = [...bm25SearchResults, ...faissSearchResults];
  
  // Sort by score and pick top-k
  const sortedResults = allResults.sort((a, b) => b.score - a.score);
  
  // Deduplicate results based on snippet ID
  const uniqueResults: SearchResult[] = [];
  const seenIds = new Set<string>();
  
  for (const result of sortedResults) {
    if (!seenIds.has(result.id)) {
      seenIds.add(result.id);
      
      // Mark as hybrid if it appears in both search results
      const isInBm25 = bm25Results.some(r => r.snippetId === result.id);
      const isInFaiss = faissResults.some(r => r.snippetId === result.id);
      
      if (isInBm25 && isInFaiss) {
        result.source = 'hybrid';
        // Potentially adjust score when found in both sources
        result.score *= 1.2; // Boost hybrid results
      }
      
      uniqueResults.push(result);
      
      if (uniqueResults.length >= k) {
        break;
      }
    }
  }
  
  return uniqueResults;
} 