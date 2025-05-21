import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '../../lib/cors';
import axios from 'axios';

const TAG_SCHEMA = [
  // Actions
  'goal', 'assist', 'bad pass', 'interception', 'foul', 'save', 'missed shot',
  // Outcomes
  'conceded goal', 'red card', 'yellow card', 'penalty', 'own goal',
  // Modifiers
  'reckless', 'lazy', 'clutch', 'risky'
];

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const referer = process.env.NEXT_PUBLIC_APP_URL;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!openRouterApiKey) {
    return res.status(500).json({ error: 'OpenRouter API key is not set' });
  }
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }
    const systemPrompt = `You are a football (soccer) log classifier. Your job is to assign 1 to 4 tags to the following log transcript.\n\nAvailable tags (choose only from this list):\n${TAG_SCHEMA.map(t => `- ${t}`).join('\n')}\n\nReturn ONLY a JSON array of the most relevant tags, e.g. [\"bad pass\", \"conceded goal\"]. Do not explain or add anything else.`;
    const userPrompt = `Transcript: ${text}`;
    const aiResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 60
      },
      {
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': referer,
          'X-Title': 'VAR Vendetta Tagger'
        },
      }
    );
    // Try to parse the response as a JSON array
    let tags: string[] = [];
    try {
      const content = aiResponse.data.choices[0]?.message?.content || '';
      tags = JSON.parse(content);
      if (!Array.isArray(tags)) throw new Error('Not an array');
    } catch (err) {
      return res.status(500).json({ error: 'Failed to parse tags from LLM response.' });
    }
    // Filter to only valid tags
    tags = tags.filter(tag => TAG_SCHEMA.includes(tag));
    res.status(200).json({ tags });
  } catch (error) {
    console.error('Error in tag-log endpoint:', error);
    res.status(500).json({ error: 'Tagging error.' });
  }
}

export default withCors(handler); 