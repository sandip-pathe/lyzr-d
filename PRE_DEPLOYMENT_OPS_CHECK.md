# Pre-Deployment Operations Checklist ✅

## 🎯 Railway Services Architecture

### Your Current Setup (CORRECT)
```
Railway Project: brilliant-quietude
├── lyzr-d (Backend Service)          ← Your FastAPI app
├── Postgres (Database)                ← Railway managed PostgreSQL
└── Redis (Cache)                      ← Railway managed Redis
```

### External Services (Not on Railway)
- **Temporal Cloud**: ap-south-1.aws.api.temporal.io:7233 ✅
  - Namespace: lyzr.ww6tj
  - Authentication: API Key (not hosted on Railway)
- **Vercel**: Frontend hosting at lyzr.anaya.legal ✅

**Note**: You should see 3 services in Railway dashboard:
1. **lyzr-d** - Your backend application
2. **Postgres** - Database (auto-linked via DATABASE_URL)
3. **Redis** - Cache (auto-linked via REDIS_URL)

If you see more than these 3, you can delete any extra services (like "independent-achievement" or worker services you mentioned earlier).

---

## ✅ Environment Variables - ALL SET

### Railway Backend (lyzr-d service)
```env
✅ CORS_ORIGINS=["http://localhost:3000","https://lyzr.anaya.legal"]
✅ DATABASE_URL=postgresql://postgres:***@postgres.railway.internal:5432/railway
✅ DEBUG=false
✅ FRONTEND_URL=https://lyzr.anaya.legal
✅ OPENAI_API_KEY=sk-proj-***
✅ PORT=8000
✅ PYTHONUNBUFFERED=1
✅ REDIS_URL=redis://default:***@redis.railway.internal:6379
✅ TEMPORAL_API_KEY=eyJhbGci***
✅ TEMPORAL_HOST=ap-south-1.aws.api.temporal.io:7233
✅ TEMPORAL_NAMESPACE=lyzr.ww6tj
```

### Vercel Frontend (⚠️ SET IN VERCEL DASHBOARD)
```env
⚠️ NEXT_PUBLIC_API_URL=https://lyzr-d-production.up.railway.app
⚠️ NEXT_PUBLIC_WS_URL=wss://lyzr-d-production.up.railway.app
```

**Action**: Go to Vercel Dashboard → Your Project → Settings → Environment Variables

---

## ✅ Code Fixes Complete

### 1. Backend Configuration ✅
**File**: `backend/app/core/config.py`
- ✅ Added `FRONTEND_URL` setting for notification links

### 2. Notification Service ✅
**File**: `backend/app/services/notification.py`
- ✅ Replaced hardcoded `http://localhost:3000` with `{settings.FRONTEND_URL}`
- ✅ Slack approval buttons now use production URL
- ✅ Email approval links now use production URL

### 3. Frontend Dashboard ✅
**File**: `frontend/app/page.tsx`
- ✅ Removed hardcoded name "Sandip"
- ✅ Changed to generic greeting

---

## 🏥 Health Check Status

**Backend**: https://lyzr-d-production.up.railway.app/health
```json
{
    "status": "healthy",
    "temporal": "ok",
    "redis": "ok"
}
```

✅ All systems operational!

---

## 📋 Files Modified (Ready to Commit)

```
✅ backend/app/core/config.py          - Added FRONTEND_URL
✅ backend/app/services/notification.py - Fixed notification URLs
✅ frontend/app/page.tsx                - Generic dashboard greeting
✅ PRE_DEPLOYMENT_OPS_CHECK.md          - This checklist
```

---

## 🚀 Next Steps

### 1. Commit & Push Changes
```bash
cd /c/x/lyzr
git add -A
git commit -m "fix: configure production URLs and remove hardcoded values"
git push origin main
```

### 2. Set Vercel Environment Variables
In Vercel Dashboard:
1. Go to your project settings
2. Environment Variables → Add:
   - `NEXT_PUBLIC_API_URL` = `https://lyzr-d-production.up.railway.app`
   - `NEXT_PUBLIC_WS_URL` = `wss://lyzr-d-production.up.railway.app`
3. Redeploy from Deployments tab

### 3. Clean Up Railway Services (Optional)
If you see extra services in Railway dashboard:
- Keep: **lyzr-d**, **Postgres**, **Redis**
- Delete: Any other services (worker, independent-achievement, etc.)

### 4. Verify Deployment (After Push)
Wait 2-3 minutes, then test:
```bash
# Backend health
curl https://lyzr-d-production.up.railway.app/health

# Frontend
open https://lyzr.anaya.legal
```

---

## ✅ System Architecture Summary

```
┌─────────────────────────────────────────────┐
│  Frontend (Vercel)                          │
│  https://lyzr.anaya.legal                   │
│  - Next.js application                      │
│  - Connects to Railway backend              │
└─────────────────┬───────────────────────────┘
                  │
                  │ HTTPS/WSS
                  ▼
┌─────────────────────────────────────────────┐
│  Backend (Railway - lyzr-d service)         │
│  https://lyzr-d-production.up.railway.app   │
│  - FastAPI application                      │
│  - Port 8000                                │
└─────┬───────────┬──────────────┬────────────┘
      │           │              │
      │           │              │
      ▼           ▼              ▼
┌─────────┐ ┌──────────┐  ┌─────────────────┐
│ Postgres│ │  Redis   │  │ Temporal Cloud  │
│(Railway)│ │(Railway) │  │  (External)     │
│ Auto    │ │  Auto    │  │  API Key Auth   │
│ Linked  │ │  Linked  │  │  ap-south-1     │
└─────────┘ └──────────┘  └─────────────────┘
```

---

## 🎯 Production Readiness Checklist

- ✅ Backend deployed and healthy
- ✅ Database connected (Railway Postgres)
- ✅ Redis connected (Railway Redis)
- ✅ Temporal Cloud connected (external)
- ✅ CORS configured for production domain
- ✅ Frontend URL configured for notifications
- ✅ No hardcoded localhost URLs
- ✅ Environment variables set in Railway
- ⚠️ Vercel env vars pending (manual setup)
- ✅ TLS enabled for Temporal
- ✅ Debug mode disabled in production

---

## 📞 Support Information

**Railway Dashboard**: https://railway.com/project/abd4ef15-1ea9-46ce-83dc-c6537daf817c
**Vercel Dashboard**: https://vercel.com/dashboard
**Temporal Cloud**: https://cloud.temporal.io

Ready for your presentation! 🎉
