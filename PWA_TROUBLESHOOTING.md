# PWA Install Prompt Troubleshooting

## Why you might not see the install prompt:

1. **Service worker not registered** - Check DevTools → Application → Service Workers
2. **Manifest not loaded** - Check DevTools → Application → Manifest
3. **Browser requirements not met** - Some browsers need specific conditions
4. **Already installed** - If already installed, the prompt won't show again

## How to check if PWA is working:

### 1. Check Service Worker
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. You should see a service worker registered and running
5. If not, restart the dev server: `npm run dev`

### 2. Check Manifest
1. In DevTools → **Application** tab
2. Click **Manifest** in the left sidebar
3. You should see your app manifest with icons and details
4. If there are errors (red), fix them

### 3. Manual Install Trigger

#### Chrome/Edge Desktop:
1. Look for the install icon (⊕) in the address bar (right side)
2. Or go to: **Menu (⋮)** → **Install RapportExpress**
3. Or check: DevTools → **Application** → **Manifest** → Click **Add to homescreen** button

#### Chrome Mobile:
1. Menu (⋮) → **Add to Home screen**
2. Or the browser will show a banner at the bottom

#### Safari iOS:
1. Share button → **Add to Home Screen**

## Testing in Production Mode:

The install prompt is more reliable in production builds:

```bash
npm run build
npm run preview
```

Then visit the preview URL - the install prompt should appear.

## Common Issues:

### Service Worker not registering:
- Make sure you ran `npm install --legacy-peer-deps`
- Restart the dev server
- Clear browser cache and hard refresh

### Manifest errors:
- Check that `icon-192.png` and `icon-512.png` exist in `public/` folder
- Verify the icons are valid PNG files
- Check browser console for errors

### Install button not showing:
- Wait a few seconds after page load
- Try a different browser (Chrome/Edge work best)
- Check if you've already installed the app
- Make sure you're on `localhost` or `127.0.0.1` (not `file://`)

## Force Install Prompt (Chrome):

1. Open DevTools
2. Go to **Application** → **Manifest**
3. Click the **"Add to homescreen"** button (if available)
4. Or use the install icon in the address bar
