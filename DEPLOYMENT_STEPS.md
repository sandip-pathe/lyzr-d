# 🚀 Step-by-Step Deployment Guide

## Prerequisites Checklist
- ✅ Temporal Cloud account created
- ✅ Railway account created  
- ✅ Vercel account created
- ✅ OpenAI API key ready
- ✅ GitHub repository pushed

---

## 🎯 STEP 1: Temporal Cloud Setup (5-10 minutes)

### 1.1 Create Namespace
1. Go to https://cloud.temporal.io/
2. Click **"Create Namespace"**
3. Choose a name (e.g., `lyzr-orchestrator-prod`)
4. Select **Region**: US West or closest to your Railway region
5. Click **Create**

### 1.2 Generate API Key & Certificates
1. Navigate to your namespace
2. Go to **Settings** → **Certificates**
3. Click **"Generate Certificate"**
4. Download **BOTH files**:
   - `client.pem` (certificate)
   - `client-key.pem` (private key)
5. **SAVE THESE SECURELY** - you'll upload them to Railway

### 1.3 Note Your Connection Details
Copy these for later:
```
Temporal Host: <your-namespace>.tmprl.cloud:7233
Namespace: <your-namespace>
```

---

## 🚂 STEP 2: Railway Database Setup (10 minutes)

### 2.1 Create New Project
1. Go to https://railway.app/new
2. Click **"New Project"**
3. Name it: `lyzr-orchestrator`

### 2.2 Add PostgreSQL
1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway will provision the database
3. Click on the **PostgreSQL service**
4. Go to **"Connect"** tab
5. Copy the **DATABASE_URL** (starts with `postgresql://`)
   ```
   Example: postgresql://postgres:pass@containers-us-west-123.railway.app:5432/railway
   ```
6. **SAVE THIS** - you'll need it for backend

### 2.3 Add Redis
1. Click **"+ New"** → **"Database"** → **"Redis"**
2. Click on the **Redis service**
3. Go to **"Connect"** tab
4. Copy the **REDIS_URL** (starts with `redis://`)
   ```
   Example: redis://default:pass@containers-us-west-456.railway.app:6379
   ```
5. **SAVE THIS** - you'll need it for backend

---

## 🔧 STEP 3: Railway Backend Deployment (15 minutes)

### 3.1 Deploy Backend Service
1. In your Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select your repository: `lyzr` (or whatever you named it)
3. Choose **"Deploy"**
4. Railway will auto-detect the backend

### 3.2 Configure Backend Service
1. Click on the deployed service
2. Go to **Settings** → **General**
3. Set **Root Directory**: `backend`
4. Set **Custom Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 3.3 Upload TLS Certificates
Railway doesn't support file uploads directly, so we'll encode them as environment variables:

**Option A: Base64 Encode (Recommended)**
```bash
# On your local machine
base64 -w 0 client.pem > client.pem.b64
base64 -w 0 client-key.pem > client-key.pem.b64
```

**Option B: Mount as environment variables (text)**
Just copy the entire content of each .pem file

### 3.4 Set Environment Variables
Go to **Variables** tab and add:

```bash
# Database (from Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (from Railway Redis)  
REDIS_URL=${{Redis.REDIS_URL}}

# Temporal Cloud (from Step 1.3)
TEMPORAL_HOST=your-namespace.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace

# TLS Certificates (Option A: if using base64)
TEMPORAL_TLS_CERT_BASE64=<paste content of client.pem.b64>
TEMPORAL_TLS_KEY_BASE64=<paste content of client-key.pem.b64>

# OR (Option B: if using direct text)
TEMPORAL_TLS_CERT=<paste entire client.pem content>
TEMPORAL_TLS_KEY=<paste entire client-key.pem content>

# OpenAI API Key
OPENAI_API_KEY=sk-...

# CORS - Will update after Vercel deployment
CORS_ORIGINS=["http://localhost:3000"]

# App Config
APP_NAME=Lyzr Orchestrator
DEBUG=False
API_PORT=8000
```

### 3.5 Generate Public URL
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://lyzr-backend-production.up.railway.app`)
4. **SAVE THIS** - you'll need it for Vercel and Worker

### 3.6 Test Backend
```bash
curl https://your-backend-url.up.railway.app/health
```

Expected response:
```json
{"status": "healthy"}
```

---

## 👷 STEP 4: Railway Worker Deployment (10 minutes)

### 4.1 Create Worker Service
1. In Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select the **same repository** again
3. Railway will create a second service

### 4.2 Configure Worker Service
1. Click on the new service
2. **Rename it to**: `worker` (Settings → General → Service Name)
3. Set **Root Directory**: `backend`
4. Set **Custom Start Command**: `python -u -m app.temporal.worker`

### 4.3 Set Worker Environment Variables
Go to **Variables** tab and add **ALL the same variables** as backend:

```bash
# Copy all variables from Backend (Step 3.4)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
TEMPORAL_HOST=your-namespace.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace
TEMPORAL_TLS_CERT_BASE64=...
TEMPORAL_TLS_KEY_BASE64=...
OPENAI_API_KEY=sk-...
```

### 4.4 Deploy Worker
The worker should auto-deploy. Check logs:
1. Go to **Deployments** tab
2. Click latest deployment
3. Look for:
   ```
   🔨 Starting Temporal Worker...
   🔐 Using TLS for Temporal Cloud connection
   ✅ Connected to Temporal!
   🚀 Worker is now polling for tasks...
   ```

