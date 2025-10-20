# 🎯 Quick Reference - Environment Variables

This is your **copy-paste ready** guide for deployment. Use this alongside DEPLOYMENT_CHECKLIST.md.

---

## 🚂 Railway - Backend Service

**Service Name**: `backend` (or `lyzr-backend`)  
**Root Directory**: `backend`  
**Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Environment Variables to Set:

```bash
# ============================================
# DATABASE (Auto-linked from Railway Postgres)
# ============================================
DATABASE_URL=${{Postgres.DATABASE_URL}}

# ============================================
# REDIS (Auto-linked from Railway Redis)
# ============================================
REDIS_URL=${{Redis.REDIS_URL}}

# ============================================
# TEMPORAL CLOUD
# ============================================
# Format: namespace.tmprl.cloud:7233
TEMPORAL_HOST=your-namespace.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace

# TLS Certificates (Base64 encoded - see instructions below)
TEMPORAL_TLS_CERT_BASE64=<paste content of client.pem.b64>
TEMPORAL_TLS_KEY_BASE64=<paste content of client-key.pem.b64>

# ============================================
# AI/LLM APIS
# ============================================
OPENAI_API_KEY=sk-proj-...

# Optional: Lyzr SDK
LYZR_API_KEY=lyzr_...

# ============================================
# CORS (Update after Vercel deployment)
# ============================================
CORS_ORIGINS=["https://your-app.vercel.app"]

# ============================================
# APP CONFIGURATION
# ============================================
APP_NAME=Lyzr Orchestrator
DEBUG=False
API_PORT=8000

# ============================================
# OPTIONAL: Notifications
# ============================================
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
RESEND_API_KEY=re_...
FROM_EMAIL=notifications@yourdomain.com
```

---

## 🚂 Railway - Worker Service

**Service Name**: `worker`  
**Root Directory**: `backend`  
**Start Command**: `python -u -m app.temporal.worker`

### Environment Variables to Set:

```bash
# ============================================
# COPY ALL VARIABLES FROM BACKEND SERVICE
# ============================================
# (Same as above - use Railway's reference syntax)

DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
TEMPORAL_HOST=your-namespace.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace
TEMPORAL_TLS_CERT_BASE64=<paste content of client.pem.b64>
TEMPORAL_TLS_KEY_BASE64=<paste content of client-key.pem.b64>
OPENAI_API_KEY=sk-proj-...
```

**Note**: Worker doesn't need CORS_ORIGINS, but it's fine to include it.

---

## 🎨 Vercel - Frontend

**Framework**: Next.js  
**Root Directory**: `frontend`  
**Build Command**: `pnpm build` (auto-detected)  
**Output Directory**: `.next` (auto-detected)

### Environment Variables to Set:

```bash
# ============================================
# BACKEND API URL
# ============================================
# Get this from Railway Backend service > Settings > Networking > Generate Domain
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app

# ============================================
# WEBSOCKET URL
# ============================================
# Same as API URL but with wss:// instead of https://
NEXT_PUBLIC_WS_URL=wss://your-backend.up.railway.app
```

**Example**:
```bash
NEXT_PUBLIC_API_URL=https://lyzr-backend-production.up.railway.app
NEXT_PUBLIC_WS_URL=wss://lyzr-backend-production.up.railway.app
```

---

## 🔐 How to Base64 Encode TLS Certificates

You need to convert your Temporal Cloud certificates to base64 for Railway.

### On Linux/Mac:
```bash
# Navigate to where you saved the certificates
cd ~/Downloads

# Encode certificate (single line, no wrapping)
base64 -w 0 client.pem > client.pem.b64

# Encode private key (single line, no wrapping)
base64 -w 0 client-key.pem > client-key.pem.b64

# View the encoded content (copy this entire output)
cat client.pem.b64
cat client-key.pem.b64
```

### On Windows (PowerShell):
```powershell
# Navigate to where you saved the certificates
cd C:\Users\YourName\Downloads

# Encode certificate
[Convert]::ToBase64String([IO.File]::ReadAllBytes("client.pem")) | Out-File -NoNewline client.pem.b64

# Encode private key
[Convert]::ToBase64String([IO.File]::ReadAllBytes("client-key.pem")) | Out-File -NoNewline client-key.pem.b64

# View the encoded content (copy this entire output)
Get-Content client.pem.b64
Get-Content client-key.pem.b64
```

