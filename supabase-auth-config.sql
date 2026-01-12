-- Supabase Authentication Configuration for OTP
-- Run this SQL in your Supabase SQL Editor
-- 
-- This configures Supabase Auth for email-based OTP authentication
-- No passwords, no magic links - just 6-digit codes

-- Step 1: Enable Email OTP Provider (if not already enabled)
-- This is usually enabled by default, but we'll ensure it's configured correctly
-- Go to Authentication > Providers > Email in Supabase Dashboard to verify

-- Step 2: Configure Email Templates (Optional - done in Dashboard)
-- In Supabase Dashboard: Authentication > Email Templates
-- Customize the "Magic Link" template to show OTP code instead
-- The OTP code will be in the email body

-- Step 3: Set up Row Level Security (RLS) for existing tables
-- These policies ensure users can only access their own data

-- Interventions table RLS (update existing policies if needed)
-- Users can only see their own interventions
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own interventions or unassigned" ON interventions;
  DROP POLICY IF EXISTS "Users can insert their own interventions" ON interventions;
  DROP POLICY IF EXISTS "Users can update their own interventions" ON interventions;
  DROP POLICY IF EXISTS "Users can delete their own interventions" ON interventions;
  
  -- Create new policies that require authentication
  -- Note: user_id is auto-set by trigger, so we check it matches auth.uid()
  CREATE POLICY "Users can view their own interventions"
    ON interventions FOR SELECT
    USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can insert their own interventions"
    ON interventions FOR INSERT
    WITH CHECK (
      -- Allow if user_id matches auth.uid() OR if user_id is null (trigger will set it)
      (auth.uid() = user_id) OR (user_id IS NULL AND auth.uid() IS NOT NULL)
    );
  
  CREATE POLICY "Users can update their own interventions"
    ON interventions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY "Users can delete their own interventions"
    ON interventions FOR DELETE
    USING (auth.uid() = user_id);
END $$;

-- Photos table RLS
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view photos for their interventions" ON photos;
  DROP POLICY IF EXISTS "Users can insert photos for their interventions" ON photos;
  DROP POLICY IF EXISTS "Users can update photos for their interventions" ON photos;
  DROP POLICY IF EXISTS "Users can delete photos for their interventions" ON photos;
  
  CREATE POLICY "Users can view photos for their interventions"
    ON photos FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM interventions
        WHERE interventions.id = photos.intervention_id
        AND interventions.user_id = auth.uid()
      )
    );
  
  CREATE POLICY "Users can insert photos for their interventions"
    ON photos FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM interventions
        WHERE interventions.id = photos.intervention_id
        AND interventions.user_id = auth.uid()
      )
    );
  
  CREATE POLICY "Users can update photos for their interventions"
    ON photos FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM interventions
        WHERE interventions.id = photos.intervention_id
        AND interventions.user_id = auth.uid()
      )
    );
  
  CREATE POLICY "Users can delete photos for their interventions"
    ON photos FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM interventions
        WHERE interventions.id = photos.intervention_id
        AND interventions.user_id = auth.uid()
      )
    );
END $$;

-- User preferences table RLS (already has policies, but ensure they're correct)
-- Policies are already set in supabase-user-preferences.sql
-- No changes needed here

-- Step 4: Create function to automatically set user_id on intervention creation/update
-- This ensures user_id is always set when creating or updating interventions
CREATE OR REPLACE FUNCTION set_intervention_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set user_id to current authenticated user
  -- This ensures RLS policies work correctly
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-set user_id on INSERT
DROP TRIGGER IF EXISTS trigger_set_intervention_user_id_insert ON interventions;
CREATE TRIGGER trigger_set_intervention_user_id_insert
  BEFORE INSERT ON interventions
  FOR EACH ROW
  EXECUTE FUNCTION set_intervention_user_id();

-- Create trigger to auto-set user_id on UPDATE (if user_id is null or changed)
DROP TRIGGER IF EXISTS trigger_set_intervention_user_id_update ON interventions;
CREATE TRIGGER trigger_set_intervention_user_id_update
  BEFORE UPDATE ON interventions
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL OR NEW.user_id != auth.uid())
  EXECUTE FUNCTION set_intervention_user_id();

-- Step 5: Session Configuration Notes
-- 
-- Supabase Auth sessions:
-- - Access tokens: Valid for 1 hour (default)
-- - Refresh tokens: Valid for 30 days (default)
-- - Auto-refresh: Enabled in client config
-- - Storage: localStorage (persists across app restarts)
--
-- To customize session duration (optional):
-- Go to Authentication > Settings > Auth in Supabase Dashboard
-- Adjust "JWT expiry" and "Refresh token expiry" if needed
--
-- For long-lived sessions (recommended for mobile/PWA):
-- - Keep default refresh token expiry (30 days)
-- - Client auto-refreshes tokens in background
-- - Session persists in localStorage
-- - Works offline (tokens cached locally)

-- Step 6: Email Template Configuration (Manual Step)
-- 
-- In Supabase Dashboard: Authentication > Email Templates
-- 
-- Edit the "Magic Link" template to show OTP code:
-- 
-- Subject: Your login code for {{ .SiteName }}
-- 
-- Body:
-- <h2>Your login code</h2>
-- <p>Your 6-digit code is: <strong>{{ .Token }}</strong></p>
-- <p>This code will expire in 1 hour.</p>
-- <p>If you didn't request this code, you can safely ignore this email.</p>
--
-- Note: {{ .Token }} contains the 6-digit OTP code
