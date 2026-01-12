-- Migration: Drop user_preferences table (replaced by profiles table)
-- Run this SQL in your Supabase SQL Editor AFTER verifying data migration
--
-- IMPORTANT: This script will:
-- 1. Migrate any remaining data from user_preferences to profiles
-- 2. Drop the user_preferences table and all related objects
--
-- Make sure you've verified the migration worked before running this!

-- Step 1: Migrate any remaining data from user_preferences to profiles
-- (This is a safety check - migration should have already happened in supabase-profiles.sql)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
    -- Migrate data from user_preferences to profiles
    INSERT INTO profiles (user_id, trade, created_at, updated_at)
    SELECT user_id, trade, created_at, updated_at
    FROM user_preferences
    WHERE user_id NOT IN (SELECT user_id FROM profiles) -- Only migrate if not already in profiles
    ON CONFLICT (user_id) DO UPDATE
    SET trade = EXCLUDED.trade,
        updated_at = EXCLUDED.updated_at;
    
    RAISE NOTICE 'Migrated data from user_preferences to profiles';
  END IF;
END $$;

-- Step 2: Drop triggers related to user_preferences
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;

-- Step 3: Drop functions related to user_preferences
DROP FUNCTION IF EXISTS update_user_preferences_updated_at() CASCADE;

-- Step 4: Drop RLS policies on user_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON user_preferences;

-- Step 5: Drop indexes on user_preferences
DROP INDEX IF EXISTS idx_user_preferences_user_id;

-- Step 6: Drop the user_preferences table
DROP TABLE IF EXISTS user_preferences CASCADE;

-- Verification: Check that profiles table exists and has data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE 'Profiles table exists - migration complete';
  ELSE
    RAISE WARNING 'Profiles table does not exist - please run supabase-profiles.sql first!';
  END IF;
END $$;
