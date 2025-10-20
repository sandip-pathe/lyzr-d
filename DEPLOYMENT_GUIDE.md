# 🚀 Lyzr Orchestrator - Production Deployment Guide

## Architecture Overview

- **Temporal Cloud**: Workflow orchestration (6 months free, $945 credits)
- **Railway**: Backend API + Worker + PostgreSQL + Redis (~$5/month)
- **Vercel**: Next.js Frontend (Free tier)

---

## 📋 Prerequisites

1. **Temporal Cloud Account**: https://cloud.temporal.io/
2. **Railway Account**: https://railway.app/
3. **Vercel Account**: https://vercel.com/
4. **OpenAI API Key**: For AI agent functionality

---

## Part 1: Temporal Cloud Setup

### 1.1 Create Temporal Cloud Namespace
1. Sign up at https://cloud.temporal.io/
2. Create a new namespace (e.g., `lyzr-orchestrator`)
3. Note your namespace name: `<namespace>.tmprl.cloud:7233`

### 1.2 Generate Client Certificates
1. Go to your namespace settings
2. Generate a client certificate and key
3. Download both files:
   - `client.pem` (certificate)
   - `client-key.pem` (private key)
4. Keep these secure - you'll need them for Railway

---

## Part 2: Railway Deployment

### 2.1 Create Railway Project
1. Go to https://railway.app/new
2. Click "New Project" → "Empty Project"
3. Name it "lyzr-orchestrator"

### 2.2 Add PostgreSQL Database
1. Click "New" → "Database" → "PostgreSQL"
2. Railway will provision a database
3. Note the `DATABASE_URL` from the Variables tab

### 2.3 Add Redis
1. Click "New" → "Database" → "Redis"
2. Note the `REDIS_URL` from the Variables tab

### 2.4 Deploy Backend API Service
1. Click "New" → "GitHub Repo"
2. Select your repository
3. Set root directory: `backend`
4. Add environment variables:
   ```
   TEMPORAL_HOST=<your-namespace>.tmprl.cloud:7233
   TEMPORAL_NAMESPACE=<your-namespace>
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   OPENAI_API_KEY=<your-openai-key>
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```
5. Add TLS certificates as files:
   - Add `TEMPORAL_TLS_CERT` → paste content of `client.pem`
   - Add `TEMPORAL_TLS_KEY` → paste content of `client-key.pem`
6. Deploy!

### 2.5 Deploy Worker Service
1. Click "New" → "GitHub Repo" (same repo)
2. Set root directory: `backend`
3. Go to Settings → "Deploy"
4. Custom start command: `python -u -m app.temporal.worker`
5. Add same environment variables as Backend API
6. Deploy!

### Railway Services Summary
- ✅ PostgreSQL (auto-provisioned)
- ✅ Redis (auto-provisioned)
- ✅ Backend API (web service on port 8000)
- ✅ Worker (background service)

---

## Part 3: Vercel Deployment

### 3.1 Deploy Frontend
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set root directory: `frontend`
4. Framework Preset: Next.js
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
   NEXT_PUBLIC_WS_URL=wss://your-backend.up.railway.app
   ```
   (Get the Railway backend URL from your Railway dashboard)
6. Click "Deploy"

### 3.2 Configure Custom Domain (Optional)
1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update Railway `CORS_ORIGINS` with new domain

---

## 🔧 Configuration Details

### Environment Variables Checklist

#### Backend/Worker (Railway):
```bash
# Temporal Cloud
TEMPORAL_HOST=<namespace>.tmprl.cloud:7233
TEMPORAL_NAMESPACE=<namespace>
TEMPORAL_TLS_CERT=<path-to-cert-file>
TEMPORAL_TLS_KEY=<path-to-key-file>

# Database (auto-linked by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# APIs
OPENAI_API_KEY=sk-...
LYZR_API_KEY=optional

# CORS (use your Vercel URL)
CORS_ORIGINS=https://your-app.vercel.app

# Optional notifications
SLACK_WEBHOOK_URL=optional
RESEND_API_KEY=optional
FROM_EMAIL=optional
```

#### Frontend (Vercel):
```bash
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.up.railway.app
```

---

## 🧪 Testing Deployment

### 1. Test Backend Health
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

### 2. Test Frontend
Visit `https://your-app.vercel.app`

### 3. Create Test Workflow
1. Click "New Workflow"
2. Add: Trigger → Agent → End
3. Configure agent with system instructions
4. Save and Run
5. Check execution completes successfully

---

## 📊 Monitoring & Logs

### Railway Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

Or view in Railway dashboard → Service → Deployments → Logs

