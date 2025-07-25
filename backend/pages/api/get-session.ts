import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '../../lib/cors';
import { supabase } from '../../lib/supabase';

interface Session {
  id: string;
  title: string;
  sport: string;
  created_at: string;
  start_time: string;
  ended_at?: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Session | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Fetch session information
    const { data: session, error } = await supabase
      .from('sessions')
      .select('id, title, sport, created_at, start_time, ended_at')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.status(200).json(session);
  } catch (error) {
    console.error('Error in get-session endpoint:', error);
    return res.status(500).json({ error: `Server error: ${error}` });
  }
}

export default withCors(handler); 