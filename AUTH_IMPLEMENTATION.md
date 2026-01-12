# Email OTP Authentication Implementation

## Overview

This document describes the email-based OTP (One-Time Password) authentication system using Supabase. The implementation provides a simple, passwordless authentication flow perfect for mobile and desktop use.

## Features

✅ **8-digit OTP codes** sent via email  
✅ **No passwords** - completely passwordless  
✅ **No redirects** - OTP verification happens in-app  
✅ **Auto sign-up** - users are created automatically  
✅ **Persistent sessions** - works across app restarts  
✅ **Offline-safe** - tokens cached locally  
✅ **PWA-friendly** - sessions persist in localStorage  

## Authentication Flow

### 1. Email Entry
- User enters email address
- App validates email format
- User clicks "Send Code"

### 2. OTP Sent
- Supabase sends 8-digit code to email
- User sees "Enter code" screen
- Code expires in 1 hour (default)

### 3. Code Verification
- User enters 8-digit code
- App verifies code with Supabase
- Session is created automatically
- User is redirected to dashboard

### 4. Session Persistence
- Session stored in localStorage
- Auto-refreshes tokens in background
- Works offline (cached tokens)
- Survives app restarts

## Implementation Details

### Files Created

1. **`src/services/auth.js`**
   - `sendOTP(email)` - Send OTP code to email
   - `verifyOTP(email, token)` - Verify 8-digit code
   - `getCurrentSession()` - Get current user session
   - `signOut()` - Sign out user
   - `onAuthStateChange(callback)` - Listen to auth changes
   - `isAuthenticated()` - Check auth status

2. **`src/views/Login.vue`**
   - Two-step login UI (email → OTP)
   - Email validation
   - OTP input (8 digits only)
   - Resend code functionality
   - Error handling

3. **`supabase-auth-config.sql`**
   - RLS policies for authenticated users
   - Auto-set user_id trigger
   - Configuration notes

### Files Modified

1. **`src/services/supabase.js`**
   - Updated client config for session persistence
   - `autoRefreshToken: true`
   - `persistSession: true`
   - `storage: window.localStorage`

2. **`src/router/index.js`**
   - Added `/login` route
   - Added navigation guard
   - Redirects unauthenticated users to login
   - Redirects authenticated users from login to dashboard

3. **`src/App.vue`**
   - Auth state listener
   - Auto-redirect on sign out
   - Auto-redirect on sign in

4. **`src/views/Settings.vue`**
   - Updated logout to use auth service
   - Redirects to login on logout

## Setup Instructions

### 1. Run SQL Migration

Run `supabase-auth-config.sql` in your Supabase SQL Editor:

```sql
-- This sets up RLS policies and triggers
-- Ensures users can only access their own data
```

### 2. Configure Email Templates (Supabase Dashboard)

1. Go to **Authentication** → **Email Templates**
2. Edit the **"Magic Link"** template
3. Update the body to show the OTP code:

```
Subject: Your login code for {{ .SiteName }}

Body:
<h2>Your login code</h2>
<p>Your 8-digit code is: <strong>{{ .Token }}</strong></p>
<p>This code will expire in 1 hour.</p>
<p>If you didn't request this code, you can safely ignore this email.</p>
```

**Note:** `{{ .Token }}` contains the 8-digit OTP code.

### 3. Verify Email Provider Settings

1. Go to **Authentication** → **Providers** → **Email**
2. Ensure **"Enable Email Provider"** is ON
3. Ensure **"Confirm email"** is OFF (for auto sign-up)
4. Ensure **"Secure email change"** is ON (recommended)

### 4. Test the Flow

1. Start the app
2. You should be redirected to `/login`
3. Enter your email
4. Check your email for the 8-digit code
5. Enter the code
6. You should be logged in and redirected to dashboard

## Session & JWT Handling

### How Supabase Stores Tokens

- **Access Token**: Stored in `localStorage` as `sb-{project-ref}-auth-token`
- **Refresh Token**: Also stored in `localStorage`
- **Session Data**: Includes user info, expires_at, etc.

### Session Duration

