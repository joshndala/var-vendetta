-- Seed data for testing
-- You can modify or remove this as needed

-- Insert a sample session
INSERT INTO sessions (id, title) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Test Session 1');

-- Insert sample transcripts
INSERT INTO transcripts (id, session_id, text, timestamp) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Player made a great pass to the striker', NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Terrible tackle from behind, should be a red card', NOW());

-- Insert sample snippets
INSERT INTO snippets (id, session_id, transcript_id, text, start_time, end_time, tags) VALUES 
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Player made a great pass to the striker', NOW(), NOW(), '["assist", "good pass"]'),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Terrible tackle from behind, should be a red card', NOW(), NOW(), '["foul", "reckless", "red card"]'); 