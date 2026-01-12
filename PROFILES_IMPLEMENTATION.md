# Profiles Table Implementation

## Overview

Minimal `profiles` table for storing user settings (e.g., selected trade). Profile is automatically created when a user signs up via trigger.

## Database Design

### Schema

```sql
profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trade TEXT,  -- Selected trade (building, electricity, fire_safety, hygiene, general)
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id)  -- One profile per user
)
```

### What to Store

✅ **DO Store:**
- `trade` - User's selected trade (required for categories)
- Future: Other user-specific settings (theme, language, etc.)

❌ **DON'T Store:**
- Email (already in `auth.users`)
- Password (no passwords - OTP only)
- Personal info (name, phone, etc.) - not needed for this app
- Preferences that are device-specific (use localStorage)
- Temporary UI state

### Relationship with auth.users

- **One-to-one**: Each user has exactly one profile
- **Cascade delete**: Profile deleted when user is deleted
- **Auto-created**: Trigger creates profile on user signup

## Auto-Creation Strategy

### SQL Trigger (Recommended)

**Why triggers are better:**
- ✅ **Reliable**: Always runs, even if frontend fails
- ✅ **Atomic**: Profile created in same transaction as user
- ✅ **No race conditions**: Can't have missing profile
- ✅ **Works offline**: Profile exists when user comes online
- ✅ **No frontend code needed**: Automatic

**Implementation:**
```sql
-- Trigger fires AFTER user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

**Function:**
```sql
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Why Not Frontend-Only?

❌ **Frontend-only issues:**
- Race conditions (user created but profile not)
- Network failures during creation
- Multiple devices creating duplicate profiles
- Missing profile on first app launch

✅ **Trigger benefits:**
- Always creates profile
- No frontend code needed
- Works even if app is offline
- Prevents duplicates

## Row Level Security (RLS)

### Simple Single-User Policies

```sql
-- Users can only view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Key points:**
- ✅ Simple: `auth.uid() = user_id`
- ✅ Secure: Users can't access other profiles
- ✅ No complex logic needed
- ✅ Works for single-user app

## Frontend Usage

### Loading Profile on Startup

**In `App.vue` (on mount):**
```javascript
if (user) {
  const { loadProfile } = await import('./services/profile')
  await loadProfile()
}
```

**Profile service (`src/services/profile.js`):**
- `loadProfile()` - Loads from Supabase, caches in localStorage
- `updateProfile(updates)` - Updates profile, syncs to cloud
- `getProfileField(field)` - Gets specific field (e.g., 'trade')
- `getCachedProfileSync()` - Gets cached profile (synchronous)

### Handling Missing Profile Fields

**Graceful fallbacks:**
1. **Profile doesn't exist yet:**
   - Trigger should create it, but if not:
   - Use cached profile from localStorage
   - Use default values (e.g., trade = 'general')

2. **Field is null (e.g., trade not selected):**
   - Return `null`
   - App shows default/empty state
   - User selects trade in Settings

3. **Offline on first launch:**
   - Profile not in cache yet
   - Use localStorage fallback
   - Sync when online

**Example:**
```javascript
const trade = await getProfileField('trade')
// Returns: 'building' | 'electricity' | null
// If null, use default: 'general'
```

## Offline-First Considerations

### Caching Strategy

**localStorage cache:**
- Key: `user_profile_cache`
- Updated on every load/update
- Used when offline or Supabase unavailable

**Cache flow:**
1. **Online**: Load from Supabase → Cache → Use
2. **Offline**: Load from cache → Use
3. **Update**: Update cache → Sync to Supabase (when online)

### Behavior When Offline

**First app launch (offline):**
- ✅ Profile not in cache yet
- ✅ Falls back to localStorage (for trade)
- ✅ Default values used
- ✅ Profile syncs when online

**Subsequent launches (offline):**
- ✅ Profile loaded from cache
- ✅ App works normally
- ✅ Updates cached locally
- ✅ Syncs when online

### Safe Sync When Reconnecting

**Auto-sync:**
- Profile loads on app startup
- Profile updates sync immediately
- Auto-sync handles background sync
- No user action needed

**Conflict resolution:**
- Last write wins (simple for single-user)
- Cloud is source of truth
- Local cache updated on sync

## Implementation Files

### 1. Database (`supabase-profiles.sql`)
- Creates `profiles` table
- Sets up RLS policies
- Creates auto-creation trigger
- Migrates from `user_preferences` (if exists)

### 2. Profile Service (`src/services/profile.js`)
- `loadProfile()` - Load and cache profile
- `updateProfile(updates)` - Update and sync
- `getProfileField(field)` - Get specific field
- Cache management functions

### 3. Categories Integration (`src/utils/categories.js`)
- Updated to use profile instead of localStorage
- Falls back to localStorage for backward compatibility
- Syncs trade to profile

### 4. App Integration (`src/App.vue`)
- Loads profile on mount
- Loads profile on sign in
- Clears cache on sign out

## Setup Instructions

### 1. Run SQL Migration

Run `supabase-profiles.sql` in Supabase SQL Editor:

```sql
-- This will:
-- 1. Create profiles table
-- 2. Set up RLS policies
-- 3. Create auto-creation trigger
-- 4. Migrate from user_preferences (if exists)
```

### 2. Verify Trigger Works

1. Sign up a new user (via OTP)
2. Check Supabase Dashboard → Table Editor → profiles
3. Profile should be created automatically
4. `user_id` should match the user's ID

### 3. Test Profile Loading

1. Open app (should be authenticated)
2. Check browser console for profile load logs
3. Go to Settings → Trade selection should work
4. Select a trade → Should save to profile

## Usage Examples

### Get Trade from Profile

```javascript
import { getProfileField } from '@/services/profile'