---

## 🎨 STEP 5: Vercel Frontend Deployment (10 minutes)

### 5.1 Create Vercel Project
1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Click **"Import"**

### 5.2 Configure Build Settings
1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: `frontend`
3. **Build Command**: `pnpm build` (auto-detected)
4. **Output Directory**: `.next` (auto-detected)

### 5.3 Set Environment Variables
Click **"Environment Variables"** and add:

```bash
# Backend API URL (from Step 3.5)
NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app

# WebSocket URL (same as API, but wss://)
NEXT_PUBLIC_WS_URL=wss://your-backend-url.up.railway.app
```

### 5.4 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Copy your Vercel URL (e.g., `https://lyzr-orchestrator.vercel.app`)

### 5.5 Update Backend CORS
Go back to Railway → Backend service → Variables:
```bash
# Update CORS_ORIGINS to include Vercel URL
CORS_ORIGINS=["https://your-app.vercel.app"]
```

Backend will auto-redeploy with new CORS settings.

---

## ✅ STEP 6: Verification & Testing (5 minutes)

### 6.1 Check All Services
```bash
# Backend Health
curl https://your-backend.up.railway.app/health

# Frontend
open https://your-app.vercel.app
```

### 6.2 Test Workflow Creation
1. Open your Vercel frontend
2. Click **"New Workflow"**
3. Drag nodes: **Trigger** → **Agent** → **End**
4. Configure Agent:
   - System Instructions: "You are a helpful assistant"
   - Model: `gpt-4o-mini`
5. Click **"Save"**
6. Click **"Run"**
7. Enter input: "Write a haiku about coding"

### 6.3 Verify Execution
Check that:
- ✅ Workflow appears in Temporal Cloud dashboard
- ✅ Agent generates response
- ✅ Real-time updates work in UI
- ✅ Event log shows execution steps

---

## 🎯 Quick Reference

### Service URLs
| Service | URL | Purpose |
|---------|-----|---------|
| **Temporal Cloud** | `namespace.tmprl.cloud:7233` | Workflow orchestration |
| **Railway Backend** | `backend.up.railway.app` | API server |
| **Railway Worker** | N/A (background) | Workflow execution |
| **Railway Postgres** | Internal | Database |
| **Railway Redis** | Internal | Events/caching |
| **Vercel Frontend** | `app.vercel.app` | User interface |

### Environment Variables Summary

**Backend/Worker (Railway):**
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
TEMPORAL_HOST=namespace.tmprl.cloud:7233
TEMPORAL_NAMESPACE=namespace
TEMPORAL_TLS_CERT_BASE64=...
TEMPORAL_TLS_KEY_BASE64=...
OPENAI_API_KEY=sk-...
CORS_ORIGINS=["https://app.vercel.app"]
```

**Frontend (Vercel):**
```bash
NEXT_PUBLIC_API_URL=https://backend.up.railway.app
NEXT_PUBLIC_WS_URL=wss://backend.up.railway.app
```

---

## 🐛 Troubleshooting

### Worker Can't Connect to Temporal
**Error**: `Connection refused` or `TLS handshake failed`

**Fix**:
1. Verify `TEMPORAL_HOST` format: `namespace.tmprl.cloud:7233` (note port 7233)
2. Check certificates are correctly base64 encoded
3. Ensure namespace exists in Temporal Cloud

### Backend CORS Errors
**Error**: `Access-Control-Allow-Origin` errors in browser

**Fix**:
```bash
# Railway Backend Variables
CORS_ORIGINS=["https://your-exact-vercel-url.vercel.app"]
```

### Database Connection Failed
**Error**: `Connection to database failed`

**Fix**:
```bash
# Make sure DATABASE_URL is referenced correctly
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### WebSocket Not Connecting
**Error**: WebSocket connection failed

**Fix**:
1. Check `NEXT_PUBLIC_WS_URL` uses `wss://` (not `ws://`)
2. Verify Redis is running in Railway
3. Check Railway backend logs for WebSocket errors

---

## 🎉 Success Checklist

- [ ] Temporal Cloud namespace created
- [ ] TLS certificates downloaded
- [ ] Railway PostgreSQL provisioned
- [ ] Railway Redis provisioned
- [ ] Backend deployed on Railway
- [ ] Worker deployed on Railway
- [ ] Backend health check passes
- [ ] Worker logs show "Connected to Temporal!"
- [ ] Frontend deployed on Vercel
- [ ] Frontend loads in browser
- [ ] Test workflow created
- [ ] Test workflow executes successfully
- [ ] Real-time updates work
- [ ] Temporal Cloud shows workflow execution

---

## 🚀 You're Live!

Your Lyzr Orchestrator is now running in production! 

**Next Steps:**
1. Create demo workflows for your presentation
2. Test all node types (Agent, Timer, API Call, etc.)
3. Set up monitoring (optional)
4. Add custom domain (optional)

**Cost Estimate:**
- Temporal Cloud: Free ($945 credits for 6 months)
- Railway: ~$5-10/month
- Vercel: Free
- **Total: ~$5-10/month**

Need help? Check the logs in Railway/Vercel dashboards!
