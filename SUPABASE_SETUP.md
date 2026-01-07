# Supabase Setup Guide

## Quick Setup Steps

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in your project details:
   - **Name**: RapportExpress (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
5. Wait for the project to be created (takes ~2 minutes)

### 2. Get Your API Credentials
1. In your Supabase project dashboard, go to **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 3. Create `.env` File
1. In your project root, create a `.env` file (or copy from `env.example`)
2. Add your credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Schema
1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `supabase-schema.sql` from this project
4. Copy **ALL** the SQL code
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

### 5. Create Storage Bucket (for photos)
The SQL schema should create this automatically, but if photos don't upload:

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name: `intervention-photos`
4. Make it **Public**: ✅
5. Click **Create bucket**

### 6. Verify Setup
1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `interventions`
   - `checklist_items`
   - `photos`
   - `comments`

## Troubleshooting

### Error: "Could not find the table 'public.interventions'"
- **Solution**: Make sure you ran the SQL schema (step 4)
- Check that all tables were created in Table Editor

### Error: "new row violates row-level security policy"
- **Solution**: The SQL schema includes RLS policies. Make sure you ran the complete schema
- If you're testing without auth, you may need to temporarily disable RLS (not recommended for production)

### Photos not uploading
- **Solution**: 
  1. Check that the `intervention-photos` bucket exists in Storage
  2. Verify the storage policies were created (they're in the SQL schema)

### Still having issues?
1. Check the Supabase dashboard **Logs** for detailed error messages
2. Verify your `.env` file has the correct credentials
3. Make sure you're using the **anon** key (not the service_role key)

## Testing

After setup, try creating an intervention in the app:
1. The app will save locally (works offline)
2. When online, it will automatically sync to Supabase
3. Check your Supabase **Table Editor** to see the data

## Notes

- The app works **offline-first** - you don't need Supabase to use it locally
- Cloud sync only works when:
  - Supabase is set up correctly
  - You have an internet connection
  - You're authenticated (optional for MVP, but recommended)
