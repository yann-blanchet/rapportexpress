# Supabase OTP Setup Checklist

## Critical Configuration Steps

### 1. Email Template Configuration ⚠️ CRITICAL - DO THIS FIRST!

**Go to:** Supabase Dashboard → Authentication → Email Templates

**Edit the "Magic Link" template** (this is used for OTP when `emailRedirectTo` is not set):

**Subject:**
```
Your login code
```

**Body (HTML):**
```html
<h2>Your login code</h2>
<p>Your 6-digit code is: <strong>{{ .Token }}</strong></p>
<p>Enter this code in the app to sign in.</p>
<p>This code expires in 1 hour.</p>
<p>If you didn't request this code, you can safely ignore this email.</p>
```

**Body (Plain Text):**
```
Your login code

Your 6-digit code is: {{ .Token }}

Enter this code in the app to sign in.

This code expires in 1 hour.

If you didn't request this code, you can safely ignore this email.
```

**⚠️ CRITICAL CHECKLIST:**
- ✅ `{{ .Token }}` is in the template (exactly as shown, case-sensitive)
- ✅ Template is **saved** (click Save button)
- ✅ You edited the **"Magic Link"** template (not "Change Email" or others)
- ✅ The code appears as **6 digits** in the email (e.g., `942354`)
- ✅ The code is **NOT a URL/link** (should be plain numbers)

**How to verify it's working:**
1. Request an OTP code
2. Check your email
3. You should see: "Your 6-digit code is: **942354**" (example)
4. If you see a URL/link instead, the template is wrong!

### 2. Email Provider Settings

**Go to:** Authentication → Providers → Email

**Settings:**
- ✅ **Enable Email Provider**: ON
- ❌ **Confirm email**: OFF (for auto sign-up)
- ✅ **Secure email change**: ON (recommended)

### 3. Auth Settings

**Go to:** Authentication → Settings → Auth

**Check these settings:**
- **Site URL**: Should match your app URL (e.g., `http://localhost:5173` for dev)
- **Redirect URLs**: Add your app URLs
- **JWT expiry**: 3600 (1 hour) - default is fine
- **Refresh token expiry**: 2592000 (30 days) - default is fine

### 4. Rate Limiting

**Go to:** Authentication → Settings → Rate Limits

**OTP Rate Limits:**
- **Email OTP**: Default is usually 3 per hour per email
- If you hit rate limits, wait before requesting new codes

## Testing the Setup

### Step 1: Send OTP
1. Enter email in login form
2. Click "Send Code"
3. Check browser console for: `[Auth] OTP sent successfully`

### Step 2: Check Email
1. Check your email inbox (and spam folder)
2. Look for email with subject "Your login code..."
3. The code should be 6 digits (e.g., `841915`)

### Step 3: Verify OTP
1. Enter the 6-digit code immediately
2. Click "Verify Code"
3. Should redirect to dashboard

## Common Issues

### Issue: 403 "Token has expired or is invalid"

**Possible causes:**
1. **Code expired** (1 hour limit)
   - Solution: Request a new code
   
2. **Code already used**
   - OTP codes are single-use
   - Solution: Request a new code
   
3. **Email template not configured**
   - The `{{ .Token }}` variable might not be in the template
   - Solution: Check email template configuration
   
4. **Rate limiting**
   - Too many OTP requests
   - Solution: Wait before requesting new code

### Issue: Code not received in email

**Check:**
1. Spam/junk folder
2. Supabase logs (Dashboard → Logs → Auth)
3. Email provider settings
4. Email address is correct

### Issue: Code format incorrect

**Verify:**
- Code should be exactly 6 digits
- No spaces, dashes, or letters
- Example: `841915` ✅ (not `841-915` or `841 915`)

## Debugging

### Check Supabase Logs
1. Go to **Dashboard → Logs → Auth**
2. Look for OTP send/verify attempts
3. Check for error messages

### Check Browser Console
Look for these logs:
```
[Auth] Sending OTP to: your@email.com
[Auth] OTP sent successfully
[Auth] Verifying OTP...
[Auth] Email: your@email.com
[Auth] Token: 123456
[Auth] OTP verified successfully
```

### Verify Email Template
1. Request an OTP code
2. Check the email you receive
3. Verify the code appears as 6 digits
4. Make sure it's not a magic link URL

## Quick Fixes

### If codes keep expiring:
1. Request code and enter it **immediately** (within 1-2 minutes)
2. Don't wait too long before entering

### If getting 403 errors:
1. Clear browser localStorage: `localStorage.clear()`
2. Request a **fresh** code
3. Enter it immediately
4. Make sure email matches exactly

### If email not received:
1. Check spam folder
2. Verify email address
3. Check Supabase email logs
4. Try a different email address

## Production Checklist

- [ ] Email template configured with `{{ .Token }}`
- [ ] Email provider enabled
- [ ] "Confirm email" is OFF
- [ ] Site URL configured correctly
- [ ] Redirect URLs added
- [ ] Tested OTP send/receive
- [ ] Tested OTP verification
- [ ] Checked spam folder delivery
- [ ] Verified code format (6 digits)
- [ ] Tested on mobile device
- [ ] Tested session persistence
