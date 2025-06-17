import { Mistake } from "../../types";
import axios from "axios";

// API base URL - change this to point to your backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types matching our backend API
interface LogResponse {
  id: string;
  text: string;
  timestamp: Date;
}

interface EmbeddingResponse {
  embeddings: number[];
}

interface AskRefResponse {
  answer: string;
  sources: Array<{
    id: string;
    text: string;
    score: number;
    source: 'bm25' | 'faiss' | 'hybrid';
    sessionId: string;
    timestamp: Date;
  }>;
}

/**
 * Log a new transcript/mistake to the backend
 */
export async function logTranscript(text: string, timestamp: Date): Promise<LogResponse> {
  try {
    const response = await api.post<LogResponse>('/api/log', {
      text,
      timestamp: timestamp.toISOString(),
    });

    return response.data;
  } catch (error) {
    console.error('Error logging transcript:', error);
    throw error;
  }
}

/**
 * Generate embeddings for text
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await api.post<EmbeddingResponse>('/api/embed', { text });
    return response.data.embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Ask a question with reference to stored context
 */
export async function askQuestion(question: string): Promise<AskRefResponse> {
  try {
    const response = await api.post<AskRefResponse>('/api/ask-ref', { question });
    return response.data;
  } catch (error) {
    console.error('Error asking question:', error);
    throw error;
  }
}

/**
 * Convert a frontend Mistake to a backend log entry
 */
export async function logMistake(mistake: Mistake): Promise<LogResponse> {
  try {
    return await logTranscript(
      mistake.transcribedText || '',
      new Date(mistake.timestamp)
    );
  } catch (error) {
    console.error('Error logging mistake:', error);
    throw error;
  }
}

/**
 * End a session and reset the database
 */
export async function endSession(sessionId: string): Promise<boolean> {
  try {
    const response = await api.post('/api/reset-db', { sessionId });
    return response.data.success;
  } catch (error) {
    console.error('Error ending session:', error);
    return false;
  }
} 