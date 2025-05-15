import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '../../lib/cors';

function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ 
    status: 'success',
    message: 'API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      '/api/test': 'This endpoint (GET)',
      '/api/log': 'Log text with timestamp (POST)',
      '/api/transcribe': 'Placeholder for transcription (POST)',
      '/api/embed': 'Generate embeddings for text (POST)',
      '/api/ask-ref': 'Question answering with context (POST)'
    }
  });
}

export default withCors(handler); 