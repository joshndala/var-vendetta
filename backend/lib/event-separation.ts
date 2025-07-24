import { CohereClient } from 'cohere-ai';
import { supabase } from './supabase';

interface SeparatedEvent {
  text: string;
  tags: string[];
  players: string[];
  eventType: 'player' | 'team' | 'observation' | 'opponent';
  confidence: number;
}

export async function separateEvents(
  text: string, 
  sport: string = 'general', 
  sessionId?: string
): Promise<SeparatedEvent[]> {
  const cohereApiKey = process.env.COHERE_API_KEY;
  if (!cohereApiKey) {
    throw new Error('Cohere API key is not set');
  }

  const cohere = new CohereClient({
    token: cohereApiKey,
  });

  // Fetch players for this session if sessionId is provided
  let availablePlayers: string[] = [];
  if (sessionId) {
    try {
      const { data: sessionPlayers } = await supabase
        .from('players')
        .select('name, number')
        .eq('session_id', sessionId);
      
      if (sessionPlayers && sessionPlayers.length > 0) {
        availablePlayers = sessionPlayers.map(p => 
          p.number ? `${p.name} (#${p.number})` : p.name
        );
      }
    } catch (playerError) {
      console.error('Error fetching players:', playerError);
    }
  }

  // Sport-specific event types
  const sportEvents = {
    basketball: ['shot', 'pass', 'rebound', 'defense', 'fast_break', 'pick_and_roll', 'three_pointer', 'layup', 'dunk', 'free_throw', 'assist', 'steal', 'block', 'turnover', 'foul'],
    football: ['tackle', 'pass', 'run', 'interception', 'field_goal', 'touchdown', 'sack', 'block', 'catch', 'fumble', 'penalty', 'punt', 'kickoff', 'conversion', 'safety'],
    soccer: ['pass', 'shot', 'tackle', 'header', 'cross', 'free_kick', 'corner', 'offside', 'foul', 'yellow_card', 'red_card', 'penalty', 'save', 'dribble', 'interception', 'clearance', 'goal', 'assist'],
    tennis: ['serve', 'volley', 'baseline', 'net_play', 'ace', 'double_fault', 'winner', 'unforced_error', 'forehand', 'backhand', 'lob', 'drop_shot', 'approach_shot', 'passing_shot', 'break_point', 'set_point'],
    esports: ['gank', 'farm', 'push', 'defend', 'rotate', 'ultimate', 'combo', 'objective', 'teamfight', 'split_push', 'ward', 'vision', 'draft', 'macro', 'micro', 'communication', 'tilt'],
    general: ['action', 'outcome', 'quality', 'effort', 'decision', 'execution', 'teamwork', 'communication', 'focus', 'energy', 'strategy', 'tactics']
  };

  const availableEvents = sportEvents[sport as keyof typeof sportEvents] || sportEvents.general;

  // Build the system prompt with available players if any
  let playerContext = '';
  if (availablePlayers.length > 0) {
    playerContext = `\n\nAvailable players in this session: ${availablePlayers.join(', ')}\nIMPORTANT: Only use player names from this list. If a player is mentioned by number only, try to match it to the available players.`;
  }

  const systemPrompt = `You are a sports event separator. Your job is to break down a sports log entry into separate individual events.

Available event types: ${availableEvents.join(', ')}${playerContext}

CRITICAL: You MUST separate the input text into multiple events if it contains multiple actions or players.

Rules:
1. Each event should be a complete, standalone action
2. Separate events that involve different players or different actions
3. If one action leads to another (like a pass leading to a goal), separate them
4. Each event should have its own tags and players involved
5. IMPORTANT: Always separate compound sentences with multiple actions
6. Look for punctuation marks like "!", ".", "and", "then", "but" that indicate separate events
7. Even if sentences are connected with commas, separate them if they describe different actions
8. Pay attention to context - if one action enables another, they are separate events
9. For player names: ${availablePlayers.length > 0 ? 'Only use names from the available players list. If someone is mentioned by number, try to match it to a player with that number.' : 'Extract player names mentioned in the text.'}
10. Return a JSON array of objects with this structure:
   [
     {
       "text": "description of this specific event",
       "tags": ["relevant", "tags"],
       "players": ["player names mentioned"],
       "eventType": "player|team|observation|opponent",
       "confidence": 0.0-1.0
     }
   ]`;

  const userPrompt = `Log entry: ${text}`;

  try {
    const response = await cohere.chat({
      message: userPrompt,
      model: 'command-r-plus',
      preamble: systemPrompt,
      temperature: 0.1,
      maxTokens: 1000,
    });

    let cleanContent = response.text.trim();
    
    // Remove markdown code blocks if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const separatedEvents = JSON.parse(cleanContent);
    
    // Validate the response structure
    if (!Array.isArray(separatedEvents)) {
      throw new Error('Invalid response format: expected array');
    }

    return separatedEvents.map(event => ({
      text: event.text || '',
      tags: Array.isArray(event.tags) ? event.tags : [],
      players: Array.isArray(event.players) ? event.players : [],
      eventType: event.eventType || 'observation',
      confidence: typeof event.confidence === 'number' ? event.confidence : 0.5
    }));

  } catch (error) {
    console.error('Error in event separation:', error);
    // Fallback: return single event
    return [{
      text: text,
      tags: [],
      players: [],
      eventType: 'observation',
      confidence: 0.5
    }];
  }
} 