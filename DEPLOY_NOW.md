# 🎯 DEPLOYMENT QUICK START - Railway Backend

## ✅ Problem Solved

**Issue**: Railway error `Script start.sh not found`  
**Root Cause**: Railway was looking at repo root instead of `backend/` directory  
**Solution**: Added `railway.toml` to configure Railway properly

---

## 🚀 Deploy NOW (5 Steps)

### **Step 1: Push Changes to GitHub**

```bash
git add .
git commit -m "Configure Railway for backend deployment"
git push origin main
```

### **Step 2: Create Railway Service**

1. Go to https://railway.app/
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository: `lyzr-d`
4. Railway will detect the Python app ✅

### **Step 3: Add Database Services**

In your Railway project:

**Add PostgreSQL**:
1. Click **"New"** → **"Database"** → **"PostgreSQL"**
2. Wait for provisioning

**Add Redis**:
1. Click **"New"** → **"Database"** → **"Redis"**
2. Wait for provisioning

### **Step 4: Configure Backend Service**

Click on your **backend service** → **Variables**:

```bash
# Link databases (click "New Variable" → "Add Reference")
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Temporal Cloud (get from Temporal Cloud dashboard)
TEMPORAL_HOST=your-namespace.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace

# TLS Certificates (base64 encoded - see below)
TEMPORAL_TLS_CERT_BASE64=<paste base64 content>
TEMPORAL_TLS_KEY_BASE64=<paste base64 content>

# OpenAI API
OPENAI_API_KEY=sk-proj-...

# CORS (update after Vercel deployment)
CORS_ORIGINS=["http://localhost:3000"]

# App Settings
APP_NAME=Lyzr Orchestrator
DEBUG=False
```

**To base64 encode certificates** (Git Bash on Windows):
```bash
cd ~/Downloads  # Where you saved client.pem and client-key.pem
base64 -w 0 client.pem > client.pem.b64
base64 -w 0 client-key.pem > client-key.pem.b64
cat client.pem.b64  # Copy this entire output
cat client-key.pem.b64  # Copy this entire output
```

### **Step 5: Generate Public URL**

1. Backend service → **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy URL (e.g., `https://lyzr-backend-production.up.railway.app`)
4. **Save this** for Vercel deployment

---

## ✅ Verify Deployment

### Check Build Logs
Railway → Deployments → View Logs

Expected:
```
✓ Found Python app
✓ Installing dependencies from requirements.txt
✓ Starting server
INFO: Uvicorn running on http://0.0.0.0:8000
🚀 Lyzr Orchestrator API starting...
✅ All routers and event listeners loaded
```

### Test Health Endpoint

```bash
curl https://your-backend.up.railway.app/health
```

Expected response:
```json
{"status": "healthy", "temporal": "ok", "redis": "ok"}
```

---

## 🎯 What You Just Deployed

```
Railway Backend Service:
├── FastAPI REST API ✅
├── WebSocket endpoints ✅
├── PostgreSQL connection ✅
├── Redis connection ✅
├── Temporal Cloud client ✅
└── NO worker (deployed separately) ✅
```

---

## 🔧 Worker Deployment Options

### **Option A: Worker on Railway** (Recommended for NOW)

**Pros**: Simple, fast, everything in one place  
**Cons**: Costs ~$10/month extra  
**Time**: 5 minutes

**Steps**:
1. Railway project → **"New"** → **"GitHub Repo"** (same repo)
2. Service name: `worker`
3. Settings → Deploy:
   - **Custom Start Command**: `cd backend && python -u -m app.temporal.worker`
4. Variables: Copy ALL variables from backend service
5. Deploy ✅

---

### **Option B: Worker on Temporal Cloud** (For AFTER Presentation)

**Pros**: Free compute, lower cost (~$5/month total)  
**Cons**: More complex setup  
**Time**: 30 minutes

See `TEMPORAL_CLOUD_WORKER.md` for detailed guide.

---

## 🎨 Next: Deploy Frontend

### **Vercel Deployment** (5 minutes)

1. Go to https://vercel.com/
2. **Import Git Repository** → Select your repo
3. **Root Directory**: `frontend`
4. **Environment Variables**:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
   NEXT_PUBLIC_WS_URL=wss://your-backend.up.railway.app
   ```
5. Click **"Deploy"** ✅
6. Copy Vercel URL

### **Update Backend CORS**

Go back to Railway → Backend → Variables:
```bash
CORS_ORIGINS=["https://your-app.vercel.app"]
```

Backend will auto-redeploy with new CORS settings.

---

## 🧪 Test End-to-End

1. Open `https://your-app.vercel.app`
2. Click **"New Workflow"**
3. Add: **Trigger** → **Agent** → **End**
4. Configure Agent:
   - System Instructions: "You are a helpful assistant"
   - Model: `gpt-4o-mini`
5. Save workflow
6. Click **"Run"**
7. Input: "Write a haiku about deployment"
8. Watch it execute! ✅

---

## 📋 Deployment Checklist

- [ ] Git changes pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL added
- [ ] Redis added
- [ ] Backend service configured
- [ ] Environment variables set
- [ ] Backend health check passes
- [ ] Worker deployed (Option A or B)
- [ ] Frontend deployed to Vercel
- [ ] CORS updated with Vercel URL
- [ ] End-to-end test completed

---

## 💰 Cost Summary

**Backend + Databases**: ~$5/month  
**Worker on Railway**: ~$10/month (optional - or use Temporal Cloud for free)  
**Frontend (Vercel)**: Free  
**Temporal Cloud**: Free (6 months, $945 credits)  

**Total**: $5-15/month depending on worker choice

---

## 🆘 Troubleshooting

### Railway Build Fails
- Check `railway.toml` is in repo root
- Verify `backend/requirements.txt` exists
- Check build logs for specific error

### Health Check Fails
- Verify all environment variables set
- Check DATABASE_URL and REDIS_URL are linked
- View deploy logs for errors

### CORS Errors in Frontend
- Update `CORS_ORIGINS` in Railway backend
- Format must be JSON array: `["https://..."]`
- Backend must redeploy after changing CORS

---

## ✅ You're Ready!

Your backend is now:
- ✅ Separated from worker
- ✅ Configured for Railway
- ✅ Ready to deploy

**Time to deploy: 10-15 minutes**

Follow the 5 steps above and you'll be live! 🚀
