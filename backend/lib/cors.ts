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
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
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