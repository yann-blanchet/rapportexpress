-- Migration: Remove tags JSONB column from interventions table
-- Run this SQL in your Supabase SQL Editor
-- This should be run AFTER supabase-tags-schema.sql has been executed and data has been migrated

-- Step 1: Drop the constraint on tags column (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tags_is_array' 
    AND conrelid = 'interventions'::regclass
  ) THEN
    ALTER TABLE interventions DROP CONSTRAINT tags_is_array;
  END IF;
END $$;

-- Step 2: Drop the index on tags column (if it exists)
DROP INDEX IF EXISTS idx_interventions_tags;

-- Step 3: Remove the tags JSONB column from interventions table
ALTER TABLE interventions DROP COLUMN IF EXISTS tags;
