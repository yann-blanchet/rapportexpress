-- Fix for storage RLS policy - Add UPDATE policy for upsert operations
-- Run this in Supabase SQL Editor if you're getting "new row violates row-level security policy" errors

-- Add UPDATE policy for storage objects (needed for upsert operations)
CREATE POLICY "Users can update their photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'intervention-photos' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
  )
  WITH CHECK (
    bucket_id = 'intervention-photos' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
  );

-- Alternative: If the above doesn't work, you can make the bucket more permissive for anonymous users
-- (Only use this if you're okay with less strict security for MVP)
-- DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
-- CREATE POLICY "Users can upload photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'intervention-photos');
