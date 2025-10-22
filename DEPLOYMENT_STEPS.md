# 🚀 Deployment Steps - Lyzr Orchestrator

Last Updated: October 22, 2025

## 📋 Prerequisites Checklist

- [x] Backend tested locally ✅
- [x] Frontend tested locally ✅
- [ ] Railway account with project created
- [ ] Vercel account ready
- [ ] Temporal Cloud credentials ready
- [ ] OpenAI API key ready

---

## 🎯 Part 1: Railway Backend Deployment

### Step 1: Create Railway Services

1. Go to [railway.app](https://railway.app)
2. Create a new project: "Lyzr Orchestrator"
3. Add the following services:
   - ✅ PostgreSQL (from template)
   - ✅ Redis (from template)
   - ✅ Backend (from GitHub)
   - ✅ Worker (from GitHub)

### Step 2: Configure Backend Service

**Service Settings:**
- **Name**: `backend`
- **Source**: Connect to your GitHub repo `sandip-pathe/lyzr-d`
- **Root Directory**: `/backend`
- **Railway Config Path**: Leave empty (uses `railway.yaml`)

**Environment Variables:**
```bash
# Auto-linked (no action needed)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Manual - Add these secrets
TEMPORAL_HOST=ap-south-1.aws.api.temporal.io:7233
TEMPORAL_NAMESPACE=lyzr.ww6tj
TEMPORAL_API_KEY=<your_temporal_api_key>
OPENAI_API_KEY=<your_openai_api_key>

# Configure CORS
CORS_ORIGINS=["https://your-app.vercel.app","http://localhost:3000"]

# App settings
DEBUG=false
PYTHONUNBUFFERED=1
```

**Networking:**
- ✅ Generate Public Domain
- ✅ Copy the URL: `https://backend-xxxx.up.railway.app`

### Step 3: Configure Worker Service

**Service Settings:**
- **Name**: `worker`
- **Source**: Same GitHub repo `sandip-pathe/lyzr-d`
- **Root Directory**: `/backend`
- **Railway Config Path**: `railway.worker.yaml`

**Environment Variables:**
```bash
# Same as backend (copy from backend service)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
TEMPORAL_HOST=ap-south-1.aws.api.temporal.io:7233
TEMPORAL_NAMESPACE=lyzr.ww6tj
TEMPORAL_API_KEY=<your_temporal_api_key>
OPENAI_API_KEY=<your_openai_api_key>
PYTHONUNBUFFERED=1
```

**Networking:**
- ❌ No public domain needed (internal worker)

### Step 4: Deploy Backend & Worker

1. Both services should auto-deploy on push to `main` branch
2. Monitor deployment logs:
   ```bash
   railway logs -s backend --tail 50
   railway logs -s worker --tail 50
   ```

3. **Backend Success Indicators:**
   - ✅ "Application startup complete"
   - ✅ "Uvicorn running on 0.0.0.0:8000"
   - ✅ Health check passing

4. **Worker Success Indicators:**
   - ✅ "✅ Connected to Temporal!"
   - ✅ "🚀 Worker is now polling"
   - ✅ No connection errors

### Step 5: Verify Backend Deployment

```bash
# Test health endpoint
curl https://your-backend-xxxx.up.railway.app/health

# Expected response:
{
  "status": "healthy",
  "temporal": "connected",
  "redis": "connected",
  "database": "connected"
}

# Test API root
curl https://your-backend-xxxx.up.railway.app/

# Expected response:
{
  "message": "Lyzr Orchestrator API",
  "version": "1.0.0",
  "docs_url": "/docs"
}
```

---

## 🌐 Part 2: Frontend Deployment (Vercel)

### Step 1: Update Frontend Environment

Edit `frontend/.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-xxxx.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend-xxxx.up.railway.app
```

### Step 2: Deploy to Vercel

**Option A: Vercel CLI**
```bash
cd frontend
vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Import project from GitHub
3. Select `sandip-pathe/lyzr-d`
4. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-xxxx.up.railway.app
   NEXT_PUBLIC_WS_URL=wss://your-backend-xxxx.up.railway.app
   ```

6. Click "Deploy"

### Step 3: Update Backend CORS

After getting your Vercel URL, update Railway backend environment:

```bash
CORS_ORIGINS=["https://your-app.vercel.app","http://localhost:3000"]
```

Redeploy backend service in Railway.

---

## ✅ Part 3: Verification & Testing

### 1. Frontend Loads
- ✅ Visit your Vercel URL
- ✅ Dashboard loads without errors
- ✅ Check browser console for no API errors

### 2. Create Test Workflow
1. Click "New Workflow"
2. Add nodes:
   - Trigger node
   - Agent node (configure with prompt)
   - End node
3. Connect: Trigger → Agent → End
4. Save workflow

### 3. Execute Test Workflow
1. Click "Run Workflow"
2. Watch real-time execution:
   - ✅ Trigger fires
   - ✅ Agent executes
   - ✅ Results appear
   - ✅ Timeline updates
   - ✅ Logs populate

### 4. Check Temporal Dashboard
1. Go to [cloud.temporal.io](https://cloud.temporal.io)
2. Navigate to your namespace: `lyzr.ww6tj`
3. Verify:
   - ✅ Workflow appears in history
   - ✅ Activities completed successfully
   - ✅ No errors in worker logs

---

## 🎬 Part 4: Presentation Preparation

### Demo Checklist

**Before Presentation:**
- [ ] Create 3-4 sample workflows
- [ ] Test each workflow end-to-end
- [ ] Have Temporal dashboard open in tab
- [ ] Have Railway logs open in terminal
- [ ] Prepare talking points for each feature

**Demo Workflows to Prepare:**

**1. Simple Agent Workflow**
```
Trigger → Agent("Analyze this text") → End
```

**2. Conditional Workflow**
```
Trigger → Agent → Conditional → [Agent A / Agent B] → Merge → End
```

**3. Approval Workflow**
```
Trigger → Agent → Approval → Agent → End
```

**4. Complex Multi-Agent**
```
Trigger → Agent 1 → Agent 2 → Agent 3 → End
(Show data flow between agents)
```

### Key Features to Highlight

1. **Visual Workflow Builder**
   - Drag-and-drop interface
   - Real-time canvas updates

2. **Real-Time Execution**
   - Live status updates
   - WebSocket connectivity
   - Timeline visualization

3. **Temporal Integration**
   - Durable execution
   - Show Temporal dashboard
   - Explain fault tolerance

4. **Dynamic Node System**
   - Different node types
   - Custom properties
   - Output mapping

5. **Enterprise Features**
   - Approval gates
   - Event-driven triggers
   - Compensation/rollback

---

## 🆘 Troubleshooting

### Backend Won't Start

**Issue**: Connection errors in logs

**Check:**
```bash
# 1. Database connected?
railway logs -s backend | grep -i "database"

# 2. Temporal connected?
railway logs -s backend | grep -i "temporal"

# 3. Redis connected?
railway logs -s backend | grep -i "redis"
```

**Fix:**
- Verify all environment variables are set
- Check Railway service linking
- Restart services: `railway restart -s backend`

### Worker Won't Connect

**Issue**: "Failed to connect to Temporal"

**Check:**
1. Temporal credentials correct?
2. API key has proper permissions?
3. Network connectivity from Railway?

**Fix:**
```bash
# Check worker logs
railway logs -s worker --tail 100

# Verify credentials in Railway dashboard
# Restart worker
railway restart -s worker
```

### Frontend Can't Reach Backend

**Issue**: CORS or 404 errors

**Check:**
1. Backend URL correct in `.env.production`?
2. Backend has CORS configured with Vercel URL?
3. Backend is running and accessible?

**Fix:**
```bash
# Test backend directly
curl https://your-backend-xxxx.up.railway.app/health

# Update CORS in Railway
CORS_ORIGINS=["https://your-app.vercel.app"]

# Redeploy frontend
vercel --prod
```

---

## 📊 Monitoring

### Railway Metrics
- **Backend**: Monitor requests, errors, response time
- **Worker**: Monitor CPU, memory usage
- **Postgres**: Monitor connections, queries
- **Redis**: Monitor memory, hit rate

### Temporal Dashboard
- **Workflows**: Success rate, duration
- **Activities**: Task queue metrics
- **Workers**: Polling rate, slots used

### Vercel Analytics
- **Frontend**: Page loads, errors
- **API Calls**: Request count, latency

---

## 🎉 Success Criteria

Your deployment is ready for presentation when:

✅ Backend health endpoint returns 200 OK
✅ Worker logs show "polling for tasks"
✅ Frontend loads without console errors
✅ Can create and save workflows
✅ Can execute workflows successfully
✅ Real-time updates work (WebSocket)
✅ Temporal dashboard shows workflow history
✅ All sample workflows tested

---

## 📞 Quick Commands Reference

```bash
# Railway CLI
railway login
railway link
railway logs -s backend
railway logs -s worker
railway restart -s backend
railway status

# Vercel CLI
vercel login
vercel --prod
vercel logs

# Test Backend
curl https://your-backend.up.railway.app/health
curl https://your-backend.up.railway.app/api/workflows

# Git Deploy
git add .
git commit -m "Deploy: Production ready"
git push origin main
```

---

## 🎯 Next Steps

After successful deployment:

1. **Documentation**: Update README with live URLs
2. **Monitoring**: Set up alerts for downtime
3. **Backups**: Configure database backups
4. **Scaling**: Monitor and adjust Railway plans
5. **Security**: Add authentication/authorization
6. **Testing**: Add E2E tests for CI/CD

---

**Good luck with your presentation! 🚀**

Need help? Check Railway logs first, then Temporal dashboard.
