# Deployment Instructions

## Issue Found
Your Next.js app built successfully but shows 404 because:
1. Wrong `outputDirectory` in vercel.json
2. Backend is not deployed - frontend tries to call localhost:3001

## Fix Steps

### 1. Deploy Backend First
```bash
cd backend
vercel --prod
```
- Copy the deployed backend URL (e.g., https://testify-backend-xxx.vercel.app)

### 2. Update Frontend Environment Variable
In Vercel dashboard for testify-ai-avatar project:
- Go to Settings → Environment Variables
- Add: `NEXT_PUBLIC_BACKEND_URL` = `<your-backend-url>`
- Apply to: Production, Preview, Development

### 3. Redeploy Frontend
```bash
git add .
git commit -m "Fix deployment configuration"
git push
```

## Files Changed
- `/vercel.json` - Fixed Next.js deployment config
- `/testify-nextjs/.env.production` - Added backend URL template
- `/backend/vercel.json` - Added backend deployment config
- `/backend/server.js` - Fixed default port

## Alternative: Deploy Backend Separately on Render/Railway
If Vercel backend doesn't work, deploy backend on:
- Render.com
- Railway.app
- Heroku

Then update `NEXT_PUBLIC_BACKEND_URL` in Vercel with that URL.
