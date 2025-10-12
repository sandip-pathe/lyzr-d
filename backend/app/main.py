import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import workflows, approvals
from app.core.config import settings
from temporalio.client import Client

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(workflows.router)
app.include_router(approvals.router)

# Root endpoint - simple alive signal
@app.get("/")
async def root():
    return {"message": "Lyzr Orchestrator API", "status": "running", "signal": "alive"}

# Health endpoint - check Temporal (with timeout) and Redis
@app.get("/health")
async def health():
    temporal_ok = False
    try:
        # Connect to Temporal with a short timeout to avoid hanging
        await asyncio.wait_for(
            Client.connect(settings.TEMPORAL_HOST, namespace=settings.TEMPORAL_NAMESPACE),
            timeout=2,  # seconds
        )
        temporal_ok = True
    except Exception:
        temporal_ok = False

    redis_ok = True
    try:
        import redis.asyncio as redis
        r = redis.from_url(settings.REDIS_URL)
        await r.ping()
    except Exception:
        redis_ok = False

    status = "healthy" if temporal_ok and redis_ok else "degraded"

    return {
        "status": status,
        "temporal": "reachable" if temporal_ok else "unreachable",
        "redis": "reachable" if redis_ok else "unreachable",
        "signal": "alive",
    }
