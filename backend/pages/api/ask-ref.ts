import type { NextApiRequest, NextApiResponse } from 'next';
import { AskRefRequest, AskRefResponse, SearchResult } from '../../types';
import { hybridSearch } from '../../lib/retrieval';
import axios from 'axios';
import { withCors } from '../../lib/cors';

const referer = process.env.NEXT_PUBLIC_APP_URL;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AskRefResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if OpenRouter API key exists
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    return res.status(500).json({ error: 'OpenRouter API key is not set' });
  }

  try {
    const { question } = req.body as AskRefRequest;
    
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    // Get embeddings for the question
    try {
      const embedResponse = await axios.post(
        `${req.headers.origin || ''}/api/embed`,
        { text: question },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const embeddings = embedResponse.data.embeddings;
      
      // Perform hybrid search to retrieve relevant context
      const searchResults = await hybridSearch(question, embeddings, 5);
      
      // Format context for the AI
      const context = searchResults
        .map(result => `[${new Date(result.timestamp).toLocaleString()}] ${result.text}`)
        .join('\n\n');
      
      // Create a system prompt that guides the AI
      const systemPrompt = `You are the AI referee for VAR Vendetta—a tool that reviews conversation transcripts for one player from an intense Pro Clubs session.
                            Your job is to evaluate the player with the provided context with precision and a bit of flair.

                            Important:
                            - Only use the information from the provided transcript context.
                            - If the answer is not directly supported by the context, clearly say so.
                            - Do NOT make up details or use outside knowledge. You're here to review, not improvise.
                            - Keep your tone sharp, concise, and referee-like. Be fair, but don't sugarcoat mistakes.

                            ===== FOOTBALL (SOCCER) TERMINOLOGY =====
                            Understand these common football terms when analyzing player actions:

                            SCORING & ATTACKING:
                            - "Scored/banged/slotted a goal" - Successfully put the ball in the net
                            - "Assist" - Final pass leading to a goal
                            - "Through ball" - Pass into space behind defenders
                            - "Cross" - Ball played from wide areas into the penalty box
                            - "Shot on target" - Attempt that would go in if not saved
                            - "Finesse shot" - Placed shot with curl rather than power
                            - "Tap-in" - Easy goal from very close range

                            DEFENDING & MISTAKES:
                            - "Conceded a goal" - Allowed the opposition to score
                            - "Clean sheet" - No goals conceded by goalkeeper/defense
                            - "Tackle" - Attempt to take ball from opponent
                            - "Block" - Stopping a shot or pass with body
                            - "Interception" - Taking the ball during an opponent's pass
                            - "Clearance" - Kicking ball away from danger
                            - "Ball watching" - Not tracking opponents due to focusing only on the ball

                            FOULS & DISCIPLINE:
                            - "Yellow card" - Caution from referee
                            - "Red card" - Dismissal from match
                            - "Sent off" - Received a red card
                            - "Penalty" - Free shot after foul in penalty area
                            - "Free kick" - Restart after a foul
                            - "Simulation/diving" - Faking a foul

                            PLAYER POSITIONS:
                            - "Striker/Forward" - Attacking player focused on scoring
                            - "Winger" - Wide attacking player
                            - "Midfielder" - Central player linking defense and attack
                            - "Defender/Center-back" - Player focused on stopping attacks
                            - "Full-back/Wing-back" - Wide defensive players
                            - "Goalkeeper/Keeper" - Player who can use hands in own penalty area

                            When appropriate, format your response as if delivering a post-match verdict, coach's note, or sideline critique.

                            Let's get into it.`;

      // Make API call to OpenRouter
      const aiResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Context from conversation transcripts:\n\n${context}\n\nQuestion: ${question}` }
          ],
          temperature: 0.4, 
          max_tokens: 600
        },
        {
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': referer, 
            'X-Title': 'VAR Vendetta'
          },
        }
      );
      
      // Extract the answer from the response
      const answerContent = aiResponse.data.choices[0]?.message?.content || 
        "Sorry, I couldn't generate an answer based on the available context.";
      
      return res.status(200).json({
        answer: answerContent,
        sources: searchResults
      });
    } catch (embedError) {
      console.error('Error getting embeddings:', embedError);
      
      // Fallback to BM25-only search if embedding fails
      const searchResults = await hybridSearch(question, null, 5);
      
      // Even with embedding failure, we can still try to get an AI answer
      try {
        const context = searchResults
          .map(result => `[${new Date(result.timestamp).toLocaleString()}] ${result.text}`)
          .join('\n\n');
          
        const systemPrompt = `You are the AI referee for VAR Vendetta—a tool that reviews conversation transcripts for one player from an intense Pro Clubs session.
                            Your job is to evaluate the player with the provided context with precision and a bit of flair.

                            Important:
                            - Only use the information from the provided transcript context.
                            - If the answer is not directly supported by the context, clearly say so.
                            - Do NOT make up details or use outside knowledge. You're here to review, not improvise.
                            - Keep your tone sharp, concise, and referee-like. Be fair, but don't sugarcoat mistakes.

                            ===== FOOTBALL (SOCCER) TERMINOLOGY =====
                            Understand these common football terms when analyzing player actions:

                            SCORING & ATTACKING:
                            - "Scored/banged/slotted a goal" - Successfully put the ball in the net
                            - "Assist" - Final pass leading to a goal
                            - "Through ball" - Pass into space behind defenders
                            - "Cross" - Ball played from wide areas into the penalty box
                            - "Shot on target" - Attempt that would go in if not saved
                            - "Finesse shot" - Placed shot with curl rather than power
                            - "Tap-in" - Easy goal from very close range

                            DEFENDING & MISTAKES:
                            - "Conceded a goal" - Allowed the opposition to score
                            - "Clean sheet" - No goals conceded by goalkeeper/defense
                            - "Tackle" - Attempt to take ball from opponent
                            - "Block" - Stopping a shot or pass with body
                            - "Interception" - Taking the ball during an opponent's pass
                            - "Clearance" - Kicking ball away from danger
                            - "Ball watching" - Not tracking opponents due to focusing only on the ball

                            FOULS & DISCIPLINE:
                            - "Yellow card" - Caution from referee
                            - "Red card" - Dismissal from match
                            - "Sent off" - Received a red card
                            - "Penalty" - Free shot after foul in penalty area
                            - "Free kick" - Restart after a foul
                            - "Simulation/diving" - Faking a foul

                            PLAYER POSITIONS:
                            - "Striker/Forward" - Attacking player focused on scoring
                            - "Winger" - Wide attacking player
                            - "Midfielder" - Central player linking defense and attack
                            - "Defender/Center-back" - Player focused on stopping attacks
                            - "Full-back/Wing-back" - Wide defensive players
                            - "Goalkeeper/Keeper" - Player who can use hands in own penalty area

                            When appropriate, format your response as if delivering a post-match verdict, coach's note, or sideline critique.

                            Let's get into it.`;

        const aiResponse = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'google/gemini-2.0-flash-001',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Context from conversation transcripts (keyword search only):\n\n${context}\n\nQuestion: ${question}` }
            ],
            temperature: 0.4,
            max_tokens: 600
          },
          {
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': referer,
              'X-Title': 'VAR Vendetta'
            },
          }
        );
        
        const answerContent = aiResponse.data.choices[0]?.message?.content || 
          "Sorry, I couldn't generate an answer based on the available context.";
          
        return res.status(200).json({
          answer: answerContent,
          sources: searchResults
        });
        
      } catch (aiError) {
        console.error('Error getting AI response after embedding failure:', aiError);
        
        // If both embedding and AI call fail, return a more descriptive error
        return res.status(200).json({
          answer: `I couldn't process your question due to technical issues. The embedding service failed, and the fallback AI response also failed.`,
          sources: searchResults
        });
      }
    }
  } catch (error) {
    console.error('Error in ask-ref endpoint:', error);
    return res.status(500).json({ error: `Ask-ref error: ${error}` });
  }
}

export default withCors(handler); 