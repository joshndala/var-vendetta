import type { NextApiRequest, NextApiResponse } from 'next';
import { AskRefRequest, AskRefResponse, SearchResult } from '../../types';
import { hybridSearch } from '../../lib/retrieval';
import { generateEmbeddings } from '../../lib/embeddings';
import { withCors } from '../../lib/cors';
import { supabase } from '../../lib/supabase';
import { getSportConfig, getPromptForSport } from '../../lib/sport-config';
import { CohereClient } from 'cohere-ai';

const referer = process.env.NEXT_PUBLIC_APP_URL;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AskRefResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Cohere API key exists
  const cohereApiKey = process.env.COHERE_API_KEY;
  if (!cohereApiKey) {
    return res.status(500).json({ error: 'Cohere API key is not set' });
  }

  // Initialize Cohere client
  const cohere = new CohereClient({
    token: cohereApiKey,
  });

  try {
    const { question } = req.body as AskRefRequest;
    
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }
    
          // Get embeddings for the question
      try {
        const embeddings = await generateEmbeddings(question);
      
      // Perform hybrid search to retrieve relevant context
      const searchResults = await hybridSearch(question, embeddings, 5);
      
      // Format context for the AI, including tags
      const context = await Promise.all(searchResults.map(async result => {
        // Fetch tags for this snippet from the database
        const { data: snippet, error } = await supabase
          .from('snippets')
          .select('tags')
          .eq('id', result.id)
          .single();
        
        let tags: string[] = [];
        if (snippet && snippet.tags) {
          // Tags are already JSONB arrays, no need to parse
          tags = snippet.tags;
        }
        const tagStr = tags.length > 0 ? `(tags: ${tags.join(', ')}) ` : '';
        return `[${new Date(result.timestamp).toLocaleString()}] ${tagStr}${result.text}`;
      }));
      const contextStr = (await Promise.all(context)).join('\n\n');
      
      // Get sport-specific context from the session
      let sport = 'general';
      let sportConfig = getSportConfig(sport);
      
      // Try to get sport from the first search result's session
      if (searchResults.length > 0) {
        const { data: session } = await supabase
          .from('sessions')
          .select('sport')
          .eq('id', searchResults[0].sessionId)
          .single();
        
        if (session?.sport) {
          sport = session.sport;
          sportConfig = getSportConfig(sport);
        }
      }

      // Create a sport-specific system prompt
      const systemPrompt = `You are the AI coach for CoachDeck—a tool that reviews conversation transcripts for sports coaching sessions.
                            Your job is to evaluate the player/team with the provided context with precision and coaching expertise.

                            Important:
                            - Only use the information from the provided transcript context.
                            - If the answer is not directly supported by the context, clearly say so.
                            - Do NOT make up details or use outside knowledge. You're here to analyze, not improvise.
                            - Keep your tone professional, constructive, and coach-like. Be honest but encouraging.

                            ===== SPORT: ${sportConfig.displayName.toUpperCase()} =====
                            ${getPromptForSport(sport)}

                            ===== TAGS =====
                            Each log is annotated with tags in parentheses, e.g. (tags: pass, shot, good). Available tags for ${sportConfig.displayName}:
                            ${sportConfig.tags.join(', ')}

                            Use these tags to understand the meaning of each log. Summarize patterns across multiple logs when possible. 
                            Reason about what the tags imply, but only use the provided context.

                            When appropriate, format your response as if delivering a coaching analysis, post-game review, or training feedback.

                            Let's analyze this performance.`;

      // Rerank the search results using Cohere
      const rerankedResults = await cohere.rerank({
        query: question,
        documents: searchResults.map(result => result.text),
        model: 'rerank-english-v3.0',
        topN: Math.min(5, searchResults.length)
      });

      // Get the top reranked results
      const topRerankedResults = rerankedResults.results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3)
        .map(result => searchResults[result.index]);

      // Create context from reranked results
      const rerankedContext = await Promise.all(topRerankedResults.map(async result => {
        const { data: snippet, error } = await supabase
          .from('snippets')
          .select('tags')
          .eq('id', result.id)
          .single();
        
        let tags: string[] = [];
        if (snippet && snippet.tags) {
          tags = snippet.tags;
        }
        const tagStr = tags.length > 0 ? `(tags: ${tags.join(', ')}) ` : '';
        return `[${new Date(result.timestamp).toLocaleString()}] ${tagStr}${result.text}`;
      }));
      const rerankedContextStr = rerankedContext.join('\n\n');

      // Generate response using Cohere's command-r-plus
      const aiResponse = await cohere.chat({
        message: `Context from conversation transcripts:\n\n${rerankedContextStr}\n\nQuestion: ${question}`,
        model: 'command-r-plus',
        preamble: systemPrompt,
        temperature: 0.4,
        maxTokens: 600
      });
      
      // Extract the answer from the response
      const answerContent = aiResponse.text || 
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
          const { data: snippet, error } = await supabase
            .from('snippets')
            .select('tags')
            .eq('id', result.id)
            .single();
          
          let tags: string[] = [];
          if (snippet && snippet.tags) {
            // Tags are already JSONB arrays, no need to parse
            tags = snippet.tags;
          }
          const tagStr = tags.length > 0 ? `(tags: ${tags.join(', ')}) ` : '';
          return `[${new Date(result.timestamp).toLocaleString()}] ${tagStr}${result.text}`;
        }));
        const contextStr = context.join('\n\n');
        
        // Get sport context for fallback prompt
        let fallbackSport = 'general';
        let fallbackSportConfig = getSportConfig(fallbackSport);
        
        if (searchResults.length > 0) {
          const { data: session } = await supabase
            .from('sessions')
            .select('sport')
            .eq('id', searchResults[0].sessionId)
            .single();
          
          if (session?.sport) {
            fallbackSport = session.sport;
            fallbackSportConfig = getSportConfig(fallbackSport);
          }
        }
        
        const systemPrompt = `You are the AI coach for CoachDeck—a tool that reviews conversation transcripts for sports coaching sessions.
                            Your job is to evaluate the player/team with the provided context with precision and coaching expertise.

                            Important:
                            - Only use the information from the provided transcript context.
                            - If the answer is not directly supported by the context, clearly say so.
                            - Do NOT make up details or use outside knowledge. You're here to analyze, not improvise.
                            - Keep your tone professional, constructive, and coach-like. Be honest but encouraging.

                            ===== SPORT: ${fallbackSportConfig.displayName.toUpperCase()} =====
                            ${getPromptForSport(fallbackSport)}

                            ===== TAGS =====
                            Each log is annotated with tags in parentheses, e.g. (tags: pass, shot, good). Available tags for ${fallbackSportConfig.displayName}:
                            ${fallbackSportConfig.tags.join(', ')}

                            Use these tags to understand the meaning of each log. Summarize patterns across multiple logs when possible. 
                            Reason about what the tags imply, but only use the provided context.

                            When appropriate, format your response as if delivering a coaching analysis, post-game review, or training feedback.

                            Let's analyze this performance.`;

        // Rerank the search results using Cohere (fallback)
        const rerankedResults = await cohere.rerank({
          query: question,
          documents: searchResults.map(result => result.text),
          model: 'rerank-english-v3.0',
          topN: Math.min(5, searchResults.length)
        });

        // Get the top reranked results
        const topRerankedResults = rerankedResults.results
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 3)
          .map(result => searchResults[result.index]);

        // Create context from reranked results
        const rerankedContext = await Promise.all(topRerankedResults.map(async result => {
          const { data: snippet, error } = await supabase
            .from('snippets')
            .select('tags')
            .eq('id', result.id)
            .single();
          
          let tags: string[] = [];
          if (snippet && snippet.tags) {
            tags = snippet.tags;
          }
          const tagStr = tags.length > 0 ? `(tags: ${tags.join(', ')}) ` : '';
          return `[${new Date(result.timestamp).toLocaleString()}] ${tagStr}${result.text}`;
        }));
        const rerankedContextStr = rerankedContext.join('\n\n');

        // Generate response using Cohere's command-r-plus (fallback)
        const aiResponse = await cohere.chat({
          message: `Context from conversation transcripts (keyword search only):\n\n${rerankedContextStr}\n\nQuestion: ${question}`,
          model: 'command-r-plus',
          preamble: systemPrompt,
          temperature: 0.4,
          maxTokens: 600
        });
        
        const answerContent = aiResponse.text || 
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