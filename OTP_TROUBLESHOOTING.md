# OTP Verification Troubleshooting

## Common Error: "Token has expired or is invalid" (403)

This error typically occurs due to one of these reasons:

### 1. **Code Expired**
- OTP codes expire after **1 hour** (default)
- **Solution**: Request a new code

### 2. **Code Already Used**
- OTP codes are single-use
- **Solution**: Request a new code

### 3. **Email Mismatch**
- The email used to verify must **exactly match** the email used to send the OTP
- Case sensitivity and whitespace matter
- **Solution**: The code now normalizes emails automatically

### 4. **Incorrect Code**
- Make sure you're entering the **exact 6-digit code** from the email
- No spaces, dashes, or other characters
- **Solution**: Copy the code directly from email

## Quick Fixes

### Fix 1: Request a New Code
1. Click "Resend code" or "Use different email"
2. Enter your email again
3. Wait for new code
4. Enter the new code immediately

### Fix 2: Check Email Template
Make sure your Supabase email template shows the code correctly:
- Template variable: `{{ .Token }}`
- Should display as 6 digits (e.g., `123456`)

### Fix 3: Verify Supabase Settings
1. Go to **Authentication** → **Providers** → **Email**
2. Ensure **"Enable Email Provider"** is ON
3. Check **"Confirm email"** is OFF
4. Verify email is being sent (check Supabase logs)

### Fix 4: Check Code Format
- Code should be exactly **6 digits**
- No letters, spaces, or special characters
- Example: `123456` ✅ (not `123-456` or `123 456`)

## Debugging Steps

### Check Browser Console
Look for these logs:
```
[Auth] Email used: your@email.com
[Auth] Token used: 123456
[Auth] Error verifying OTP: ...
```

### Check Supabase Logs
1. Go to **Supabase Dashboard** → **Logs** → **Auth**
2. Look for OTP verification attempts
3. Check for error messages

### Verify Email Delivery
1. Check spam folder
2. Check Supabase email logs
3. Verify email address is correct

## Code Updates Applied

The code has been updated to:
- ✅ Normalize email consistently (trim + lowercase)
- ✅ Remove spaces from OTP code
- ✅ Store normalized email between steps
- ✅ Provide better error messages
- ✅ Handle expired/invalid codes gracefully

## Still Having Issues?

1. **Clear browser cache and localStorage**
   ```javascript
   localStorage.clear()
   ```

2. **Check Supabase project settings**
   - Verify API keys are correct
   - Check project URL is correct

3. **Test with a different email**
   - Some email providers may delay delivery
   - Try a different email address

4. **Check network connectivity**
   - Ensure you're online
   - Check for CORS errors in console

5. **Verify Supabase Auth is enabled**
   - Dashboard → Authentication → Settings
   - Ensure auth is enabled for your project
