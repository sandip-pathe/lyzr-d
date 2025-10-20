# 🎯 UPDATED: Temporal Cloud API Key Setup (2024/2025)

## ✅ Modern Approach: API Keys (Recommended)

**Temporal Cloud now recommends API Keys over mTLS certificates** because they're:
- ✅ Easier to generate
- ✅ Easier to rotate
- ✅ No certificate management needed
- ✅ Perfect for Railway deployment

---

## 🔑 Step 1: Generate API Key in Temporal Cloud

### 1.1 Create Your Namespace

1. Go to https://cloud.temporal.io/
2. Sign up / Log in
3. Click **"Create Namespace"**
4. Choose a name (e.g., `lyzr-orchestrator`)
5. **Important**: Select **"API Key Authentication"** (not mTLS)
6. Choose your region (e.g., `us-west-2`)
7. Click **"Create"**

### 1.2 Generate API Key

1. In Temporal Cloud UI, go to **Settings** → **API Keys** (or **Profile** → **API Keys**)
2. Click **"Create API Key"**
3. Fill in:
   - **Name**: `railway-worker` (or any descriptive name)
   - **Description**: "Worker for Railway deployment"
   - **Expiration**: 90 days (or longer)
4. Click **"Generate API Key"**
5. **CRITICAL**: Copy the API key secret immediately! ⚠️
   - It's only shown once
   - Looks like: `tcsk-1a2b3c4d5e6f...`
6. Save it securely (you'll paste it into Railway)

### 1.3 Note Your Connection Details

From your Temporal Cloud namespace page, copy:

```bash
# Namespace (format: namespace.account-id)
TEMPORAL_NAMESPACE=lyzr-orchestrator.a1b2c

# gRPC Endpoint (format: region.provider.api.temporal.io:7233)
TEMPORAL_HOST=us-west-2.aws.api.temporal.io:7233

# API Key Secret (from step 1.2)
TEMPORAL_API_KEY=tcsk-1a2b3c4d5e6f...
```

**Note**: The gRPC endpoint for API key authentication uses the **regional endpoint** format, NOT the namespace endpoint.

---

## 🚂 Step 2: Configure Railway with API Key

### Environment Variables for Backend/Worker:

```bash
# ==================================
# TEMPORAL CLOUD (API Key Method)
# ==================================

# Regional gRPC endpoint (API key authentication)
TEMPORAL_HOST=us-west-2.aws.api.temporal.io:7233

# Namespace (format: namespace.account-id)
TEMPORAL_NAMESPACE=lyzr-orchestrator.a1b2c

# API Key (generated in Temporal Cloud)
TEMPORAL_API_KEY=tcsk-1a2b3c4d5e6f7g8h9i0j...

# ==================================
# OTHER VARIABLES
# ==================================
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
OPENAI_API_KEY=sk-proj-...
CORS_ORIGINS=["https://your-app.vercel.app"]
```

---

## 🔍 Regional Endpoints by Cloud Provider

### AWS Regions:
```
us-west-2.aws.api.temporal.io:7233    # Oregon
us-east-1.aws.api.temporal.io:7233    # Virginia
ap-south-1.aws.api.temporal.io:7233   # Mumbai
ap-southeast-2.aws.api.temporal.io:7233 # Sydney
eu-west-1.aws.api.temporal.io:7233    # Ireland
```

### GCP Regions:
```
us-west1.gcp.api.temporal.io:7233     # Oregon
us-east1.gcp.api.temporal.io:7233     # South Carolina
europe-west1.gcp.api.temporal.io:7233 # Belgium
```

### Azure Regions:
```
westus2.azure.api.temporal.io:7233    # Washington
eastus.azure.api.temporal.io:7233     # Virginia
```

**Use the region closest to your Railway deployment for best performance.**

---

## ✅ Verification

### Test Connection Locally (Optional)

Before deploying to Railway, test locally:

```bash
# Set environment variables
export TEMPORAL_HOST=us-west-2.aws.api.temporal.io:7233
export TEMPORAL_NAMESPACE=lyzr-orchestrator.a1b2c
export TEMPORAL_API_KEY=tcsk-...

# Run worker
cd backend
python -m app.temporal.worker
```

Expected output:
```
🔨 Starting Temporal Worker...
📡 Connecting to: us-west-2.aws.api.temporal.io:7233
🔧 Namespace: lyzr-orchestrator.a1b2c
🔑 Using API Key authentication for Temporal Cloud
✅ Connected to Temporal!
🚀 Worker is now polling for tasks...
```

---

## 🔄 API Key Rotation

### When to Rotate:
- Every 90 days (or your chosen expiration)
- If compromised
- When team members leave

### How to Rotate:
1. Create new API key in Temporal Cloud
2. Update Railway environment variable with new key
3. Railway auto-redeploys with new key
4. Delete old API key in Temporal Cloud

**No downtime** if you update before the old key expires!

---

## ❓ FAQ

### Q: Can I use mTLS certificates instead?
**A**: Yes, but API keys are recommended for simpler management. If you need mTLS, select that option during namespace creation and generate certificates using `tcld`.

### Q: Is API key authentication secure?
**A**: Yes! API keys use industry-standard authentication. Keep them secret (don't commit to Git) and rotate regularly.

### Q: What if I lose my API key?
**A**: Generate a new one. The full key secret is only shown once during creation for security.

### Q: Can I use the same API key for multiple workers?
**A**: Yes, but consider creating separate keys for different environments (dev, staging, prod) for better security and audit trails.

### Q: Where can I see API key usage?
**A**: Temporal Cloud dashboard shows API key usage under Settings → API Keys. You can also check Worker connection logs.

---

## 📊 Comparison: API Keys vs mTLS

| Feature | API Key | mTLS Certificates |
|---------|---------|-------------------|
| **Setup Time** | 2 minutes | 15 minutes |
| **Complexity** | Very Simple | Complex |
| **Rotation** | Easy (1 click) | Complex (generate, upload, redeploy) |
| **Expiration** | Configurable | Must manage expiry |
| **Railway Deployment** | Perfect (just paste) | Needs file handling |
| **Security** | Excellent | Excellent |
| **Temporal Recommendation** | ✅ **Recommended** | Legacy |

---

## ✅ You're Ready!

With API keys, your Temporal Cloud deployment is:
- ✅ **Simple**: No certificate management
- ✅ **Secure**: Industry-standard authentication
- ✅ **Railway-friendly**: Just environment variables
- ✅ **Easy to rotate**: Generate new key anytime
- ✅ **Production-ready**: Temporal's recommended approach

**Now deploy to Railway using the updated `DEPLOY_NOW.md` guide!** 🚀
