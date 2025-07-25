-- Add start_time field to sessions table for timer functionality
ALTER TABLE sessions ADD COLUMN start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing sessions to have start_time = created_at
UPDATE sessions SET start_time = created_at WHERE start_time IS NULL; 