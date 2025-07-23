-- Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  title TEXT
);

-- Create transcripts table
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  audio_path TEXT
);

-- Create mistakes table
CREATE TABLE mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  correction TEXT
);

-- Create snippets table
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  embeddings JSONB,  -- Store embeddings as JSONB instead of string
  tags JSONB         -- Store tags as JSONB instead of string
);

-- Create indexes for better performance
CREATE INDEX idx_snippets_session_id ON snippets(session_id);
CREATE INDEX idx_snippets_transcript_id ON snippets(transcript_id);
CREATE INDEX idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX idx_mistakes_session_id ON mistakes(session_id);
CREATE INDEX idx_mistakes_transcript_id ON mistakes(transcript_id);

-- Create indexes for JSONB columns to improve query performance
CREATE INDEX idx_snippets_tags_gin ON snippets USING GIN (tags);
CREATE INDEX idx_snippets_embeddings_gin ON snippets USING GIN (embeddings);

-- Enable Row Level Security (RLS) - you can configure policies later
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
