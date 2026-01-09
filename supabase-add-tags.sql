-- Migration: Add tags column to interventions table
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add tags JSONB column to interventions table
ALTER TABLE interventions 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Step 2: Create index for tags column (for querying)
CREATE INDEX IF NOT EXISTS idx_interventions_tags 
ON interventions USING GIN (tags);

-- Step 3: Add constraint to ensure tags column is always an array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tags_is_array' 
    AND conrelid = 'interventions'::regclass
  ) THEN
    ALTER TABLE interventions 
    ADD CONSTRAINT tags_is_array 
    CHECK (jsonb_typeof(tags) = 'array');
  END IF;
END $$;

-- Step 4: Update existing rows to have empty array if tags is null
UPDATE interventions 
SET tags = '[]'::jsonb 
WHERE tags IS NULL;
