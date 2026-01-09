# Deploy Transcribe Audio Function

## Quick Deploy

```bash
cd /Users/umablanchet/Desktop/yann/rapportexpress
supabase functions deploy transcribe-audio
```

## Verify Deployment

After deployment, check:
1. Function appears in Supabase Dashboard > Edge Functions
2. Set `OPENAI_API_KEY` secret in Dashboard > Edge Functions > Secrets

## Troubleshooting CORS/401 Errors

If you're getting CORS or 401 errors:

1. **Make sure the function is deployed:**
   ```bash
   supabase functions list
   ```

2. **Check function logs:**
   ```bash
   supabase functions logs transcribe-audio
   ```

3. **Verify environment variables:**
   - Go to Supabase Dashboard > Edge Functions > Secrets
   - Ensure `OPENAI_API_KEY` is set

4. **Test the function directly:**
   ```bash
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/transcribe-audio \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"audioData":"test","fileName":"test.webm","mimeType":"audio/webm"}'
   ```

## Common Issues

- **401 Unauthorized**: Function not deployed or missing auth header
- **CORS Error**: Function not returning CORS headers (should be fixed in latest code)
- **500 Error**: Missing `OPENAI_API_KEY` secret
