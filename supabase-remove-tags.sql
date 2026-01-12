-- Migration: Remove tags functionality
-- Run this SQL in your Supabase SQL Editor
-- This removes the tags and intervention_tags tables that are no longer used

-- Step 1: Drop the intervention_tags junction table (must be dropped first due to foreign key)
DROP TABLE IF EXISTS intervention_tags CASCADE;

-- Step 2: Drop the tags table
DROP TABLE IF EXISTS tags CASCADE;

-- Note: This will permanently delete all tag data
-- If you want to keep the data for reference, comment out the DROP statements above
-- and use the following to just disable the tables instead:
-- ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE intervention_tags DISABLE ROW LEVEL SECURITY;