### On Windows (Git Bash):
```bash
# Navigate to where you saved the certificates
cd /c/Users/YourName/Downloads

# Encode certificate
base64 -w 0 client.pem > client.pem.b64

# Encode private key
base64 -w 0 client-key.pem > client-key.pem.b64

# View the encoded content
cat client.pem.b64
cat client-key.pem.b64
```

**Important**: Copy the **entire output** (it will be one very long line). Paste this into Railway's `TEMPORAL_TLS_CERT_BASE64` and `TEMPORAL_TLS_KEY_BASE64` variables.

---

## 📝 Deployment Order

Follow this sequence:

1. **Temporal Cloud** → Get namespace and certificates
2. **Base64 Encode** → Convert certificates to base64
3. **Railway Postgres** → Provision database
4. **Railway Redis** → Provision Redis
5. **Railway Backend** → Deploy with all env vars
6. **Railway Worker** → Deploy with same env vars
7. **Test Backend** → `curl https://backend-url/health`
8. **Vercel Frontend** → Deploy with backend URL
9. **Update CORS** → Add Vercel URL to backend's `CORS_ORIGINS`
10. **Test E2E** → Create and run a workflow

---

## ✅ Variable Validation Checklist

### Before Deploying Backend/Worker:
- [ ] `DATABASE_URL` is linked to Railway Postgres
- [ ] `REDIS_URL` is linked to Railway Redis
- [ ] `TEMPORAL_HOST` ends with `.tmprl.cloud:7233`
- [ ] `TEMPORAL_NAMESPACE` matches your Temporal Cloud namespace
- [ ] `TEMPORAL_TLS_CERT_BASE64` is a very long single line (base64)
- [ ] `TEMPORAL_TLS_KEY_BASE64` is a very long single line (base64)
- [ ] `OPENAI_API_KEY` starts with `sk-`
- [ ] `CORS_ORIGINS` is a JSON array format: `["https://..."]`

### Before Deploying Frontend:
- [ ] `NEXT_PUBLIC_API_URL` starts with `https://`
- [ ] `NEXT_PUBLIC_WS_URL` starts with `wss://`
- [ ] Both URLs point to your Railway backend domain

### After Frontend Deployment:
- [ ] Backend's `CORS_ORIGINS` updated with Vercel URL
- [ ] Backend redeployed automatically

---

## 🔍 Common Mistakes

### ❌ WRONG:
```bash
# Missing port in Temporal host
TEMPORAL_HOST=namespace.tmprl.cloud

# Wrong protocol for WebSocket
NEXT_PUBLIC_WS_URL=https://backend.up.railway.app

# Not base64 encoded (file path instead)
TEMPORAL_TLS_CERT_BASE64=/path/to/client.pem

# CORS as string instead of JSON array
CORS_ORIGINS=https://app.vercel.app
```

### ✅ CORRECT:
```bash
# Includes :7233 port
TEMPORAL_HOST=namespace.tmprl.cloud:7233

# Uses wss:// for WebSocket
NEXT_PUBLIC_WS_URL=wss://backend.up.railway.app

# Base64 encoded content (very long string)
TEMPORAL_TLS_CERT_BASE64=LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...

# JSON array format with quotes
CORS_ORIGINS=["https://app.vercel.app"]
```

---

## 🆘 Troubleshooting by Error

### "Worker failed to connect to Temporal"
**Check**:
- `TEMPORAL_HOST` includes `:7233` port
- `TEMPORAL_NAMESPACE` matches exactly
- Certificates are base64 encoded (no line breaks)

### "CORS policy blocked"
**Check**:
- `CORS_ORIGINS` in Railway backend includes your Vercel URL
- Format is JSON array: `["https://..."]`
- Backend has been redeployed after changing CORS

### "Database connection failed"
**Check**:
- `DATABASE_URL` references: `${{Postgres.DATABASE_URL}}`
- PostgreSQL service is running in Railway

### "Cannot connect to Redis"
**Check**:
- `REDIS_URL` references: `${{Redis.REDIS_URL}}`
- Redis service is running in Railway

### "Frontend can't reach backend"
**Check**:
- `NEXT_PUBLIC_API_URL` matches your Railway backend domain
- Railway backend service is running and public
- Backend health check works: `curl https://backend-url/health`

---

## 📞 Need Help?

1. Check Railway logs: Railway Dashboard → Service → Deployments → View Logs
2. Check Vercel logs: Vercel Dashboard → Project → Deployments → View Function Logs
3. Check Temporal Cloud: Temporal Dashboard → Namespace → Workflows
4. See DEPLOYMENT_CHECKLIST.md for detailed troubleshooting

**You've got this! 🚀**
