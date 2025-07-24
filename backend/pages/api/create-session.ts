import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '../../lib/cors';
import { supabase } from '../../lib/supabase';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; sessionId: string; error?: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, sessionId: '', error: 'Method not allowed' });
  }

  try {
    const { sport = 'general' } = req.body;
    
    // Generate a unique session ID
    const sessionId = crypto.randomUUID();

    // Create new session with the generated ID
    const { data: newSession, error: createError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        title: `CoachDeck Session ${new Date().toISOString().slice(0, 10)}`,
        sport: sport
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating session:', createError);
      return res.status(500).json({ success: false, sessionId: '', error: 'Failed to create session' });
    }

    return res.status(201).json({ success: true, sessionId: newSession.id });
  } catch (error) {
    console.error('Error in create-session endpoint:', error);
    return res.status(500).json({ success: false, sessionId: '', error: `Server error: ${error}` });
  }
}

export default withCors(handler); 

export const config = {
  api: {
    bodyParser: false,
  },
};