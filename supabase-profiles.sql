-- Profiles Table - Minimal user profile for settings
-- Run this SQL in your Supabase SQL Editor
-- 
-- This creates a profiles table that is automatically created when a user signs up
-- Stores minimal user settings (e.g. selected trade)

-- Step 1: Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade TEXT, -- Selected trade (building, electricity, fire_safety, hygiene, general)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id) -- One profile per user
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies - Simple single-user policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Step 5: Auto-create profile on user signup (TRIGGER)
-- This automatically creates a profile when a user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate if trigger fires twice
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Step 7: Migrate existing user_preferences to profiles (if user_preferences table exists)
-- This migrates data before dropping user_preferences table
-- After verifying migration, run supabase-drop-user-preferences.sql to drop the old table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
    -- Migrate data from user_preferences to profiles
    INSERT INTO profiles (user_id, trade, created_at, updated_at)
    SELECT user_id, trade, created_at, updated_at
    FROM user_preferences
    ON CONFLICT (user_id) DO UPDATE
    SET trade = EXCLUDED.trade,
        updated_at = EXCLUDED.updated_at;
    
    RAISE NOTICE 'Migrated data from user_preferences to profiles. Run supabase-drop-user-preferences.sql to drop the old table.';
  END IF;
END $$;
