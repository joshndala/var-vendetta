import type { NextApiRequest, NextApiResponse } from 'next';
import { TranscriptionRequest, TranscriptionResponse } from '../../types';
import { withCors } from '../../lib/cors';

// This is a stub implementation 
// Frontend handles audio-to-text conversion, so this will be properly implemented later

function handler(
  req: NextApiRequest,
  res: NextApiResponse<TranscriptionResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simply return a success response with a note that this is not implemented yet
    return res.status(200).json({
      text: "Transcription is currently handled by the frontend. This endpoint is a placeholder for future implementation.",
      confidence: 1.0
    });
  } catch (error) {
    console.error('Error in transcribe endpoint:', error);
    return res.status(500).json({ error: `Transcription error: ${error}` });
  }
}

export default withCors(handler); 