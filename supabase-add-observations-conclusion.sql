-- Add observations and conclusion columns to interventions table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE interventions 
ADD COLUMN IF NOT EXISTS observations TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS conclusion TEXT DEFAULT '';

-- Add comments for documentation
COMMENT ON COLUMN interventions.observations IS 'Observations field for intervention finalization';
COMMENT ON COLUMN interventions.conclusion IS 'Conclusion field for intervention finalization';
