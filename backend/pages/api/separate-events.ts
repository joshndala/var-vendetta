import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '../../lib/cors';
import { CohereClient } from 'cohere-ai';

interface SeparatedEvent {
  text: string;
  tags: string[];
  players: string[];
  eventType: 'player' | 'team' | 'observation' | 'opponent';
  confidence: number;
}

const cohereApiKey = process.env.COHERE_API_KEY;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!cohereApiKey) {
    return res.status(500).json({ error: 'Cohere API key is not set' });
  }

  const cohere = new CohereClient({
    token: cohereApiKey,
  });

  try {
    const { text, sport = 'general' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
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

    const systemPrompt = `You are a sports event separator. Your job is to break down a sports log entry into separate individual events.

Available event types: ${availableEvents.join(', ')}

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
9. Return a JSON array of objects with this structure:
   [
     {
       "text": "description of this specific event",
       "tags": ["relevant", "tags"],
       "players": ["player names mentioned"],
       "eventType": "player|team|observation|opponent",
       "confidence": 0.0-1.0
     }
   ]

Examples:
Input: "Ben made an amazing pass! Josh finished from it, it's 1-0."
Output: [
  {
    "text": "Ben made an amazing pass",
    "tags": ["pass", "assist"],
    "players": ["Ben"],
    "eventType": "player",
    "confidence": 0.9
  },
  {
    "text": "Josh finished from it, it's 1-0",
    "tags": ["goal"],
    "players": ["Josh"],
    "eventType": "player", 
    "confidence": 0.9
  }
]

Input: "Mike dribbled past the defender, then passed to Sarah who scored"
Output: [
  {
    "text": "Mike dribbled past the defender",
    "tags": ["dribble"],
    "players": ["Mike"],
    "eventType": "player",
    "confidence": 0.9
  },
  {
    "text": "then passed to Sarah",
    "tags": ["pass"],
    "players": ["Mike", "Sarah"],
    "eventType": "player",
    "confidence": 0.9
  },
  {
    "text": "who scored",
    "tags": ["goal"],
    "players": ["Sarah"],
    "eventType": "player",
    "confidence": 0.9
  }
]

Input: "John dribbled past two defenders and scored a beautiful goal"
Output: [
  {
    "text": "John dribbled past two defenders",
    "tags": ["dribble"],
    "players": ["John"],
    "eventType": "player",
    "confidence": 0.9
  },
  {
    "text": "scored a beautiful goal",
    "tags": ["goal"],
    "players": ["John"],
    "eventType": "player",
    "confidence": 0.9
  }
]

REMEMBER: If the input contains multiple actions or players, you MUST separate them into different events.`;

    const userPrompt = `Log entry: ${text}`;

    const aiResponse = await cohere.chat({
      message: userPrompt,
      model: 'command-r-plus',
      preamble: systemPrompt,
      temperature: 0.1,
      maxTokens: 800
    });

    let separatedEvents: SeparatedEvent[] = [];
    try {
      const content = aiResponse.text || '';
      console.log('AI Response:', content);
      
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      separatedEvents = JSON.parse(cleanContent);
      if (!Array.isArray(separatedEvents)) {
        throw new Error('Not an array');
      }
    } catch (err) {
      console.error('Failed to parse separated events:', err);
      console.error('Raw AI response:', aiResponse.text);
      // Fallback: treat as single event
      separatedEvents = [{
        text: text,
        tags: [],
        players: [],
        eventType: 'observation',
        confidence: 0.5
      }];
    }

    // Validate and clean up events
    separatedEvents = separatedEvents.map(event => ({
      text: event.text || text,
      tags: Array.isArray(event.tags) ? event.tags.filter(tag => availableEvents.includes(tag)) : [],
      players: Array.isArray(event.players) ? event.players : [],
      eventType: ['player', 'team', 'observation', 'opponent'].includes(event.eventType) ? event.eventType : 'observation',
      confidence: typeof event.confidence === 'number' ? Math.max(0, Math.min(1, event.confidence)) : 0.5
    }));

    res.status(200).json({ events: separatedEvents });
  } catch (error) {
    console.error('Error in separate-events endpoint:', error);
    res.status(500).json({ error: 'Event separation error.' });
  }
}

export default withCors(handler); 