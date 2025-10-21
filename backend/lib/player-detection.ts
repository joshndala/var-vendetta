import { CohereClient } from 'cohere-ai';

interface Player {
  id: string;
  name: string;
  number?: string;
}

interface PlayerMatch {
  playerId: string;
  playerName: string;
  confidence: number;
  role: 'primary' | 'secondary' | 'involved';
}

interface EventAnalysis {
  players: PlayerMatch[];
  eventType: 'player' | 'team' | 'observation' | 'opponent';
  confidence: number;
}

export class PlayerDetectionService {
  private cohere: CohereClient;

  constructor() {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      throw new Error('COHERE_API_KEY is required for player detection');
    }
    this.cohere = new CohereClient({ token: apiKey });
  }

  /**
   * Analyze event text to detect players and categorize event type
   */
  async analyzeEvent(text: string, players: Player[]): Promise<EventAnalysis> {
    try {
      // Create a prompt for player detection
      const playerList = players.map(p => `${p.name}${p.number ? ` (#${p.number})` : ''}`).join(', ');
      
      const prompt = `Analyze this sports event description and identify:
1. Which players (if any) are involved
2. What type of event this is

Available players: ${playerList}

Event: "${text}"

Respond in JSON format:
{
  "players": [
    {
      "playerName": "exact name from available players",
      "role": "primary|secondary|involved",
      "confidence": 0.0-1.0
    }
  ],
  "eventType": "player|team|observation|opponent",
  "confidence": 0.0-1.0
}

Only include players that are actually mentioned or clearly implied in the event. If no specific players are mentioned, return empty players array.`;

      const response = await Promise.race([
        this.cohere.chat({
          message: prompt,
          model: 'command-r7b-12-2024',
          temperature: 0.1,
          maxTokens: 300
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI analysis timeout')), 5000)
        )
      ]) as any;

      const responseText = response.text || '{}';
      
      // Try to parse the JSON response
      let analysis: any;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          analysis = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        return this.getFallbackAnalysis(text, players);
      }

      // Validate and clean the analysis
      return this.validateAnalysis(analysis, players);

    } catch (error) {
      console.error('Error in player detection:', error);
      return this.getFallbackAnalysis(text, players);
    }
  }

  /**
   * Validate and clean the AI analysis
   */
  private validateAnalysis(analysis: any, players: Player[]): EventAnalysis {
    const validPlayers = new Set(players.map(p => p.name.toLowerCase()));
    
    // Clean and validate players
    const cleanedPlayers: PlayerMatch[] = [];
    if (analysis.players && Array.isArray(analysis.players)) {
      for (const player of analysis.players) {
        if (player.playerName && validPlayers.has(player.playerName.toLowerCase())) {
          const matchedPlayer = players.find(p => 
            p.name.toLowerCase() === player.playerName.toLowerCase()
          );
          
          if (matchedPlayer) {
            cleanedPlayers.push({
              playerId: matchedPlayer.id,
              playerName: matchedPlayer.name,
              confidence: Math.max(0, Math.min(1, player.confidence || 0.5)),
              role: ['primary', 'secondary', 'involved'].includes(player.role) 
                ? player.role 
                : 'involved'
            });
          }
        }
      }
    }

    // Validate event type
    const validEventTypes = ['player', 'team', 'observation', 'opponent'];
    const eventType = validEventTypes.includes(analysis.eventType) 
      ? analysis.eventType 
      : 'observation';

    return {
      players: cleanedPlayers,
      eventType,
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5))
    };
  }

  /**
   * Fallback analysis when AI fails
   */
  private getFallbackAnalysis(text: string, players: Player[]): EventAnalysis {
    // Simple keyword-based fallback
    const lowerText = text.toLowerCase();
    
    // Check for player names
    const detectedPlayers: PlayerMatch[] = [];
    for (const player of players) {
      if (lowerText.includes(player.name.toLowerCase())) {
        detectedPlayers.push({
          playerId: player.id,
          playerName: player.name,
          confidence: 0.7,
          role: 'primary'
        });
      }
    }

    // Determine event type based on keywords
    let eventType: 'player' | 'team' | 'observation' | 'opponent' = 'observation';
    
    if (detectedPlayers.length > 0) {
      eventType = 'player';
    } else if (lowerText.includes('team') || lowerText.includes('formation') || lowerText.includes('tactic')) {
      eventType = 'team';
    } else if (lowerText.includes('opponent') || lowerText.includes('other team')) {
      eventType = 'opponent';
    }

    return {
      players: detectedPlayers,
      eventType,
      confidence: 0.5
    };
  }

  /**
   * Get player statistics for a session
   */
  async getPlayerStats(events: any[], players: Player[]) {
    const stats: Record<string, {
      playerId: string;
      playerName: string;
      eventCount: number;
      primaryEvents: number;
      tags: Record<string, number>;
    }> = {};

    // Initialize stats for all players
    for (const player of players) {
      stats[player.id] = {
        playerId: player.id,
        playerName: player.name,
        eventCount: 0,
        primaryEvents: 0,
        tags: {}
      };
    }

    // Count events and tags for each player
    for (const event of events) {
      if (event.players && Array.isArray(event.players)) {
        for (const playerMatch of event.players) {
          const playerId = playerMatch.playerId;
          if (stats[playerId]) {
            stats[playerId].eventCount++;
            if (playerMatch.role === 'primary') {
              stats[playerId].primaryEvents++;
            }
            
            // Count tags
            if (event.tags && Array.isArray(event.tags)) {
              for (const tag of event.tags) {
                stats[playerId].tags[tag] = (stats[playerId].tags[tag] || 0) + 1;
              }
            }
          }
        }
      }
    }

    return Object.values(stats);
  }
} 