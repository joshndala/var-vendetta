import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '../../lib/cors';

function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Sample data for each API endpoint
  const samples = {
    log: {
      endpoint: '/api/log',
      method: 'POST',
      description: 'Log text with timestamp',
      sampleRequest: {
        text: "This is a sample transcript to be logged.",
        timestamp: new Date().toISOString()
      }
    },
    embed: {
      endpoint: '/api/embed',
      method: 'POST',
      description: 'Generate embeddings for text',
      sampleRequest: {
        text: "This is a sample text to generate embeddings for."
      }
    },
    askRef: {
      endpoint: '/api/ask-ref',
      method: 'POST',
      description: 'Question answering with context',
      sampleRequest: {
        question: "What was discussed about APIs?"
      }
    },
    transcribe: {
      endpoint: '/api/transcribe',
      method: 'POST',
      description: 'Placeholder for transcription',
      sampleRequest: {
        // Normally would include audioBlob, but it's not needed for now
        text: "This is for testing only as transcription is handled by frontend"
      }
    }
  };

  // Return sample data for the specified endpoint or all endpoints
  const endpoint = req.query.endpoint as string;
  if (endpoint && samples[endpoint as keyof typeof samples]) {
    res.status(200).json(samples[endpoint as keyof typeof samples]);
  } else {
    res.status(200).json(samples);
  }
}

export default withCors(handler); 