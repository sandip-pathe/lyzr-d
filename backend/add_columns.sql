-- Add session_id and is_template columns to workflows table
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS session_id VARCHAR;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS is_template VARCHAR DEFAULT 'false';
CREATE INDEX IF NOT EXISTS idx_workflows_session_id ON workflows(session_id);
