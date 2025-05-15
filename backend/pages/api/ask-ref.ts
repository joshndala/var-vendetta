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
      const systemPrompt = `You are a helpful assistant that answers questions based on provided context from conversation transcripts. 
Use ONLY the information from the provided context to answer questions.
If the answer cannot be determined from the context, say so clearly.
Do not make up information or use external knowledge.
Format your answer concisely and directly address the question.`;

      // Make API call to OpenRouter
      const aiResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Context from conversation transcripts:\n\n${context}\n\nQuestion: ${question}` }
          ],
          temperature: 0.3, 
          max_tokens: 500
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
          
        const systemPrompt = `You are a helpful assistant that answers questions based on provided context from conversation transcripts. 
Use ONLY the information from the provided context to answer questions.
If the answer cannot be determined from the context, say so clearly.
Do not make up information or use external knowledge.
Format your answer concisely and directly address the question.
Note: This search used keyword matching only, not semantic search.`;

        const aiResponse = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'google/gemini-2.0-flash-001',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Context from conversation transcripts (keyword search only):\n\n${context}\n\nQuestion: ${question}` }
            ],
            temperature: 0.3,
            max_tokens: 500
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