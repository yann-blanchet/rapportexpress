-- Migration: Add sequence numbers for similar reports
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add sequence_number column to interventions table (nullable for backward compatibility)
ALTER TABLE interventions 
ADD COLUMN IF NOT EXISTS sequence_number INTEGER;

-- Step 2: Create index for efficient queries (finding max sequence for a base title)
CREATE INDEX IF NOT EXISTS idx_interventions_client_name_sequence 
ON interventions(client_name, sequence_number);

-- Step 3: Set default sequence_number to 1 for existing reports with NULL sequence_number
-- This ensures old reports get a sequence number
UPDATE interventions 
SET sequence_number = 1 
WHERE sequence_number IS NULL;

-- Note: The sequence_number is managed by the application logic
-- It auto-increments when creating similar reports

