import type { NextApiRequest, NextApiResponse } from 'next';

type NextApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void;

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
export function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: (req: NextApiRequest, res: NextApiResponse, next: (error?: any) => void) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// CORS middleware handler
export function withCors(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const corsOrigin = process.env.CORS_ORIGIN;
    if (!corsOrigin) {
      console.error('CORS_ORIGIN environment variable is not set');
      return res.status(500).json({ error: 'CORS configuration error' });
    }

    const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
    const origin = req.headers.origin || '';
    const isAllowedOrigin =
      allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');

    if (!isAllowedOrigin) {
      console.warn(`Blocked CORS request from disallowed origin: ${origin}`);
      return res.status(403).json({ error: 'Origin not allowed by CORS' });
    }

    // ✅ Set headers for all responses, including preflight
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // ✅ Respond to preflight OPTIONS requests immediately
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    return handler(req, res);
  };
}