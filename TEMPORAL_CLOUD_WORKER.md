# 🚀 Temporal Cloud Worker Deployment Guide

## Overview

This guide explains how to deploy the Temporal worker to **Temporal Cloud** (not Railway), so you can use Temporal Cloud's free compute credits.

---

## Architecture

```
┌─────────────────────────────────────────┐
│         RAILWAY ($5/mo)                 │
│                                         │
│  ┌──────────────┐                       │
│  │   Backend    │ ← Only API service   │
│  │   (FastAPI)  │                       │
│  └──────────────┘                       │
│         ↓                                │
│  ┌──────────────┐   ┌───────────────┐  │
│  │  PostgreSQL  │   │     Redis     │  │
│  └──────────────┘   └───────────────┘  │
└─────────────────────────────────────────┘
                    ↕
        ┌───────────────────────────────┐
        │   TEMPORAL CLOUD (Free 6mo)   │
        │                               │
        │  ┌─────────────────────────┐  │
        │  │  Worker (Deployed Here) │  │
        │  │  Runs Workflows         │  │
        │  └─────────────────────────┘  │
        └───────────────────────────────┘
                    ↑
        ┌───────────────────────┐
        │   VERCEL (Free)       │
        │   Frontend            │
        └───────────────────────┘
```

---

## Prerequisites

1. ✅ Temporal Cloud account with namespace created
2. ✅ TLS certificates downloaded (client.pem, client-key.pem)
3. ✅ Railway backend deployed and running
4. ✅ Python 3.11+ installed locally

---

## Step 1: Package Worker Code

Temporal Cloud requires your workflow and activity code to be packaged.

### 1.1 Create Worker Package Structure

```bash
cd backend
mkdir -p temporal_worker_package

# Copy necessary files
cp -r app/temporal temporal_worker_package/
cp -r app/services temporal_worker_package/
cp -r app/schemas temporal_worker_package/
cp -r app/models temporal_worker_package/
cp -r app/core temporal_worker_package/
cp requirements.txt temporal_worker_package/
```

### 1.2 Create Worker Entry Point

Create `temporal_worker_package/worker_main.py`:

```python
import asyncio
from temporalio.client import Client
from temporalio.service import TLSConfig
from temporalio.worker import Worker
from app.temporal.workflows import OrchestrationWorkflow
from app.temporal.activities import (
    compensate_node,
    execute_agent_node,
    execute_api_call_node,
    execute_eval_node,
    execute_event_node,
    execute_merge_node,
    execute_meta_node,
    execute_timer_node,
    get_fallback_agent,
    publish_generic_event,
    publish_workflow_status,
    request_ui_approval,
    send_approval_request
)

async def main():
    print("🔨 Starting Temporal Cloud Worker...")
    
    # Load TLS certificates
    with open('client.pem', 'rb') as f:
        client_cert = f.read()
    with open('client-key.pem', 'rb') as f:
        client_key = f.read()
    
    tls_config = TLSConfig(
        client_cert=client_cert,
        client_private_key=client_key,
    )
    
    # Connect to Temporal Cloud
    client = await Client.connect(
        "your-namespace.tmprl.cloud:7233",
        namespace="your-namespace",
        tls=tls_config
    )
    
    print("✅ Connected to Temporal Cloud!")
    
    # Register activities
    activities_list = [
        compensate_node,
        execute_agent_node,
        execute_api_call_node,
        execute_eval_node,
        execute_event_node,
        execute_merge_node,
        execute_meta_node,
        execute_timer_node,
        get_fallback_agent,
        publish_generic_event,
        publish_workflow_status,
        request_ui_approval,
        send_approval_request
    ]
    
    # Create worker
    worker = Worker(
        client,
        task_queue="orchestration-queue",
        workflows=[OrchestrationWorkflow],
        activities=activities_list
    )
    
    print("🚀 Worker is now polling for tasks...")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Step 2: Deploy to Temporal Cloud

### Option A: Using Temporal Cloud UI (Recommended)

1. Go to https://cloud.temporal.io/
2. Navigate to your namespace
3. Click **"Workers"** → **"Deploy Worker"**
4. Upload your `temporal_worker_package` folder
5. Set environment variables:
   ```
   DATABASE_URL=<your-railway-postgres-url>
   REDIS_URL=<your-railway-redis-url>
   OPENAI_API_KEY=<your-openai-key>
   ```
6. Click **"Deploy"**

### Option B: Using Temporal CLI

```bash
# Install Temporal CLI
brew install temporal

# Or on Linux
curl -sSf https://temporal.download/cli.sh | sh

# Deploy worker
temporal workflow deploy \
  --namespace your-namespace \
  --task-queue orchestration-queue \
  --worker-path ./temporal_worker_package
```

---

## Step 3: Configure Backend to NOT Run Worker

Since the worker is now on Temporal Cloud, we need to ensure Railway backend doesn't try to run it.

### Remove Worker from Backend

The backend should only run the FastAPI API server, not the worker.

**This is already configured in the root `Procfile` and `railway.json`:**
- They only start the FastAPI server
- Worker is NOT started on Railway

---

## Step 4: Test the Setup

### 4.1 Verify Worker is Running

1. Go to Temporal Cloud dashboard
2. Navigate to **"Workers"**
3. You should see:
   - ✅ Status: Running
   - ✅ Task Queue: orchestration-queue
   - ✅ Last heartbeat: Recent

### 4.2 Test Workflow Execution

1. Open your Vercel frontend
2. Create a test workflow (Trigger → Agent → End)
3. Run the workflow
4. Check Temporal Cloud dashboard to see execution

---

## Alternative: Keep Worker on Railway (Simpler)

If deploying to Temporal Cloud is too complex for your presentation, you can keep the worker on Railway:

### Deploy Worker Service on Railway

1. Create a new service in Railway
2. Connect same GitHub repo
3. Set **Root Directory**: Leave empty (use root)
4. Set **Start Command**: `cd backend && python -u -m app.temporal.worker`
5. Add all environment variables (same as backend + TLS certs)
6. Deploy

**This approach:**
- ✅ Simpler to deploy
- ✅ All services in one place
- ❌ Costs $10-15/month more
- ❌ Doesn't use Temporal Cloud compute credits

---

## Recommended Approach

**For your presentation RIGHT NOW:**
1. ✅ Deploy worker on Railway (simpler, faster)
2. ✅ Follow the existing deployment guide
3. ✅ Get it working first

**After presentation:**
1. 🔄 Migrate worker to Temporal Cloud
2. 🔄 Reduce Railway costs
3. 🔄 Utilize free Temporal Cloud credits

---

## Cost Comparison

### Worker on Railway (Current)
- Railway: $10-20/month (backend + worker + DB + Redis)
- Temporal Cloud: Free (just orchestration)
- **Total: $10-20/month**

### Worker on Temporal Cloud (Optimal)
- Railway: $5/month (backend + DB + Redis)
- Temporal Cloud: Free (compute included)
- **Total: $5/month**

---

## Next Steps

1. For now: Deploy worker to Railway using existing guide
2. After presentation: Use this guide to migrate to Temporal Cloud
3. Enjoy $10-15/month savings! 💰

---

## Support

- **Temporal Cloud Docs**: https://docs.temporal.io/cloud/
- **Worker Deployment**: https://docs.temporal.io/dev-guide/worker-deployment
- **Python SDK**: https://docs.temporal.io/dev-guide/python/
