import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '../../lib/cors';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const corsOrigin = process.env.CORS_ORIGIN;
  const allowedOrigins = corsOrigin ? corsOrigin.split(',').map(o => o.trim()) : [];
  const origin = req.headers.origin || '';

  return res.status(200).json({
    message: 'CORS test successful',
    corsOrigin,
    allowedOrigins,
    incomingOrigin: origin,
    isAllowed: allowedOrigins.includes('*') || allowedOrigins.includes(origin),
    method: req.method,
    headers: {
      'access-control-allow-origin': res.getHeader('Access-Control-Allow-Origin'),
      'access-control-allow-methods': res.getHeader('Access-Control-Allow-Methods'),
      'access-control-allow-headers': res.getHeader('Access-Control-Allow-Headers'),
      'access-control-allow-credentials': res.getHeader('Access-Control-Allow-Credentials'),
    }
  });
}

export default withCors(handler); 