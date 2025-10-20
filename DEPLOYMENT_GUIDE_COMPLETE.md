# 🚀 DEPLOYMENT GUIDE - Lyzr Orchestrator

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐     ┌────────────┐ │
│  │   Vercel     │      │   Railway    │     │  Temporal  │ │
│  │  (Frontend)  │─────▶│  (Backend)   │────▶│   Cloud    │ │
│  └──────────────┘      └──────────────┘     └────────────┘ │
│                              │                              │
│                              ▼                              │
│                        ┌──────────────┐                     │
│                        │   Railway    │                     │
│                        │   Worker     │                     │
│                        └──────────────┘                     │
│                              │                              │
│                              ▼                              │
│                ┌──────────────┬──────────────┐             │
│                │   Postgres   │    Redis     │             │
│                │   (Railway)  │  (Railway)   │             │
│                └──────────────┴──────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Pre-Deployment Checklist

### 1. Temporal Cloud Setup
- [x] Create Temporal Cloud account
- [x] Create namespace: `lyzr.ww6tj`
- [x] Generate API Key (starts with `eyJhbGci...`)
- [x] Note the endpoint: `ap-south-1.aws.api.temporal.io:7233`

### 2. Railway Setup
- [x] Create Railway account
- [x] Create project: `brilliant-quietude`
- [x] Provision Postgres database
- [x] Provision Redis database
- [x] Link GitHub repository: `sandip-pathe/lyzr-d`

### 3. API Keys
- [x] OpenAI API key
- [x] Temporal Cloud API key
- [ ] Slack webhook (optional)
- [ ] Resend API key (optional)

## 🔧 Configuration Files

### Backend API (`backend/`)
- **nixpacks.toml** - Minimal config, lets Nixpacks auto-detect
- **railway.json** - Railway service config
- **.python-version** - Python 3.11.9
- **requirements.txt** - All dependencies

### Temporal Worker (`backend/`)
- **nixpacks.worker.toml** - Worker-specific Nixpacks config  
- **Procfile.worker** - Worker start command
- **railway.json** (shared) - Railway service config

### Frontend (`frontend/`)
- **.env.production** - Production environment variables
- **next.config.cjs** - Next.js configuration
- **package.json** - Dependencies

## 📦 Step 1: Deploy Backend API to Railway

### 1.1 Create Backend Service

In Railway dashboard:
1. Click "+ New" → "Empty Service"
2. Name it: `lyzr-backend`
3. Connect to GitHub: `sandip-pathe/lyzr-d`
4. Select branch: `main`
5. **Important**: Set root directory to `/backend`

### 1.2 Configure Environment Variables

Add these in Railway service settings → Variables:

```bash
# Temporal Cloud
TEMPORAL_HOST=ap-south-1.aws.api.temporal.io:7233
TEMPORAL_NAMESPACE=lyzr.ww6tj
TEMPORAL_API_KEY=eyJhbGciOiJFUzI1NiIsICJraWQiOiJXdnR3YUEifQ...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Database (auto-linked by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-linked by Railway)
REDIS_URL=${{Redis.REDIS_URL}}

# CORS - will update after frontend deployment
CORS_ORIGINS=["http://localhost:3000"]

# Optional
PYTHONUNBUFFERED=1
DEBUG=False
```

### 1.3 Deploy

Railway will automatically deploy when you push to GitHub:

```bash
git add .
git commit -m "Configure deployment"
git push origin main
```

Or trigger manually:
```bash
cd backend
railway up
```

### 1.4 Get Backend URL

After deployment:
```bash
railway domain
```

Save this URL, you'll need it for frontend: 
```
https://lyzr-d-production.up.railway.app
```

### 1.5 Verify Deployment

```bash
curl https://lyzr-d-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "temporal": "ok",
  "redis": "ok"
}
```

## 📦 Step 2: Deploy Temporal Worker to Railway

### 2.1 Create Worker Service

In Railway dashboard:
1. Click "+ New" → "Empty Service"  
2. Name it: `lyzr-worker`
3. Connect to same GitHub repo: `sandip-pathe/lyzr-d`
4. Select branch: `main`
5. **Important**: Set root directory to `/backend`
6. In Settings → "Nixpacks Config File": `nixpacks.worker.toml`
7. In Settings → "Custom Start Command": Leave empty (uses Procfile.worker)

### 2.2 Configure Environment Variables

Copy ALL environment variables from backend service:

```bash
# Temporal Cloud (same as backend)
TEMPORAL_HOST=ap-south-1.aws.api.temporal.io:7233
TEMPORAL_NAMESPACE=lyzr.ww6tj
TEMPORAL_API_KEY=eyJhbGciOiJFUzI1NiIsICJraWQiOiJXdnR3YUEifQ...

# OpenAI (same as backend)
OPENAI_API_KEY=sk-proj-...

# Database (link to same Postgres)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (link to same Redis)
REDIS_URL=${{Redis.REDIS_URL}}

# Worker-specific
PYTHONUNBUFFERED=1
```

### 2.3 Deploy

Railway will auto-deploy. You can also:

```bash
cd backend
railway up
```

### 2.4 Verify Worker

Check Railway logs for:
```
🔨 Starting Temporal Worker...
📡 Connecting to: ap-south-1.aws.api.temporal.io:7233
🔧 Namespace: lyzr.ww6tj
🔑 Using API Key authentication for Temporal Cloud
✅ Connected to Temporal!
⚡ Registered activities: [...]
🚀 Worker is now polling for tasks...
```

