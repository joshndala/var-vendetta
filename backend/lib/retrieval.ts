import { SearchResult, Snippet } from '../types';
import { searchDocuments } from './bm25';
import { searchSimilarEmbeddings } from './faiss';
import prisma from './prisma';

// Constants for weighting the different search methods
const BM25_WEIGHT = 0.6;
const FAISS_WEIGHT = 0.4;

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

  // Find max score for BM25 for normalization
  const maxBm25Score = bm25Results.length > 0 
    ? Math.max(...bm25Results.map(r => r.score))
    : 1;

  // Find min and max distance for FAISS for normalization
  const distances = faissResults.map(r => r.distance);
  const minDistance = distances.length > 0 ? Math.min(...distances) : 0;
  const maxDistance = distances.length > 0 ? Math.max(...distances) : 1;
  const distanceRange = maxDistance - minDistance;

  // Create a map of normalized scores
  const bm25ScoreMap = new Map<string, number>();
  const faissScoreMap = new Map<string, number>();

  // Normalize BM25 scores (0-1 range)
  bm25Results.forEach(result => {
    const normalizedScore = result.score / maxBm25Score;
    bm25ScoreMap.set(result.snippetId, normalizedScore);
  });

  // Normalize FAISS distances to scores (0-1 range, higher is better)
  faissResults.forEach(result => {
    // Convert distance to score (lower distance = higher score)
    // If all distances are the same, default to 1.0
    const normalizedScore = distanceRange === 0 
      ? 1.0 
      : 1 - ((result.distance - minDistance) / distanceRange);
    faissScoreMap.set(result.snippetId, normalizedScore);
  });

  // Create a combined result set with weighted scores
  const combinedResults: SearchResult[] = [];
  
  // Process all unique snippet IDs
  for (const snippetId of Array.from(snippetIds)) {
    const snippet = snippetMap.get(snippetId);
    if (!snippet) continue;
    
    // Check if this result is in each result set
    const isInBm25 = bm25ScoreMap.has(snippetId);
    const isInFaiss = faissScoreMap.has(snippetId);
    
    // Get normalized scores (default to 0 if not present)
    const bm25ScoreNorm = bm25ScoreMap.get(snippetId) || 0;
    const faissScoreNorm = faissScoreMap.get(snippetId) || 0;
    
    // Calculate weighted score based on presence in each result set
    let finalScore = 0;
    let source: 'bm25' | 'faiss' | 'hybrid' = 'hybrid';
    
    if (isInBm25 && isInFaiss) {
      // If in both, use weighted combination
      finalScore = (BM25_WEIGHT * bm25ScoreNorm) + (FAISS_WEIGHT * faissScoreNorm);
      source = 'hybrid';
    } else if (isInBm25) {
      // If only in BM25, use BM25 score
      finalScore = bm25ScoreNorm;
      source = 'bm25';
    } else if (isInFaiss) {
      // If only in FAISS, use FAISS score
      finalScore = faissScoreNorm;
      source = 'faiss';
    }
    
    // Add to combined results
    combinedResults.push({
      id: snippet.id,
      text: snippet.text,
      score: finalScore,
      source,
      sessionId: snippet.sessionId,
      timestamp: snippet.startTime
    });
  }
  
  // Sort by combined score and pick top-k
  const sortedResults = combinedResults.sort((a, b) => b.score - a.score);
  
  // Return top-k results
  return sortedResults.slice(0, k);
} 