# 🚀 Deployment Checklist - Lyzr Orchestrator

Use this checklist to track your deployment progress.

---

## 📋 Pre-Deployment

- [ ] **Code pushed to GitHub**
  ```bash
  git add .
  git commit -m "Production deployment ready"
  git push origin main
  ```

- [ ] **OpenAI API Key obtained**
  - Go to https://platform.openai.com/api-keys
  - Create new key
  - Save securely

---

## ☁️ Temporal Cloud Setup

- [ ] **Account created**: https://cloud.temporal.io/
- [ ] **Namespace created**
  - Name: ________________
  - Region: ________________
- [ ] **TLS Certificates downloaded**
  - [ ] `client.pem` saved
  - [ ] `client-key.pem` saved
- [ ] **Connection details noted**
  - Host: `________________.tmprl.cloud:7233`
  - Namespace: ________________

### Base64 Encode Certificates (for Railway)
```bash
# Run these commands on your local machine
base64 -w 0 client.pem > client.pem.b64
base64 -w 0 client-key.pem > client-key.pem.b64

# On Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("client.pem")) > client.pem.b64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("client-key.pem")) > client-key.pem.b64
```

- [ ] **Certificates base64 encoded**
  - [ ] `client.pem.b64` created
  - [ ] `client-key.pem.b64` created

---

## 🚂 Railway Setup

### Database Services

- [ ] **Railway account created**: https://railway.app/
- [ ] **New project created**
  - Project name: ________________
- [ ] **PostgreSQL added**
  - [ ] Service running
  - [ ] `DATABASE_URL` copied: `postgresql://...`
- [ ] **Redis added**
  - [ ] Service running
  - [ ] `REDIS_URL` copied: `redis://...`

### Backend Service

- [ ] **Backend service deployed**
  - [ ] GitHub repo connected
  - [ ] Root directory set to: `backend`
  - [ ] Start command set to: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

- [ ] **Environment variables configured**
  ```bash
  DATABASE_URL=${{Postgres.DATABASE_URL}}
  REDIS_URL=${{Redis.REDIS_URL}}
  TEMPORAL_HOST=________________.tmprl.cloud:7233
  TEMPORAL_NAMESPACE=________________
  TEMPORAL_TLS_CERT_BASE64=________________ (paste from .b64 file)
  TEMPORAL_TLS_KEY_BASE64=________________ (paste from .b64 file)
  OPENAI_API_KEY=sk-________________
  CORS_ORIGINS=["http://localhost:3000"]
  APP_NAME=Lyzr Orchestrator
  DEBUG=False
  ```

- [ ] **Public domain generated**
  - Backend URL: `https://________________.up.railway.app`
  - [ ] URL copied for Vercel

- [ ] **Backend health check passes**
  ```bash
  curl https://your-backend.up.railway.app/health
  ```
  Expected: `{"status": "healthy"}`

### Worker Service

- [ ] **Worker service deployed**
  - [ ] Same GitHub repo connected
  - [ ] Service renamed to: `worker`
  - [ ] Root directory set to: `backend`
  - [ ] Start command set to: `python -u -m app.temporal.worker`

- [ ] **Worker environment variables configured**
  - [ ] All same variables as Backend service
  - [ ] Copy-pasted from Backend

- [ ] **Worker logs show success**
  ```
  🔨 Starting Temporal Worker...
  🔐 Using base64-encoded TLS certificates for Temporal Cloud
  ✅ Connected to Temporal!
  🚀 Worker is now polling for tasks...
  ```

---

## 🎨 Vercel Setup

- [ ] **Vercel account created**: https://vercel.com/
- [ ] **GitHub repo imported**
- [ ] **Build settings configured**
  - Framework: `Next.js` (auto-detected)
  - Root directory: `frontend`
  - Build command: `pnpm build`

- [ ] **Environment variables set**
  ```bash
  NEXT_PUBLIC_API_URL=https://________________.up.railway.app
  NEXT_PUBLIC_WS_URL=wss://________________.up.railway.app
  ```
  (Use your Railway backend URL from above)

- [ ] **Deployment successful**
  - Frontend URL: `https://________________.vercel.app`

- [ ] **Frontend loads in browser**
  - [ ] No console errors
  - [ ] UI renders correctly

---

## 🔗 Cross-Service Configuration

- [ ] **Update Backend CORS**
  - Go back to Railway → Backend → Variables
  - Update `CORS_ORIGINS`:
    ```bash
    CORS_ORIGINS=["https://________________.vercel.app"]
    ```
  - [ ] Backend redeployed automatically

