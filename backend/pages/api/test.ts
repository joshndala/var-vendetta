import type { NextApiRequest, NextApiResponse } from 'next';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple health check without requiring environment variables
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      message: 'Backend is running'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default handler; 