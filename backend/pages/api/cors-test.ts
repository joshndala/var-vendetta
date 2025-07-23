import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '../../lib/cors';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    res.status(200).json({ 
      status: 'CORS test successful',
      timestamp: new Date().toISOString(),
      corsOrigin: process.env.CORS_ORIGIN,
      requestOrigin: req.headers.origin,
      method: req.method
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'CORS test failed' 
    });
  }
}

export default withCors(handler); 