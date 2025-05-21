import type { NextApiRequest, NextApiResponse } from 'next';
import { AskRefRequest, AskRefResponse, SearchResult } from '../../types';
import { hybridSearch } from '../../lib/retrieval';
import axios from 'axios';
import { withCors } from '../../lib/cors';
import { PrismaClient } from '@prisma/client';

const referer = process.env.NEXT_PUBLIC_APP_URL;
const prisma = new PrismaClient();

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
      
      // Format context for the AI, including tags
      const context = await Promise.all(searchResults.map(async result => {
        // Fetch tags for this snippet from the database
        const snippet = await prisma.snippet.findUnique({ where: { id: result.id }, select: { tags: true } });
        let tags: string[] = [];
        if (snippet && snippet.tags) {
          try {
            tags = JSON.parse(snippet.tags);
          } catch {}
        }
        const tagStr = tags.length > 0 ? `(tags: ${tags.join(', ')}) ` : '';
        return `[${new Date(result.timestamp).toLocaleString()}] ${tagStr}${result.text}`;
      }));
      const contextStr = (await Promise.all(context)).join('\n\n');
      
      // Create a system prompt that guides the AI
      const systemPrompt = `You are the AI referee for VAR Vendetta—a tool that reviews conversation transcripts for one player from an intense Pro Clubs session.
                            Your job is to evaluate the player with the provided context with precision and a bit of flair.

                            Important:
                            - Only use the information from the provided transcript context.
                            - If the answer is not directly supported by the context, clearly say so.
                            - Do NOT make up details or use outside knowledge. You're here to review, not improvise.
                            - Keep your tone sharp, concise, and referee-like. Be fair, but don't sugarcoat mistakes.

                            ===== FOOTBALL (SOCCER) TAGS =====
                            Each log is annotated with tags in parentheses, e.g. (tags: bad pass, conceded goal). Tags are grouped as:
                            - Actions: goal, assist, bad pass, interception, foul, save, missed shot
                            - Outcomes: conceded goal, red card, yellow card, penalty, own goal
                            - Modifiers: reckless, lazy, clutch, risky

                            Use these tags to understand the meaning of each log. Summarize patterns across multiple logs when possible (e.g., frequent "bad pass" tags). Reason about what the tags imply, but only use the provided context.

                            When appropriate, format your response as if delivering a post-match verdict, coach's note, or sideline critique.

                            Let's get into it.`;

      // Make API call to OpenRouter
      const aiResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Context from conversation transcripts:\n\n${contextStr}\n\nQuestion: ${question}` }
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
        const context = await Promise.all(searchResults.map(async result => {
          const snippet = await prisma.snippet.findUnique({ where: { id: result.id }, select: { tags: true } });
          let tags: string[] = [];
          if (snippet && snippet.tags) {
            try {
              tags = JSON.parse(snippet.tags);
            } catch {}
          }
          const tagStr = tags.length > 0 ? `(tags: ${tags.join(', ')}) ` : '';
          return `[${new Date(result.timestamp).toLocaleString()}] ${tagStr}${result.text}`;
        }));
        const contextStr = context.join('\n\n');
        
        const systemPrompt = `You are the AI referee for VAR Vendetta—a tool that reviews conversation transcripts for one player from an intense Pro Clubs session.
                            Your job is to evaluate the player with the provided context with precision and a bit of flair.

                            Important:
                            - Only use the information from the provided transcript context.
                            - If the answer is not directly supported by the context, clearly say so.
                            - Do NOT make up details or use outside knowledge. You're here to review, not improvise.
                            - Keep your tone sharp, concise, and referee-like. Be fair, but don't sugarcoat mistakes.

                            ===== FOOTBALL (SOCCER) TAGS =====
                            Each log is annotated with tags in parentheses, e.g. (tags: bad pass, conceded goal). Tags are grouped as:
                            - Actions: goal, assist, bad pass, interception, foul, save, missed shot
                            - Outcomes: conceded goal, red card, yellow card, penalty, own goal
                            - Modifiers: reckless, lazy, clutch, risky

                            Use these tags to understand the meaning of each log. Summarize patterns across multiple logs when possible (e.g., frequent "bad pass" tags). Reason about what the tags imply, but only use the provided context.

                            When appropriate, format your response as if delivering a post-match verdict, coach's note, or sideline critique.

                            Let's get into it.`;

        const aiResponse = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'google/gemini-2.0-flash-001',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Context from conversation transcripts (keyword search only):\n\n${contextStr}\n\nQuestion: ${question}` }
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