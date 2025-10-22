# Vercel Environment Variables Setup

## Quick Setup for lyzr.anaya.legal

Since your Vercel deployment auto-updates from Git, you need to configure environment variables in the Vercel dashboard.

### Method 1: Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Select your project: `lyzr` (deployed at lyzr.anaya.legal)
3. Go to: **Settings** → **Environment Variables**
4. Add these variables for **Production** environment:

```
NEXT_PUBLIC_API_URL=https://lyzr-d-production.up.railway.app
NEXT_PUBLIC_WS_URL=wss://lyzr-d-production.up.railway.app
```

5. Click **Save**
6. Go to **Deployments** tab
7. Find the latest deployment and click **⋯** → **Redeploy**

### Method 2: Vercel CLI (Faster)

If you have Vercel CLI installed:

```bash
cd frontend
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter: https://lyzr-d-production.up.railway.app

vercel env add NEXT_PUBLIC_WS_URL production
# When prompted, enter: wss://lyzr-d-production.up.railway.app

# Trigger redeploy
vercel --prod
```

### Method 3: Automatic from .env.production (If using Vercel Git integration)

The `.env.production` file is already configured locally but gitignored. Vercel can read from committed env files, but it's better to use the dashboard for security.

## Verify Deployment

After redeployment (takes ~2-3 minutes):

1. Visit: https://lyzr.anaya.legal
2. Open browser console (F12)
3. Check Network tab - API calls should go to: `https://lyzr-d-production.up.railway.app`
4. Test creating/viewing a workflow

## Current Configuration

✅ Backend: https://lyzr-d-production.up.railway.app (HEALTHY)
✅ Frontend: https://lyzr.anaya.legal
✅ CORS: Configured in Railway to allow frontend domain
✅ Temporal Cloud: Connected
✅ Redis: Connected

## Troubleshooting

If frontend can't connect to backend:
1. Check browser console for CORS errors
2. Verify backend health: `curl https://lyzr-d-production.up.railway.app/health`
3. Ensure environment variables are set in Vercel dashboard
4. Redeploy from Vercel dashboard