- **Access Token**: 1 hour (default)
- **Refresh Token**: 30 days (default)
- **Auto-refresh**: Enabled - tokens refresh automatically in background

### Long-Lived Sessions

For mobile/PWA apps, the default 30-day refresh token is recommended:

- ✅ Tokens auto-refresh in background
- ✅ Session persists across app restarts
- ✅ Works offline (cached tokens)
- ✅ No user action needed

To customize (optional):
- Go to **Authentication** → **Settings** → **Auth**
- Adjust "JWT expiry" and "Refresh token expiry"

### Offline Behavior

- ✅ Tokens cached in localStorage
- ✅ App works offline with cached tokens
- ✅ Auto-refreshes when back online
- ✅ No user action needed

## PWA Considerations

### Session Persistence

- ✅ Sessions stored in `localStorage` (persists across restarts)
- ✅ Works in mobile PWA (iOS/Android)
- ✅ Works in desktop browsers
- ✅ Survives browser/app closure

### Auto-Login on Reload

The app automatically:
1. Checks for existing session on mount
2. Restores session from localStorage
3. Validates session with Supabase
4. Redirects to login if session invalid

### Offline Safety

- ✅ Cached tokens allow offline access
- ✅ Auto-refresh when online
- ✅ No user interruption
- ✅ Seamless experience

## Security & RLS

### Row Level Security Policies

All tables have RLS enabled with simple policies:

**Interventions:**
- Users can only view/insert/update/delete their own interventions
- `auth.uid() = user_id`

**Photos:**
- Users can only access photos for their own interventions
- Checks intervention ownership via `user_id`

**User Preferences:**
- Users can only access their own preferences
- `auth.uid() = user_id`

### Recommended Defaults

✅ **Keep these defaults:**
- RLS enabled on all tables
- `auth.uid()` for user identification
- Auto-set `user_id` on insert (via trigger)

❌ **Don't customize:**
- JWT signing keys
- Token encryption
- Session storage mechanism
- RLS policy structure (keep it simple)

### Security Best Practices

1. **Always use RLS** - Never disable RLS in production
2. **Use `auth.uid()`** - Always check user ID in policies
3. **Auto-set user_id** - Use triggers to prevent user_id manipulation
4. **Validate on client** - But never trust client validation alone
5. **Keep tokens secure** - localStorage is fine for web apps

## Usage Examples

### Check Authentication Status

```javascript
import { isAuthenticated, getCurrentUser } from '@/services/auth'

// Async check
const authenticated = await isAuthenticated()

// Sync check (may be null on first load)
const user = getCurrentUser()
```

### Listen to Auth Changes

```javascript
import { onAuthStateChange } from '@/services/auth'

const unsubscribe = onAuthStateChange((user, event) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', user.email)
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out')
  }
})

// Cleanup
unsubscribe()
```

### Manual Sign Out

```javascript
import { signOut } from '@/services/auth'

await signOut()
// User is automatically redirected to login
```

## Troubleshooting

### OTP Not Received

1. Check spam folder
2. Verify email address is correct
3. Check Supabase email logs (Dashboard → Logs → Auth)
4. Verify email provider is enabled

### Session Not Persisting

1. Check browser localStorage is enabled
2. Verify Supabase client config has `persistSession: true`
3. Check browser console for errors
4. Clear localStorage and try again

### RLS Policy Errors

1. Verify user is authenticated (`auth.uid()` is not null)
2. Check `user_id` is set on records
3. Verify RLS policies are correct
4. Check Supabase logs for policy violations

### Token Refresh Issues

1. Check network connectivity
2. Verify refresh token hasn't expired (30 days)
3. Check Supabase client config has `autoRefreshToken: true`
4. Clear localStorage and re-authenticate

## Production Checklist

- [ ] Run `supabase-auth-config.sql`
- [ ] Configure email template in Supabase Dashboard
- [ ] Test email delivery
- [ ] Verify RLS policies work correctly
- [ ] Test session persistence across restarts
- [ ] Test offline behavior
- [ ] Verify auto-refresh works
- [ ] Test on mobile PWA
- [ ] Test on desktop browser
- [ ] Monitor Supabase auth logs

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
