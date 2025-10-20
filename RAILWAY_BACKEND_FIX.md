# 🚂 Railway Backend Deployment - Quick Fix Guide

## Problem

Railway error: `⚠ Script start.sh not found` and `✖ Railpack could not determine how to build the app.`

**Root Cause**: Railway is looking at the root directory instead of `backend/` folder.

---

## ✅ Solution: Configure Railway Service

### Method 1: Via Railway Dashboard (Recommended)

1. **Go to your Railway service** → Settings

2. **Set Root Directory**:
   - Click **"Root Directory"**
   - Set to: `backend`
   - Save

3. **Set Start Command**:
   - Click **"Custom Start Command"**
   - Set to: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Save

4. **Redeploy**:
   - Go to Deployments tab
   - Click **"Redeploy"**

---

### Method 2: Via railway.toml (Alternative)

If you want Railway to auto-detect settings, create this file in your repo root:

`railway.toml`:
```toml
[build]
builder = "NIXPACKS"
buildCommand = "cd backend && pip install -r requirements.txt"

[deploy]
startCommand = "cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

Then:
```bash
git add railway.toml
git commit -m "Add Railway configuration"
git push
```

Railway will auto-redeploy with correct settings.

---

## 📋 Complete Railway Backend Setup

### Step 1: Create Service

1. Railway Dashboard → **New** → **GitHub Repo**
2. Select your repository
3. Railway creates service

### Step 2: Configure Service

**Settings → General**:
- **Service Name**: `backend` (or `lyzr-backend-api`)
- **Root Directory**: `backend`

**Settings → Deploy**:
- **Custom Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 3: Set Environment Variables

**Settings → Variables** (click **"New Variable"**):

```bash
# Database (link to PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (link to Redis service)
REDIS_URL=${{Redis.REDIS_URL}}

# Temporal Cloud
TEMPORAL_HOST=your-namespace.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace

# TLS Certificates (base64 encoded)
TEMPORAL_TLS_CERT_BASE64=<paste base64 cert>
TEMPORAL_TLS_KEY_BASE64=<paste base64 key>

# OpenAI
OPENAI_API_KEY=sk-proj-...

# CORS (update after Vercel deployment)
CORS_ORIGINS=["http://localhost:3000"]

# App Config
APP_NAME=Lyzr Orchestrator
DEBUG=False
API_PORT=8000
```

### Step 4: Generate Public Domain

**Settings → Networking**:
- Click **"Generate Domain"**
- Copy the URL (e.g., `https://lyzr-backend-production.up.railway.app`)
- Save this for Vercel frontend configuration

### Step 5: Deploy

Railway will auto-deploy. Check **Deployments** tab for status.

---

## ✅ Verification

### 1. Check Build Logs

In Railway Deployments:
```
✓ Found Python app
✓ Installing dependencies
✓ Build complete
```

### 2. Check Deploy Logs

Should show:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
🚀 Lyzr Orchestrator API starting...
✅ All routers and event listeners loaded
```

### 3. Test Health Endpoint

```bash
curl https://your-backend.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "temporal": "ok",
  "redis": "ok"
}
```

---

## 🐛 Troubleshooting

### Error: "Script start.sh not found"
**Fix**: Set Root Directory to `backend` in Railway settings

### Error: "Could not determine how to build"
**Fix**: 
1. Set Root Directory to `backend`
2. Or use `railway.toml` with `cd backend` commands

### Error: "ModuleNotFoundError: No module named 'app'"
**Fix**: Start command should be run from backend directory
- Use: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Run from Root Directory: `backend`

### Error: "DATABASE_URL not set"
**Fix**: Link PostgreSQL service in variables:
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

---

## 📦 What Gets Deployed

Only the **Backend API** service:
- ✅ FastAPI REST API
- ✅ WebSocket endpoints
- ✅ Database connection (PostgreSQL)
- ✅ Redis connection
- ✅ Temporal client (to connect to Temporal Cloud)
- ❌ No worker (worker runs separately)

---

## 🎯 Next Steps After Backend is Running

1. ✅ Backend health check passes
2. Deploy Worker (see options below)
3. Deploy Frontend to Vercel
4. Update CORS_ORIGINS with Vercel URL

---

## 🔧 Worker Deployment Options

### Option A: Worker on Railway (Simple - Recommended for Now)

Create a second Railway service:
1. **New** → **GitHub Repo** (same repo)
2. **Service Name**: `worker`
3. **Root Directory**: `backend`
4. **Start Command**: `python -u -m app.temporal.worker`
5. **Variables**: Same as backend service
6. Deploy

### Option B: Worker on Temporal Cloud (Cost-Effective - After Presentation)

See `TEMPORAL_CLOUD_WORKER.md` for detailed guide.

---

## 💰 Cost Estimate

**Backend only on Railway**:
- PostgreSQL: ~$2/month
- Redis: ~$1/month
- Backend API: ~$2/month
- **Subtotal: ~$5/month**

**If you add Worker on Railway**:
- Worker: ~$5-10/month
- **Total: ~$10-15/month**

**If Worker on Temporal Cloud**:
- Worker: Free (using Temporal Cloud compute)
- **Total: ~$5/month** ✨

---

## ✅ You're Ready!

Your backend is now properly configured for Railway deployment.

**Current Status**:
- ✅ Configuration files created
- ✅ Backend is standalone (no worker)
- ✅ Proper Railway setup documented
- 🔄 Ready to deploy!

Follow the steps above to deploy your backend to Railway! 🚀
