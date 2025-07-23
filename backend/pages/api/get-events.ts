import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '../../lib/cors';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  text: string;
  timestamp: Date;
  tags: string[];
  players: any[];
  eventType: string;
  analysisConfidence: number;
  sessionId: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Event[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Fetch snippets (events) for the session with their tags and player info
    const { data: snippets, error } = await supabase
      .from('snippets')
      .select(`
        id,
        text,
        start_time,
        tags,
        players,
        event_type,
        analysis_confidence,
        session_id
      `)
      .eq('session_id', sessionId)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }

    // Transform the data to match frontend expectations
    const events: Event[] = snippets.map(snippet => ({
      id: snippet.id,
      text: snippet.text,
      timestamp: new Date(snippet.start_time),
      tags: snippet.tags || [],
      players: snippet.players || [],
      eventType: snippet.event_type || 'observation',
      analysisConfidence: snippet.analysis_confidence || 0.5,
      sessionId: snippet.session_id
    }));

    return res.status(200).json(events);
  } catch (error) {
    console.error('Error in get-events endpoint:', error);
    return res.status(500).json({ error: `Server error: ${error}` });
  }
}

export default withCors(handler); 