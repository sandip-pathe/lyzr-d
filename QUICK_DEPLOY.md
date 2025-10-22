# 🎯 Quick Start - Railway Deployment

## ⚡ 5-Minute Deploy

### Step 1: Push to GitHub
```bash
git add .
git commit -m "chore: optimize Railway deployment configuration"
git push origin main
```

### Step 2: Railway Backend Setup

1. **Create New Project** on Railway
2. **Add Services:**
   - PostgreSQL (template)
   - Redis (template)
   - Backend (from GitHub: `sandip-pathe/lyzr-d`)
   - Worker (from GitHub: `sandip-pathe/lyzr-d`)

3. **Configure Backend Service:**
   - Root Directory: `/backend`
   - Add env vars (see below)
   - Generate domain

4. **Configure Worker Service:**
   - Root Directory: `/backend`
   - Config Path: `railway.worker.yaml`
   - Add env vars (see below)

### Step 3: Environment Variables

**Both Backend & Worker need:**
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
TEMPORAL_HOST=ap-south-1.aws.api.temporal.io:7233
TEMPORAL_NAMESPACE=lyzr.ww6tj
TEMPORAL_API_KEY=<your_key>
OPENAI_API_KEY=<your_key>
PYTHONUNBUFFERED=1
```

**Backend only:**
```bash
CORS_ORIGINS=["http://localhost:3000"]
DEBUG=false
```

### Step 4: Deploy Frontend

```bash
cd frontend

# Update .env.production with Railway backend URL
NEXT_PUBLIC_API_URL=https://backend-xxxx.up.railway.app
NEXT_PUBLIC_WS_URL=wss://backend-xxxx.up.railway.app

# Deploy to Vercel
vercel --prod
```

### Step 5: Update CORS

After Vercel deployment, update Railway backend:
```bash
CORS_ORIGINS=["https://your-app.vercel.app","http://localhost:3000"]
```

### Step 6: Test Everything

```bash
# Backend health
curl https://backend-xxxx.up.railway.app/health

# Expected: {"status":"healthy",...}
```

Visit Vercel URL → Create workflow → Execute → ✅ Success!

---

## 🆘 Quick Troubleshooting

**Backend won't start?**
- Check Railway logs
- Verify all env vars set
- Ensure Postgres & Redis linked

**Worker not connecting?**
- Verify Temporal credentials
- Check worker logs: `railway logs -s worker`

**Frontend 404 errors?**
- Verify backend URL in `.env.production`
- Check CORS includes Vercel URL
- Redeploy frontend

---

## 📚 Full Documentation

- [DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md) - Complete guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Detailed checklist

---

**Ready to present!** 🎉
