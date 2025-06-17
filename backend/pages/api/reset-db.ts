import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import { resetBM25Index } from '../../lib/bm25';
import { resetFaissIndex } from '../../lib/faiss';
import { withCors } from '../../lib/cors';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean, message: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the session ID from the request body
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    console.log(`Cleaning up session: ${sessionId}`);

    // First, reset search indexes 
    console.log('Resetting BM25 index...');
    await resetBM25Index();
    
    console.log('Resetting FAISS index...');
    await resetFaissIndex();

    // Delete all records in reverse order of dependencies
    console.log('Deleting all records...');
    await prisma.$transaction([
      prisma.mistake.deleteMany({}),
      prisma.snippet.deleteMany({}),
      prisma.transcript.deleteMany({}),
      prisma.session.deleteMany({})
    ]);

    return res.status(200).json({ 
      success: true, 
      message: 'Session ended and all data cleared successfully' 
    });
  } catch (error) {
    console.error('Error in reset-db endpoint:', error);
    return res.status(500).json({ 
      success: false,
      message: `Error resetting database: ${error}`
    });
  }
}

export default withCors(handler); 