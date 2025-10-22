# 🚨 RAILWAY QUICK FIX - Environment Variables Missing

## Problem
Your Railway deployment is failing because **environment variables are not set**.

Error: `Field required` for all 5 required settings.

## Solution (Do This Now!)

### Step 1: Configure Backend Service (`lyzr-d`)

1. Go to Railway Dashboard
2. Click on your `lyzr-d` service
3. Click **"Variables"** tab
4. Add these variables:

#### Reference Variables (Link to existing services):
```
DATABASE_URL → Click "Add Reference" → Select Postgres.DATABASE_URL
REDIS_URL → Click "Add Reference" → Select Redis.REDIS_URL
```

#### Manual Variables (Click "New Variable"):
```
TEMPORAL_HOST=ap-south-1.aws.api.temporal.io:7233
TEMPORAL_NAMESPACE=lyzr.ww6tj
TEMPORAL_API_KEY=<paste your actual Temporal API key>
OPENAI_API_KEY=<paste your actual OpenAI API key>
CORS_ORIGINS=["http://localhost:3000"]
DEBUG=false
PYTHONUNBUFFERED=1
```

5. Click **"Deploy"** or wait for auto-redeploy

### Step 2: Configure Worker Service (`independent-achievement`)

Same variables as backend:

```
DATABASE_URL → Reference Postgres.DATABASE_URL
REDIS_URL → Reference Redis.REDIS_URL
TEMPORAL_HOST=ap-south-1.aws.api.temporal.io:7233
TEMPORAL_NAMESPACE=lyzr.ww6tj
TEMPORAL_API_KEY=<your Temporal API key>
OPENAI_API_KEY=<your OpenAI API key>
PYTHONUNBUFFERED=1
```

### Step 3: Set Root Directory

For BOTH services:
1. Go to **Settings** tab
2. Find **"Root Directory"**
3. Set to: `/backend`
4. Save

### Step 4: Wait for Redeploy

Railway will automatically redeploy after variable changes.

Watch logs for:
- ✅ "Application startup complete"
- ✅ "Uvicorn running on 0.0.0.0:8000"

---

## 📸 Your Current Status (From Screenshots)

- ✅ **Postgres**: Working (deployed 2 days ago)
- ✅ **Redis**: Working (deployed 2 days ago)
- ❌ **lyzr-d**: Failed - Missing env vars
- ❌ **independent-achievement**: Crashed - Missing env vars

---

## 🎯 After Variables Are Set

Your deployment should succeed! Then:

1. **Get Backend URL** from Railway
2. **Update Frontend** `.env.production` with backend URL
3. **Deploy Frontend** to Vercel
4. **Update CORS** in Railway with Vercel URL

---

## ⚠️ Important

The error `Error creating build plan with Railpack` suggests Railway might be confused about the project structure. 

**Make sure:**
- Root Directory is set to `/backend` for both services
- You removed all conflicting config files (we did this already ✅)
- `railway.yaml` exists in repo root (we have this ✅)
- `railway.worker.yaml` exists in repo root (we have this ✅)

---

## 🆘 If Still Failing

Check:
1. Are all environment variables saved?
2. Is Root Directory set to `/backend`?
3. Did Railway trigger a new deployment?
4. Check build logs for different errors

Railway logs URL: https://railway.app/project/[your-project]/service/[service-id]/logs