## 📦 Step 3: Deploy Frontend to Vercel

### 3.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 3.2 Configure Environment Variables

Create `frontend/.env.production`:

```bash
# Backend API URL from Railway
NEXT_PUBLIC_API_URL=https://lyzr-d-production.up.railway.app

# WebSocket URL (same as API)
NEXT_PUBLIC_WS_URL=wss://lyzr-d-production.up.railway.app
```

### 3.3 Deploy to Vercel

```bash
cd frontend
vercel --prod
```

Follow prompts:
- Setup and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- Project name? **lyzr-orchestrator**
- Directory? **./** (current)
- Override settings? **No**

### 3.4 Get Frontend URL

Vercel will output:
```
✅ Production: https://lyzr-orchestrator.vercel.app
```

### 3.5 Update Backend CORS

Go back to Railway → Backend service → Variables:

Update `CORS_ORIGINS`:
```bash
CORS_ORIGINS=["https://lyzr-orchestrator.vercel.app"]
```

Railway will automatically redeploy the backend.

## 🧪 Step 4: End-to-End Testing

### 4.1 Test Backend Health

```bash
curl https://lyzr-d-production.up.railway.app/health
```

### 4.2 Test Frontend

Open browser:
```
https://lyzr-orchestrator.vercel.app
```

### 4.3 Create Test Workflow

1. Open frontend
2. Create new workflow
3. Add nodes: Trigger → Agent → End
4. Configure Trigger: `{"prompt": "Write a haiku about clouds"}`
5. Configure Agent: Select OpenAI model
6. Save workflow
7. Click "Run Workflow"

### 4.4 Verify Execution

Check:
- ✅ Workflow starts (status: running)
- ✅ Worker picks up task (check Railway worker logs)
- ✅ Agent executes (check backend logs)
- ✅ Workflow completes (status: completed)
- ✅ Output visible in UI

## 📊 Monitoring

### Railway Services

```bash
# Backend logs
railway logs -s lyzr-backend

# Worker logs  
railway logs -s lyzr-worker

# Follow logs
railway logs -f
```

### Temporal Cloud

1. Login to https://cloud.temporal.io
2. Navigate to your namespace: `lyzr.ww6tj`
3. View workflow executions
4. Check task queue: `orchestration-queue`

### Vercel

```bash
# Check deployment status
vercel ls

# View logs
vercel logs
```

## 🔍 Troubleshooting

### Backend fails to start

**Error**: "Application not found"

**Solution**: 
1. Check Railway logs
2. Verify `DATABASE_URL` and `REDIS_URL` are linked
3. Ensure root directory is `/backend`
4. Check `nixpacks.toml` is minimal

### Worker not receiving tasks

**Error**: No logs in worker

**Solution**:
1. Verify `TEMPORAL_API_KEY` is correct
2. Check `TEMPORAL_HOST` and `TEMPORAL_NAMESPACE`
3. Ensure task queue name matches: `orchestration-queue`
4. Check Temporal Cloud dashboard for worker status

### Frontend cannot connect to backend

**Error**: CORS error in browser console

**Solution**:
1. Update backend `CORS_ORIGINS` with Vercel URL
2. Ensure `NEXT_PUBLIC_API_URL` is correct
3. Check backend is deployed and running
4. Test backend health endpoint

### Database connection fails

**Error**: "Could not connect to database"

**Solution**:
1. Check `DATABASE_URL` in Railway variables
2. Verify Postgres service is running
3. Ensure DATABASE_URL reference is correct: `${{Postgres.DATABASE_URL}}`
4. Check service is linked to Postgres

## 🎉 Success Criteria

- ✅ Backend API responding at Railway URL
- ✅ Worker connected to Temporal Cloud
- ✅ Frontend deployed to Vercel
- ✅ Can create workflows in UI
- ✅ Can execute workflows successfully
- ✅ Agent nodes generate outputs
- ✅ Event logs visible
- ✅ WebSocket updates working

## 📝 Final Notes

### Production Checklist

- [ ] Set `DEBUG=False` in backend
- [ ] Configure proper CORS origins
- [ ] Set up monitoring/alerts
- [ ] Enable database backups
- [ ] Configure rate limiting
- [ ] Add authentication (if needed)
- [ ] Set up custom domains
- [ ] Configure environment-specific settings

### Scaling

**Backend API**: 
- Railway auto-scales based on traffic
- Monitor CPU/memory usage
- Add replicas if needed

**Temporal Worker**:
- Add more worker instances for parallel processing
- Each worker polls same task queue
- Railway: duplicate service with same config

**Database**:
- Railway Postgres handles connections
- Monitor query performance
- Add indexes for slow queries
- Consider read replicas for heavy load

### Security

1. **API Keys**: Rotate regularly
2. **Database**: Use connection pooling
3. **CORS**: Restrict to known domains
4. **Rate Limiting**: Implement for API
5. **Secrets**: Never commit to repo
6. **HTTPS**: Enabled by default on Railway/Vercel

## 🆘 Support

- Railway Discord: https://discord.gg/railway
- Temporal Slack: https://temporal.io/slack
- Vercel Support: https://vercel.com/support

---

**Deployment Date**: October 21, 2025
**Version**: 2.0.0
**Status**: Ready for Production ✅
