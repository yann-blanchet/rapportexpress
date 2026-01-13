-- Add PDF settings and profile fields to profiles table
-- Run this SQL in your Supabase SQL Editor

-- Add PDF settings columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pdf_header TEXT DEFAULT 'Intervention Report',
ADD COLUMN IF NOT EXISTS pdf_logo_url TEXT DEFAULT '';

-- Add profile fields (name, email) if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';

-- Add comments for documentation
COMMENT ON COLUMN profiles.pdf_header IS 'PDF header text for generated reports';
COMMENT ON COLUMN profiles.pdf_logo_url IS 'PDF logo URL for generated reports';
COMMENT ON COLUMN profiles.name IS 'User display name';
COMMENT ON COLUMN profiles.email IS 'User email address';
