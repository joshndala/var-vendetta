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
    // Get allowed origins from environment variable
    const corsOrigin = process.env.CORS_ORIGIN;
    if (!corsOrigin) {
      console.error('CORS_ORIGIN environment variable is not set');
      return res.status(500).json({ error: 'CORS configuration error' });
    }
    
    const allowedOrigins: string[] = corsOrigin.split(',').map(origin => origin.trim());
    
    const origin = req.headers.origin;
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('CORS Debug:', {
        corsOrigin,
        allowedOrigins,
        requestOrigin: origin,
        method: req.method
      });
    }
    
    // Check if origin is allowed
    const isAllowedOrigin = allowedOrigins.includes('*') || 
                           (origin && allowedOrigins.includes(origin));
    
    // Set CORS headers for non-OPTIONS requests
    if (origin && isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      return res.status(403).json({ error: 'Origin not allowed by CORS' });
    }

    // Handle OPTIONS method (preflight request)
    if (req.method === 'OPTIONS') {
      if (origin && isAllowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.status(200).end();
        return;
      } else {
        return res.status(403).json({ error: 'Origin not allowed by CORS' });
      }
    }

    // Continue with the actual handler
    return handler(req, res);
  };
} 