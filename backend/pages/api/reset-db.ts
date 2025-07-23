import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { resetBM25Index } from '../../lib/bm25';
import { resetFaissIndex } from '../../lib/faiss';
import { withCors } from '../../lib/cors';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean, message: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the session ID from the request body
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    console.log(`Cleaning up session: ${sessionId}`);

    // First, reset search indexes 
    console.log('Resetting BM25 index...');
    await resetBM25Index();
    
    console.log('Resetting FAISS index...');
    await resetFaissIndex();

    // Delete all records for this session in reverse order of dependencies
    console.log('Deleting session records...');
    
    // Delete snippets first (they reference transcripts)
    const { error: snippetsError } = await supabase
      .from('snippets')
      .delete()
      .eq('session_id', sessionId);
    
    if (snippetsError) {
      console.error('Error deleting snippets:', snippetsError);
    }

    // Delete transcripts
    const { error: transcriptsError } = await supabase
      .from('transcripts')
      .delete()
      .eq('session_id', sessionId);
    
    if (transcriptsError) {
      console.error('Error deleting transcripts:', transcriptsError);
    }

    // Delete players
    const { error: playersError } = await supabase
      .from('players')
      .delete()
      .eq('session_id', sessionId);
    
    if (playersError) {
      console.error('Error deleting players:', playersError);
    }

    // Mark session as ended (or delete it)
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId);
    
    if (sessionError) {
      console.error('Error updating session:', sessionError);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Session ended and all data cleared successfully' 
    });
  } catch (error) {
    console.error('Error in reset-db endpoint:', error);
    return res.status(500).json({ 
      success: false,
      message: `Error resetting database: ${error}`
    });
  }
}

export default withCors(handler); 