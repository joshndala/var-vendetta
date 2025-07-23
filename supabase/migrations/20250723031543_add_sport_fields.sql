-- Add sport fields to sessions table for CoachDeck
ALTER TABLE sessions ADD COLUMN sport VARCHAR(50) NOT NULL DEFAULT 'general';
ALTER TABLE sessions ADD COLUMN sport_config JSONB;

-- Create index for sport-based queries
CREATE INDEX idx_sessions_sport ON sessions(sport);

-- Update existing sessions to have a default sport
UPDATE sessions SET sport = 'general' WHERE sport IS NULL;