---

## ✅ Testing & Validation

### Basic Tests

- [ ] **Backend health endpoint**
  ```bash
  curl https://your-backend.up.railway.app/health
  ```
  Expected: `{"status": "healthy", "temporal": "ok", "redis": "ok"}`

- [ ] **Frontend loads**
  - Open: `https://your-app.vercel.app`
  - [ ] No CORS errors
  - [ ] No network errors

### End-to-End Workflow Test

- [ ] **Create test workflow**
  1. Click "New Workflow" in UI
  2. Add nodes: **Trigger** → **Agent** → **End**
  3. Configure Agent:
     - System Instructions: "You are a helpful assistant"
     - Model: `gpt-4o-mini`
  4. Save workflow

- [ ] **Execute workflow**
  1. Click "Run"
  2. Enter input: "Write a haiku about coding"
  3. Submit

- [ ] **Verify execution**
  - [ ] Workflow starts (shows "Running" status)
  - [ ] Real-time updates appear in UI
  - [ ] Agent generates response
  - [ ] Workflow completes successfully
  - [ ] Event log shows all steps

- [ ] **Check Temporal Cloud**
  - Go to https://cloud.temporal.io/
  - Navigate to your namespace
  - [ ] Workflow execution visible
  - [ ] Shows completed status

### WebSocket Test

- [ ] **Real-time updates working**
  - Create and run a workflow
  - [ ] Status updates appear instantly
  - [ ] No WebSocket connection errors in console

---

## 📊 Monitoring Setup (Optional)

- [ ] **Railway metrics**
  - Check CPU/Memory usage in Railway dashboard
  
- [ ] **Temporal Cloud dashboard**
  - Monitor workflow executions
  - Check task queue health

- [ ] **Vercel analytics**
  - Enable in Vercel dashboard (optional)

---

## 🎯 Production Readiness

- [ ] **All services running**
  - [ ] Railway PostgreSQL: ✓
  - [ ] Railway Redis: ✓
  - [ ] Railway Backend: ✓
  - [ ] Railway Worker: ✓
  - [ ] Vercel Frontend: ✓

- [ ] **All tests passing**
  - [ ] Health checks: ✓
  - [ ] Workflow creation: ✓
  - [ ] Workflow execution: ✓
  - [ ] Real-time updates: ✓

- [ ] **Documentation ready**
  - [ ] Environment variables documented
  - [ ] Service URLs noted
  - [ ] Access credentials stored securely

---

## 📝 Service URLs Reference

Record your URLs here for quick access:

| Service | URL |
|---------|-----|
| **Temporal Cloud** | `________________.tmprl.cloud:7233` |
| **Railway Backend** | `https://________________.up.railway.app` |
| **Railway Worker** | (background service, no URL) |
| **Vercel Frontend** | `https://________________.vercel.app` |
| **Temporal Cloud UI** | `https://cloud.temporal.io/namespaces/________________` |

---

## 🔐 Security Checklist

- [ ] **Secrets not committed to Git**
  - Check: `git log --all --full-history --source -- '*.env'`
  - Should return nothing

- [ ] **Environment variables set in platforms**
  - Not hardcoded in code

- [ ] **CORS properly configured**
  - Only allows your Vercel domain

- [ ] **TLS certificates secured**
  - Only in Railway environment variables
  - Not in code repository

---

## 🎉 Launch!

- [ ] **All checklist items complete**
- [ ] **Demo workflow prepared**
- [ ] **Presentation ready**

---

## 🆘 Troubleshooting

If something doesn't work:

1. **Check Railway logs**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # View logs
   railway login
   railway logs
   ```

2. **Check Vercel logs**
   - Vercel Dashboard → Your Project → Logs

3. **Check Temporal Cloud**
   - Temporal Dashboard → Your Namespace → Workflows

4. **Common issues**:
   - CORS errors → Update `CORS_ORIGINS` in Railway
   - Worker not connecting → Check TLS certificates
   - WebSocket errors → Verify `NEXT_PUBLIC_WS_URL` uses `wss://`
   - Database errors → Check `DATABASE_URL` format

---

## 📞 Support Resources

- **Temporal Docs**: https://docs.temporal.io/cloud/
- **Railway Docs**: https://docs.railway.app/
- **Vercel Docs**: https://vercel.com/docs

**Your production deployment is ready! 🚀**
