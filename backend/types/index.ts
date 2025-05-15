export interface Session {
  id: string;
  createdAt: Date;
  endedAt?: Date;
  title?: string;
}

export interface Transcript {
  id: string;
  sessionId: string;
  text: string;
  timestamp: Date;
  audioPath: string;
}

export interface Mistake {
  id: string;
  sessionId: string;
  transcriptId: string;
  text: string;
  timestamp: Date;
  correction?: string;
}

export interface Snippet {
  id: string;
  sessionId: string;
  transcriptId: string;
  text: string;
  startTime: Date;
  endTime: Date;
  embeddings?: number[];
}

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  source: 'bm25' | 'faiss' | 'hybrid';
  sessionId: string;
  timestamp: Date;
}

export interface TranscriptionRequest {
  audioBlob: Blob;
}

export interface TranscriptionResponse {
  text: string;
  confidence?: number;
}

export interface EmbeddingRequest {
  text: string;
}

export interface EmbeddingResponse {
  embeddings: number[];
}

export interface LogRequest {
  timestamp: Date;
  audioBlob: Blob;
}

export interface LogResponse {
  id: string;
  text: string;
  timestamp: Date;
}

export interface AskRefRequest {
  question: string;
}

export interface AskRefResponse {
  answer: string;
  sources: SearchResult[];
} 