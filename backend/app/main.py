import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from temporalio.client import Client
from contextlib import asynccontextmanager
import asyncio
from app.api import workflows, approvals, executions, node_types, events, metrics
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Lyzr Orchestrator API starting...")
    print(f"📡 Temporal: {settings.TEMPORAL_HOST}")
    print(f"📦 Redis: {settings.REDIS_URL}")

    from app.core.events import event_bus
    from app.api.events import push_to_websocket_clients

    # THIS IS THE FIX: Added 'await' to both subscribe calls
    await event_bus.subscribe("workflow.completed", update_execution_status_on_event)
    await event_bus.subscribe("workflow.failed", update_execution_status_on_event)

    websocket_events = ["workflow.started", "workflow.completed", "workflow.failed", "node.started", "node.completed", "node.failed", "approval.requested", "approval.granted", "approval.denied", "compensation.started", "compensation.completed", "compensation.failed"]
    for event_type in websocket_events:
        await event_bus.subscribe(event_type, push_to_websocket_clients)

    asyncio.create_task(event_bus.listen())

    print("✅ All routers and event listeners loaded")
    yield
    print("👋 Lyzr Orchestrator API shutting down...")

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG, lifespan=lifespan)

# CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflows.router, prefix="/api")
app.include_router(approvals.router, prefix="/api")
app.include_router(executions.router, prefix="/api")
app.include_router(node_types.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Lyzr Orchestrator API",
        "status": "running",
        "version": "2.0.0",
        "features": [
            "durable_workflows",
            "event_chronicle",
            "hitl_approvals",
            "eval_gates",
            "parallel_execution",
            "self_healing",
            "compensation",
            "websocket_events",
            "metrics_dashboard",
        ],
    }


@app.get("/health")
async def health():
    temporal_ok = False
    redis_ok = False

    try:
        await asyncio.wait_for(
            Client.connect(settings.TEMPORAL_HOST, namespace=settings.TEMPORAL_NAMESPACE),
            timeout=2
        )
        temporal_ok = True
    except:
        pass

    try:
        from app.core.events import event_bus
        event_bus.redis_client.ping()
        redis_ok = True
    except:
        pass

    return {
        "status": "healthy" if (temporal_ok and redis_ok) else "degraded",
        "temporal": "ok" if temporal_ok else "error",
        "redis": "ok" if redis_ok else "error",
    }

async def update_execution_status_on_event(event_data: dict):
    """Listen for workflow completion/failure events and update the DB."""
    from app.core.database import SessionLocal
    from app.models.workflow import Execution
    from datetime import datetime, timezone

    event_type = event_data.get("event_type")
    # FIX: The 'data' field is a JSON string and needs to be parsed
    data = json.loads(event_data.get("data", "{}"))
    execution_id = data.get("execution_id")

    if not execution_id or event_type not in ["workflow.completed", "workflow.failed"]:
        return

    db = SessionLocal()
    try:
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if execution:
            if event_type == "workflow.completed":
                execution.status = "completed"
                execution.output_data = data.get("result")
            else: # workflow.failed
                execution.status = "failed"
                execution.error = data.get("error")

            execution.completed_at = datetime.now(timezone.utc).isoformat()
            db.commit()
            print(f"✅ Updated execution {execution_id} status to {execution.status}")
    finally:
        db.close()