### Temporal Cloud Dashboard
- Visit https://cloud.temporal.io/
- Navigate to your namespace
- View workflow executions, metrics, and history

### Vercel Logs
- Vercel dashboard → your project → Logs
- View function logs and deployment history

---

## 💰 Cost Breakdown

### Temporal Cloud
- **Free Tier**: $945 credits (6 months)
- Covers ~200K workflow actions/month

### Railway
- **Starter Plan**: ~$5/month
  - PostgreSQL: Included
  - Redis: Included
  - 2 services (backend + worker): ~$2-3 each
- **Total**: $5-10/month depending on usage

### Vercel
- **Hobby Plan**: Free
  - 100GB bandwidth
  - Unlimited deployments
  - Custom domains

**Total Monthly Cost**: ~$5-10 (after Temporal credits expire: ~$20-30)

---

## 🔐 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files
- Use Railway/Vercel secret management
- Rotate API keys regularly

### 2. CORS Configuration
- Set `CORS_ORIGINS` to your exact Vercel domain
- Don't use `*` in production

### 3. Database
- Railway PostgreSQL is encrypted at rest
- Use connection pooling (built into SQLAlchemy)

### 4. Temporal Cloud
- Keep TLS certificates secure
- Use separate namespaces for dev/prod
- Enable audit logging

---

## 🚨 Troubleshooting

### Backend won't connect to Temporal Cloud
**Symptoms**: Worker shows connection errors

**Solutions**:
1. Verify `TEMPORAL_HOST` format: `namespace.tmprl.cloud:7233`
2. Check TLS certificates are correctly uploaded
3. Ensure namespace exists in Temporal Cloud
4. Check Railway logs for detailed errors

### Frontend can't reach backend
**Symptoms**: API calls fail, CORS errors

**Solutions**:
1. Verify `NEXT_PUBLIC_API_URL` in Vercel
2. Check `CORS_ORIGINS` includes Vercel URL in Railway
3. Ensure Railway backend service is running
4. Test backend health endpoint directly

### Workflows not executing
**Symptoms**: Workflows stuck in "running" state

**Solutions**:
1. Check worker service is running in Railway
2. Verify worker logs for errors
3. Check Temporal Cloud dashboard for task queue status
4. Ensure worker and backend use same namespace

### Database connection issues
**Symptoms**: API returns 500 errors

**Solutions**:
1. Check `DATABASE_URL` is correctly set
2. Verify PostgreSQL service is healthy in Railway
3. Run database migrations if needed
4. Check connection pool settings

---

## 🔄 Updates & CI/CD

### Automatic Deployments

**Railway**:
- Automatically deploys on push to `main` branch
- Configure in Settings → "Deploy Triggers"

**Vercel**:
- Automatically deploys on push to `main` branch
- Preview deployments for PRs
- Configure in Settings → Git

### Manual Deployment

**Railway**:
```bash
railway up
```

**Vercel**:
```bash
cd frontend
vercel --prod
```

---

## 📈 Scaling

### When to scale:
- **Users**: 100+ concurrent workflows
- **Cost**: Railway charges exceed $20/month
- **Performance**: Response times > 2 seconds

### Scaling options:
1. **Railway**: Upgrade to Pro plan ($20/month base)
2. **Temporal Cloud**: Scale automatically with credits
3. **Vercel**: Upgrade to Pro ($20/month) for more bandwidth
4. **Database**: Add read replicas on Railway

---

## ✅ Deployment Checklist

- [ ] Temporal Cloud namespace created
- [ ] TLS certificates generated and saved
- [ ] Railway project created
- [ ] PostgreSQL database provisioned
- [ ] Redis instance provisioned
- [ ] Backend service deployed
- [ ] Worker service deployed
- [ ] Environment variables configured
- [ ] Backend health check passes
- [ ] Vercel project created
- [ ] Frontend deployed
- [ ] Frontend can reach backend
- [ ] Test workflow created and executed
- [ ] Temporal Cloud shows workflow execution
- [ ] Custom domains configured (optional)
- [ ] Monitoring setup (optional)

---

## 🎯 Next Steps

1. **Add monitoring**: Set up Sentry or LogRocket
2. **Enable analytics**: Track workflow metrics
3. **Custom branding**: Update UI colors and logos
4. **Documentation**: Create user guides
5. **Testing**: Add E2E tests
6. **Security**: Enable rate limiting
7. **Backup**: Configure database backups

---

## 📞 Support

- **Temporal Cloud**: https://docs.temporal.io/cloud/
- **Railway**: https://docs.railway.app/
- **Vercel**: https://vercel.com/docs

**Your production deployment is ready! 🚀**
