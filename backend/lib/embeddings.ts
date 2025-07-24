import { CohereClient } from 'cohere-ai';

export async function generateEmbeddings(text: string): Promise<number[]> {
  const cohereApiKey = process.env.COHERE_API_KEY;
  if (!cohereApiKey) {
    throw new Error('Cohere API key is not set');
  }

  const cohere = new CohereClient({
    token: cohereApiKey,
  });

  try {
    const response = await cohere.embed({
      texts: [text],
      model: 'embed-english-v3.0',
      inputType: 'search_document',
    });

    if (response.embeddings && Array.isArray(response.embeddings) && response.embeddings.length > 0) {
      return response.embeddings[0];
    } else {
      throw new Error('No embeddings returned from Cohere');
    }
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
} 