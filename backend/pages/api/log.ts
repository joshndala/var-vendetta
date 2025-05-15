import type { NextApiRequest, NextApiResponse } from 'next';
import { LogRequest, LogResponse } from '../../types';
import prisma from '../../lib/prisma';
import { addDocument } from '../../lib/bm25';
import { withCors } from '../../lib/cors';

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
    const { timestamp, text } = req.body;
    
    if (!text || !timestamp) {
      return res.status(400).json({ error: 'Text and timestamp are required' });
    }
    
    // TODO: Create or get current session
    let sessionId: string;
    const activeSession = await prisma.session.findFirst({
      where: { endedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    
    if (activeSession) {
      sessionId = activeSession.id;
    } else {
      const newSession = await prisma.session.create({
        data: {
          title: `Session ${new Date().toISOString().slice(0, 10)}`,
        },
      });
      sessionId = newSession.id;
    }
    
    // Create transcript record (without audio path since we're not handling audio)
    const transcript = await prisma.transcript.create({
      data: {
        sessionId,
        text,
        timestamp: new Date(timestamp),
        audioPath: 'placeholder', // Not storing audio for now
      },
    });
    
    // Create a snippet from this transcript
    const snippet = await prisma.snippet.create({
      data: {
        sessionId,
        transcriptId: transcript.id,
        text,
        startTime: new Date(timestamp),
        endTime: new Date(timestamp), // TODO: Calculate actual end time
      },
    });
    
    // Add document to BM25 index
    await addDocument(snippet.id, text);
    
    return res.status(200).json({
      id: transcript.id,
      text,
      timestamp: new Date(timestamp),
    });
  } catch (error) {
    console.error('Error in log endpoint:', error);
    return res.status(500).json({ error: `Server error: ${error}` });
  }
}

export default withCors(handler); 