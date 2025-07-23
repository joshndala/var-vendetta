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
    // Get allowed origins from environment variable or use default
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',') 
      : ['http://localhost:3000', 'https://your-frontend-domain.vercel.app'];
    
    const origin = req.headers.origin;
    const isAllowedOrigin = allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin));
    
    // Set CORS headers
    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-Requested-With, Content-Type, Accept, Authorization'
    );

    // Handle OPTIONS method
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Continue with the actual handler
    return handler(req, res);
  };
} 