# Fixing OTP 403 Error - Step by Step

## The Problem

You're getting `403: Token has expired or is invalid` when verifying the OTP code.

## Root Cause

Supabase might be sending a **magic link token** (long hash) instead of a **6-digit OTP code**. The email template needs to be configured correctly to show the OTP code.

## Solution Steps

### Step 1: Check What's in Your Email ⚠️ CRITICAL

**Check the email you received:**
- Is it an 8-digit number? (e.g., `94235412`) ✅
- Or is it a long URL/link? (e.g., `https://.../auth/v1/verify?token=...`) ❌

**If you see a URL/link:**
- Supabase is sending a magic link, not an OTP code
- You need to configure the email template correctly

### Step 2: Configure Email Template in Supabase Dashboard

1. **Go to:** Supabase Dashboard → Authentication → Email Templates

2. **Edit the "Magic Link" template** (this is used for OTP when `emailRedirectTo` is not set)

3. **Subject:**
   ```
   Your login code
   ```

4. **Body (HTML) - CRITICAL:**
   ```html
   <h2>Your login code</h2>
   <p>Your 8-digit code is: <strong>{{ .Token }}</strong></p>
   <p>Enter this code in the app to sign in.</p>
   <p>This code expires in 1 hour.</p>
   ```

5. **Body (Plain Text):**
   ```
   Your login code
   
   Your 8-digit code is: {{ .Token }}
   
   Enter this code in the app to sign in.
   
   This code expires in 1 hour.
   ```

6. **⚠️ IMPORTANT:** Make sure `{{ .Token }}` is in the template - this displays the OTP code

7. **Save** the template

### Step 3: Verify Supabase Settings

**Go to:** Authentication → Providers → Email

**Settings:**
- ✅ **Enable Email Provider**: ON
- ❌ **Confirm email**: OFF
- ✅ **Secure email change**: ON (optional)

### Step 4: Test Again

1. **Clear browser data** (optional):
   ```javascript
   localStorage.clear()
   ```

2. **Request a new OTP code**
   - Enter your email
   - Click "Send Code"

3. **Check your email**
   - Should see: "Your 8-digit code is: **94235412**" (example)
   - Should NOT see a URL/link

4. **Enter the code immediately**
   - Copy the 8-digit number
   - Paste it in the app
   - Click "Verify Code"

### Step 5: If Still Not Working

**Check Supabase Logs:**
1. Go to **Dashboard → Logs → Auth**
2. Look for your OTP send/verify attempts
3. Check for any error messages

**Common Issues:**

1. **Email template not saved**
   - Make sure you clicked "Save" after editing
   - Refresh the page and verify the template

2. **Wrong template edited**
   - Make sure you edited "Magic Link" template
   - Not "Change Email" or other templates

3. **Token variable wrong**
   - Must be exactly: `{{ .Token }}`
   - Case sensitive
   - No spaces around the variable

4. **Code format in email**
   - The code should appear as plain numbers: `94235412`
   - Not as a clickable link
   - Not as part of a URL

## Alternative: Check Email Source

If you're still unsure, check the **raw email source**:
1. In your email client, view the email source/raw HTML
2. Search for the token/code
3. It should be a 6-digit number, not a URL

## Verification

After fixing the template, you should:
- ✅ Receive email with 8-digit code
- ✅ Code works when entered immediately
- ✅ No 403 errors
- ✅ Successfully logged in

## Still Having Issues?

If the code still doesn't work after fixing the template:

1. **Request a fresh code** (don't reuse old codes)
2. **Enter it within 1-2 minutes** (don't wait)
3. **Check browser console** for detailed error logs
4. **Check Supabase logs** for server-side errors
5. **Try a different email address** to rule out email provider issues
