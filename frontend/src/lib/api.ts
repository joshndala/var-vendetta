import { Mistake } from "../../types";
import axios from "axios";

// API base URL - change this to point to your backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

console.log('API Base URL:', API_BASE_URL); // Debug log

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.response?.data, error.config?.url);
    return Promise.reject(error);
  }
);

// Types matching our backend API
interface LogResponse {
  id: string;
  text: string;
  timestamp: Date;
  tags?: string[];
  sessionId?: string;
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
export async function logTranscript(text: string, timestamp: Date, sport?: string, sessionId?: string): Promise<LogResponse> {
  try {
    const response = await api.post<LogResponse>('/api/log', {
      text,
      timestamp: timestamp.toISOString(),
      sport,
      sessionId,
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
 * Get events for a session from the database
 */
export async function getEvents(sessionId: string): Promise<Array<{
  id: string;
  text: string;
  timestamp: Date;
  tags: string[];
  players: string[] | any[];
  eventType: string;
  analysisConfidence: number;
  sessionId: string;
}>> {
  try {
    const response = await api.get(`/api/get-events?sessionId=${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

/**
 * Create a new session
 */
export async function createSession(sport: string): Promise<{ success: boolean; sessionId: string }> {
  try {
    const response = await api.post('/api/create-session', { sport });
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Add players to a session
 */
export async function addPlayers(sessionId: string, players: Array<{ name: string; number?: string }>): Promise<any[]> {
  try {
    const response = await api.post(`/api/players?sessionId=${sessionId}`, { players });
    return response.data;
  } catch (error) {
    console.error('Error adding players:', error);
    throw error;
  }
}

/**
 * Get session information including sport
 */
export async function getSession(sessionId: string): Promise<{
  id: string;
  title: string;
  sport: string;
  created_at: string;
  start_time: string;
  ended_at?: string;
}> {
  try {
    const response = await api.get(`/api/get-session?sessionId=${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session:', error);
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