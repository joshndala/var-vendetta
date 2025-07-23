import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '../../lib/cors';
import { supabase } from '../../lib/supabase';
import { Player } from '../../types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Player[] | Player | { error: string }>
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (req.method === 'GET') {
      // Get players for a session
      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching players:', error);
        return res.status(500).json({ error: 'Failed to fetch players' });
      }

      return res.status(200).json(players || []);
    }

    if (req.method === 'POST') {
      // Add players to a session
      const { players } = req.body;

      if (!players || !Array.isArray(players)) {
        return res.status(400).json({ error: 'Players array is required' });
      }

      // Validate players data
      const validPlayers = players.filter(player => 
        player.name && typeof player.name === 'string' && player.name.trim() !== ''
      );

      if (validPlayers.length === 0) {
        return res.status(400).json({ error: 'At least one valid player is required' });
      }

      // Insert players
      const playersToInsert = validPlayers.map(player => ({
        session_id: sessionId,
        name: player.name.trim(),
        number: player.number || null
      }));

      const { data: insertedPlayers, error } = await supabase
        .from('players')
        .insert(playersToInsert)
        .select();

      if (error) {
        console.error('Error inserting players:', error);
        return res.status(500).json({ error: 'Failed to insert players' });
      }

      return res.status(201).json(insertedPlayers);
    }

  } catch (error) {
    console.error('Error in players endpoint:', error);
    return res.status(500).json({ error: `Server error: ${error}` });
  }
}

export default withCors(handler); 