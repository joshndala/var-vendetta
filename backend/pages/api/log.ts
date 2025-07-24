import type { NextApiRequest, NextApiResponse } from 'next';
import { LogRequest, LogResponse } from '../../types';
import { supabase } from '../../lib/supabase';
import { addDocument } from '../../lib/bm25';
import { withCors } from '../../lib/cors';
import { getTagsForSport } from '../../lib/sport-config';
import { PlayerDetectionService } from '../../lib/player-detection';
import axios from 'axios';
import { sanitizeError, safeLog } from '../../lib/env-validation';

// This is a stub implementation
// Frontend handles audio-to-text conversion, so this will be properly implemented later

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timestamp, text, sport = 'general', sessionId: providedSessionId } = req.body;
    
    if (!text || !timestamp) {
      return res.status(400).json({ error: 'Text and timestamp are required' });
    }
    
    // Check if database is initialized
    try {
      const { count, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log('Database not initialized yet');
        return res.status(500).json({ error: 'Database not ready' });
      }
    } catch (error) {
      console.log('Database not initialized yet');
      return res.status(500).json({ error: 'Database not ready' });
    }
    
    // Use provided session ID or create/get current session
    let sessionId: string;
    
    if (providedSessionId) {
      // Use the session ID provided by the frontend
      sessionId = providedSessionId;
      
      // Verify the session exists
      const { data: existingSession, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (sessionError || !existingSession) {
        console.error('Session not found:', sessionError);
        return res.status(404).json({ error: 'Session not found' });
      }
    } else {
      // Fallback: create or get current session (for backward compatibility)
      const { data: activeSession, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .is('ended_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (activeSession) {
        sessionId = activeSession.id;
      } else {
        const { data: newSession, error: createError } = await supabase
          .from('sessions')
          .insert({
            title: `CoachDeck Session ${new Date().toISOString().slice(0, 10)}`,
            sport: sport
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating session:', createError);
          return res.status(500).json({ error: 'Failed to create session' });
        }
        
        sessionId = newSession.id;
      }
    }
    
    // Create transcript record
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        session_id: sessionId,
        text,
        timestamp: new Date(timestamp),
        audio_path: 'placeholder' // Not storing audio for now
      })
      .select()
      .single();
    
    if (transcriptError) {
      console.error('Error creating transcript:', transcriptError);
      return res.status(500).json({ error: 'Failed to create transcript' });
    }
    
    // Separate events and get tags for each
    let separatedEvents: any[] = [];
    try {
      const separateRes = await axios.post(
        '/api/separate-events',
        { text, sport, sessionId },
        { headers: { 'Content-Type': 'application/json' } }
      );
      separatedEvents = separateRes.data.events || [];
    } catch (separateError) {
      console.error('Error separating events:', separateError);
      // Fallback: treat as single event
      separatedEvents = [{
        text: text,
        tags: getTagsForSport(sport).slice(0, 3),
        players: [],
        eventType: 'observation',
        confidence: 0.5
      }];
    }
    
    // Get players for this session
    let players: any[] = [];
    try {
      const { data: sessionPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionId);
      
      if (sessionPlayers && sessionPlayers.length > 0) {
        players = sessionPlayers;
      }
    } catch (playerError) {
      console.error('Error fetching players:', playerError);
    }
    
    // Create snippets for each separated event
    const createdSnippets: any[] = [];
    
    for (const event of separatedEvents) {
      // Use the separated event data or fall back to player detection
      let eventPlayers = event.players || [];
      let eventType = event.eventType || 'observation';
      let confidence = event.confidence || 0.5;
      
      // If no players detected in separation, try player detection
      if (eventPlayers.length === 0 && players.length > 0) {
        try {
          const playerDetectionService = new PlayerDetectionService();
          const playerAnalysis = await playerDetectionService.analyzeEvent(event.text, players);
          eventPlayers = playerAnalysis.players;
          eventType = playerAnalysis.eventType;
          confidence = playerAnalysis.confidence;
        } catch (playerError) {
          console.error('Error in player detection for event:', playerError);
        }
      }
      
      // Create a snippet for this event
      const { data: snippet, error: snippetError } = await supabase
        .from('snippets')
        .insert({
          session_id: sessionId,
          transcript_id: transcript.id,
          text: event.text,
          start_time: new Date(timestamp),
          end_time: new Date(timestamp), // TODO: Calculate actual end time
          tags: event.tags, // Store as JSONB array
          players: eventPlayers, // Store player matches
          event_type: eventType, // Store event type
          analysis_confidence: confidence // Store analysis confidence
        })
        .select()
        .single();
      
      if (snippetError) {
        console.error('Error creating snippet for event:', snippetError);
        continue; // Skip this event but continue with others
      }
      
      // Add document to BM25 index
      await addDocument(snippet.id, event.text);
      
      // Generate and store embeddings for FAISS search
      try {
        const embedResponse = await axios.post(
          '/api/embed',
          { text: event.text },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (embedResponse.data.embeddings) {
          // Update snippet with embeddings
          const { error: updateError } = await supabase
            .from('snippets')
            .update({ embeddings: embedResponse.data.embeddings })
            .eq('id', snippet.id);
          
          if (updateError) {
            console.error('Error storing embeddings:', updateError);
          } else {
            safeLog('Embeddings stored successfully for snippet ID:', { id: snippet.id });
          }
        }
      } catch (embedError) {
        console.error('Error generating embeddings:', embedError);
        // Continue without embeddings - BM25 will still work
      }
      
      createdSnippets.push({
        id: snippet.id,
        text: event.text,
        timestamp: new Date(timestamp),
        tags: event.tags,
        sessionId: sessionId,
        players: eventPlayers,
        eventType: eventType,
        analysisConfidence: confidence
      });
    }
    
    // Return the first snippet as the main response (for backward compatibility)
    // The frontend will get all events from the get-events endpoint
    if (createdSnippets.length > 0) {
      return res.status(200).json(createdSnippets[0]);
    } else {
      return res.status(500).json({ error: 'Failed to create any snippets' });
    }
  } catch (error) {
    console.error('Error in log endpoint:', error);
    return res.status(500).json({ error: `Server error: ${error}` });
  }
}

export default withCors(handler); 