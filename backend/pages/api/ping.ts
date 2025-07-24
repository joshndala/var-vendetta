import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '../../lib/cors';

function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
}

export default withCors(handler); 