const trade = await getProfileField('trade')
// Returns: 'building' | 'electricity' | null
```

### Update Trade

```javascript
import { updateProfile } from '@/services/profile'

await updateProfile({ trade: 'building' })
// Updates profile, caches locally, syncs to cloud
```

### Load Full Profile

```javascript
import { loadProfile } from '@/services/profile'

const profile = await loadProfile()
// Returns: { id, user_id, trade, created_at, updated_at } | null
```

## Migration from user_preferences

If you have existing `user_preferences` table:

1. **Run `supabase-profiles.sql`** (includes data migration)
2. **Verify migration** - Check that data exists in `profiles` table
3. **Run `supabase-drop-user-preferences.sql`** - Drops the old table

**Migration steps:**
```sql
-- Step 1: Create profiles table and migrate data
-- Run: supabase-profiles.sql

-- Step 2: Verify migration worked
SELECT * FROM profiles;
SELECT * FROM user_preferences; -- Should show same data

-- Step 3: Drop old table
-- Run: supabase-drop-user-preferences.sql
```

**Note:** The migration script automatically:
- Migrates all data from `user_preferences` to `profiles`
- Drops all triggers, functions, policies, and indexes
- Drops the `user_preferences` table

## Troubleshooting

### Profile Not Created

**Check:**
1. Trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
2. Function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user'`
3. User was created: Check `auth.users` table

**Fix:**
- Re-run trigger creation SQL
- Manually create profile if needed

### Profile Not Loading

**Check:**
1. User is authenticated
2. RLS policies are correct
3. Profiles table exists
4. Browser console for errors

**Fix:**
- Check RLS policies
- Verify user_id matches auth.uid()
- Check network connectivity

### Trade Not Saving

**Check:**
1. Profile exists
2. User is authenticated
3. Trade value is valid
4. Browser console for errors

**Fix:**
- Verify profile was created
- Check RLS UPDATE policy
- Ensure trade is valid (building, electricity, etc.)

## Production Checklist

- [ ] Run `supabase-profiles.sql`
- [ ] Verify trigger creates profile on signup
- [ ] Test profile loading on app startup
- [ ] Test trade selection and saving
- [ ] Test offline behavior (cache works)
- [ ] Test sync when reconnecting
- [ ] Verify RLS policies work
- [ ] Migrate from user_preferences (if needed)
- [ ] Drop user_preferences table (after verification)
