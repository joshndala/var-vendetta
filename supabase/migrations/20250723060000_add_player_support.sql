-- Add players table to store team player information
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add player information to snippets table
ALTER TABLE snippets ADD COLUMN players JSONB; -- Store player matches as JSONB
ALTER TABLE snippets ADD COLUMN event_type TEXT DEFAULT 'observation'; -- player, team, observation, opponent
ALTER TABLE snippets ADD COLUMN analysis_confidence DECIMAL(3,2) DEFAULT 0.5; -- AI analysis confidence

-- Create indexes for new columns
CREATE INDEX idx_players_session_id ON players(session_id);
CREATE INDEX idx_snippets_players_gin ON snippets USING GIN (players);
CREATE INDEX idx_snippets_event_type ON snippets(event_type);

-- Enable RLS for players table
ALTER TABLE players ENABLE ROW LEVEL SECURITY; 