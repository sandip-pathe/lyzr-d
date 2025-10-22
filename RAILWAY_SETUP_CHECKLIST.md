# 🎯 Railway Setup - Step-by-Step Checklist

Use this checklist while setting up Railway. Check off each item as you complete it.

---

## Part 1: Railway Project Setup

### Create Project
- [ ] Go to [railway.app](https://railway.app)
- [ ] Click "New Project"
- [ ] Name it: "Lyzr Orchestrator"
- [ ] Select region: (Choose closest to your users)

---

## Part 2: Add Database Services

### Add PostgreSQL
- [ ] Click "+ New"
- [ ] Select "Database" → "PostgreSQL"
- [ ] Wait for provisioning (1-2 minutes)
- [ ] Verify status shows "Active"

### Add Redis
- [ ] Click "+ New"
- [ ] Select "Database" → "Redis"
- [ ] Wait for provisioning (1-2 minutes)
- [ ] Verify status shows "Active"

---

## Part 3: Backend Service Setup

### Connect GitHub Repository
- [ ] Click "+ New"
- [ ] Select "GitHub Repo"
- [ ] Choose: `sandip-pathe/lyzr-d`
- [ ] Rename service to: `backend`

### Configure Backend Settings
- [ ] Click backend service
- [ ] Go to "Settings" tab
- [ ] Set "Root Directory": `/backend`
- [ ] Set "Watch Paths": `/backend/**`
- [ ] Leave "Railway Config Path" empty
- [ ] Save changes

### Add Backend Environment Variables
- [ ] Click "Variables" tab
- [ ] Click "+ New Variable"

Add these variables one by one:

**Auto-Link Database:**
- [ ] `DATABASE_URL` → Click "Add Reference" → Select Postgres → `DATABASE_URL`

**Auto-Link Redis:**
- [ ] `REDIS_URL` → Click "Add Reference" → Select Redis → `REDIS_URL`

**Temporal Configuration:**
- [ ] `TEMPORAL_HOST` = `ap-south-1.aws.api.temporal.io:7233`
- [ ] `TEMPORAL_NAMESPACE` = `lyzr.ww6tj`
- [ ] `TEMPORAL_API_KEY` = `<paste_your_temporal_api_key>`

**OpenAI:**
- [ ] `OPENAI_API_KEY` = `<paste_your_openai_api_key>`

**CORS (Update after Vercel deployment):**
- [ ] `CORS_ORIGINS` = `["http://localhost:3000"]`

**App Settings:**
- [ ] `DEBUG` = `false`
- [ ] `PYTHONUNBUFFERED` = `1`

### Generate Backend Domain
- [ ] Go to "Settings" → "Networking"
- [ ] Click "Generate Domain"
- [ ] Copy the generated URL
- [ ] Save it here: `https://_________________________________.up.railway.app`

---

## Part 4: Worker Service Setup

### Add Worker from Same Repo
- [ ] Click "+ New"
- [ ] Select "GitHub Repo"
- [ ] Choose: `sandip-pathe/lyzr-d` (same repo)
- [ ] Rename service to: `worker`

### Configure Worker Settings
- [ ] Click worker service
- [ ] Go to "Settings" tab
- [ ] Set "Root Directory": `/backend`
- [ ] Set "Railway Config Path": `railway.worker.yaml`
- [ ] Set "Watch Paths": `/backend/**`
- [ ] Save changes

### Add Worker Environment Variables
- [ ] Click "Variables" tab
- [ ] Click "+ New Variable"

Add these variables:

**Auto-Link Database:**
- [ ] `DATABASE_URL` → Click "Add Reference" → Select Postgres → `DATABASE_URL`

**Auto-Link Redis:**
- [ ] `REDIS_URL` → Click "Add Reference" → Select Redis → `REDIS_URL`

**Temporal Configuration:**
- [ ] `TEMPORAL_HOST` = `ap-south-1.aws.api.temporal.io:7233`
- [ ] `TEMPORAL_NAMESPACE` = `lyzr.ww6tj`
- [ ] `TEMPORAL_API_KEY` = `<paste_your_temporal_api_key>`

**OpenAI:**
- [ ] `OPENAI_API_KEY` = `<paste_your_openai_api_key>`

**App Settings:**
- [ ] `PYTHONUNBUFFERED` = `1`

---

## Part 5: Verify Railway Deployment

### Check Backend Deployment
- [ ] Click backend service
- [ ] Go to "Deployments" tab
- [ ] Wait for "Success" status (3-5 minutes)
- [ ] Click latest deployment
- [ ] Review "Deploy Logs" for errors
- [ ] Look for: "Application startup complete"

### Check Worker Deployment
- [ ] Click worker service
- [ ] Go to "Deployments" tab
- [ ] Wait for "Success" status (3-5 minutes)
- [ ] Click latest deployment
- [ ] Review "Deploy Logs"
- [ ] Look for: "✅ Connected to Temporal!"
- [ ] Look for: "🚀 Worker is now polling"

### Test Backend API
- [ ] Open terminal
- [ ] Run: `curl https://your-backend-url.up.railway.app/health`
- [ ] Verify response: `{"status":"healthy",...}`
- [ ] Run: `curl https://your-backend-url.up.railway.app/`
- [ ] Verify: JSON response with API info

---

## Part 6: Frontend Deployment (Vercel)

### Update Frontend Environment
- [ ] Open `frontend/.env.production` in editor
- [ ] Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
- [ ] Set `NEXT_PUBLIC_WS_URL` to same URL (but with `wss://`)
- [ ] Save file

### Deploy to Vercel
- [ ] Open terminal in `frontend` directory
- [ ] Run: `vercel login` (if not logged in)
- [ ] Run: `vercel --prod`
- [ ] Wait for deployment (2-3 minutes)
- [ ] Copy the Vercel URL
- [ ] Save it here: `https://_________________________________.vercel.app`

### Test Frontend
- [ ] Open Vercel URL in browser
- [ ] Verify page loads without errors
- [ ] Open browser DevTools Console
- [ ] Check for no red errors
- [ ] Try navigating to different pages

---

## Part 7: Update CORS Configuration

### Update Backend CORS
- [ ] Go back to Railway dashboard
- [ ] Click backend service
- [ ] Go to "Variables" tab
- [ ] Find `CORS_ORIGINS` variable
- [ ] Update value to: `["https://your-vercel-url.vercel.app","http://localhost:3000"]`
- [ ] Wait for backend to redeploy (auto-triggers)

### Verify CORS Works
- [ ] Refresh your Vercel frontend
- [ ] Open browser DevTools Console
- [ ] Check for no CORS errors
- [ ] Try creating a workflow

---

## Part 8: End-to-End Testing

### Create Test Workflow
- [ ] Go to Vercel frontend
- [ ] Click "New Workflow"
- [ ] Name it: "Test Workflow"
- [ ] Add nodes:
  - [ ] Trigger node
  - [ ] Agent node
  - [ ] End node
- [ ] Connect: Trigger → Agent → End
- [ ] Configure Agent:
  - [ ] Set prompt: "Say hello and describe what you can do"
  - [ ] Set output key: "greeting"
- [ ] Click "Save Workflow"

### Execute Test Workflow
- [ ] Click "Run Workflow" button
- [ ] Watch for real-time updates
- [ ] Verify:
  - [ ] Trigger node turns green
  - [ ] Agent node executes (shows loading)
  - [ ] Agent node turns green
  - [ ] End node turns green
  - [ ] Timeline updates in real-time
  - [ ] Output appears in sidebar
  - [ ] Logs show in event log

### Check Temporal Dashboard
- [ ] Go to [cloud.temporal.io](https://cloud.temporal.io)
- [ ] Log in to your account
- [ ] Go to namespace: `lyzr.ww6tj`
- [ ] Find your workflow in history
- [ ] Click to view details
- [ ] Verify:
  - [ ] Workflow status: "Completed"
  - [ ] All activities succeeded
  - [ ] No errors in event history

---

## Part 9: Prepare Demo Workflows

Create these workflows for your presentation:

### Demo 1: Simple Agent
- [ ] Trigger → Agent("Summarize this text") → End
- [ ] Test execution
- [ ] Save as "Demo 1 - Simple Agent"

### Demo 2: Conditional Logic
- [ ] Trigger → Agent → Conditional → [Agent A / Agent B] → Merge → End
- [ ] Configure conditional: "If positive sentiment"
- [ ] Test both paths
- [ ] Save as "Demo 2 - Conditional"

### Demo 3: Approval Flow
- [ ] Trigger → Agent → Approval → Agent → End
- [ ] Test approval process
- [ ] Save as "Demo 3 - Approval"

### Demo 4: Multi-Agent
- [ ] Trigger → Agent 1 → Agent 2 → Agent 3 → End
- [ ] Configure data flow between agents
- [ ] Test execution
- [ ] Save as "Demo 4 - Multi-Agent"

---

## Part 10: Final Verification

### System Health
- [ ] Backend health endpoint returns 200
- [ ] Worker logs show active polling
- [ ] Frontend loads in under 2 seconds
- [ ] No errors in Railway logs
- [ ] No errors in browser console

### Feature Testing
- [ ] Can create new workflows
- [ ] Can edit existing workflows
- [ ] Can delete workflows
- [ ] Can execute workflows
- [ ] Real-time updates work
- [ ] WebSocket connection stable
- [ ] Outputs display correctly
- [ ] Event logs populate

### Presentation Ready
- [ ] All demo workflows created
- [ ] All demo workflows tested
- [ ] URLs bookmarked:
  - [ ] Frontend (Vercel)
  - [ ] Backend (Railway)
  - [ ] Temporal Dashboard
  - [ ] Railway Dashboard
- [ ] Talking points prepared
- [ ] Backup plan if demo fails

---

## ✅ Deployment Complete!

If all items are checked, you're ready to present! 🎉

**Quick Access URLs:**
- Frontend: `____________________________________`
- Backend: `____________________________________`
- Temporal: `https://cloud.temporal.io`
- Railway: `https://railway.app/project/your-project`

**Emergency Commands:**
```bash
# Check backend logs
railway logs -s backend --tail 50

# Check worker logs
railway logs -s worker --tail 50

# Restart backend
railway restart -s backend

# Redeploy frontend
cd frontend && vercel --prod
```

---

**Time to Deploy**: ~15-20 minutes
**Status**: Ready for presentation! 🚀
