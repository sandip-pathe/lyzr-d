import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from temporalio.client import Client
from contextlib import asynccontextmanager
import asyncio
import re
from app.api import workflows, approvals, executions, node_types, events, metrics
from app.core.config import settings


class CustomCORSMiddleware(BaseHTTPMiddleware):
    """Custom CORS middleware - allows all origins"""
    
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        
        # Handle preflight
        if request.method == "OPTIONS":
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "3600",
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add CORS headers to response
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "*"
        
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Lyzr Orchestrator API starting...")
    print(f"📡 Temporal: {settings.TEMPORAL_HOST}")
    print(f"📦 Redis: {settings.REDIS_URL}")
    
    # Initialize database with health check
    print("🗄️  Checking database...")
    try:
        from app.core.database import engine, Base
        from sqlalchemy import text, inspect
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
        
        # Check and create tables
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        # Check if workflows table has the new columns
        needs_migration = False
        if 'workflows' in existing_tables:
            columns = [col['name'] for col in inspector.get_columns('workflows')]
            if 'session_id' not in columns or 'is_template' not in columns:
                print("⚠️  Database schema outdated - new columns needed")
                needs_migration = True
                # In production (DEBUG=False), require manual migration
                if not settings.DEBUG:
                    print("❌ Production mode: Manual migration required")
                    print("   Run: ALTER TABLE workflows ADD COLUMN session_id VARCHAR;")
                    print("   Run: ALTER TABLE workflows ADD COLUMN is_template BOOLEAN DEFAULT FALSE;")
                    raise RuntimeError("Database schema mismatch. Manual migration required.")
                else:
                    print("🔧 Development mode: Auto-migrating...")
                    Base.metadata.drop_all(bind=engine)
        
        if not existing_tables or needs_migration:
            print("🔨 Creating database tables...")
            Base.metadata.create_all(bind=engine)
            print("✅ Database tables created")
        else:
            print(f"✅ Database ready ({len(existing_tables)} tables)")
            # Ensure all tables exist (safe operation)
            Base.metadata.create_all(bind=engine)
        
        # Initialize workflow templates
        print("📝 Loading workflow templates...")
        from app.services.templates import get_workflow_templates
        from app.core.database import SessionLocal
        from app.models.workflow import Workflow
        from datetime import datetime
        
        db = SessionLocal()
        try:
            templates = get_workflow_templates()
            templates_added = 0
            for template_data in templates:
                # Check if template already exists
                existing = db.query(Workflow).filter(Workflow.id == template_data["id"]).first()
                if not existing:
                    template = Workflow(
                        id=template_data["id"],
                        name=template_data["name"],
                        description=template_data["description"],
                        definition=template_data["definition"],
                        is_template="true",  # Mark as template
                        session_id=None,  # Templates don't belong to sessions
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(template)
                    templates_added += 1
            
            if templates_added > 0:
                db.commit()
                print(f"✅ Added {templates_added} workflow templates")
            else:
                print(f"✅ All {len(templates)} templates already loaded")
        except Exception as e:
            db.rollback()
            print(f"⚠️  Template loading error: {e}")
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise

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

# Add custom CORS middleware - allows all origins
app.add_middleware(CustomCORSMiddleware)

# Also add standard CORS for backwards compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

print(f"🌐 CORS enabled for ALL origins (*)")

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
    """Health check endpoint with database, temporal, and redis checks"""
    from sqlalchemy import text
    
    db_ok = False
    temporal_ok = False
    redis_ok = False

    # Check database
    try:
        from app.core.database import engine
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        print(f"⚠️  Database health check failed: {e}")

    # Check Temporal
    try:
        if settings.TEMPORAL_API_KEY:
            await asyncio.wait_for(
                Client.connect(
                    settings.TEMPORAL_HOST,
                    namespace=settings.TEMPORAL_NAMESPACE,
                    api_key=settings.TEMPORAL_API_KEY,
                    tls=True
                ),
                timeout=5
            )
        else:
            await asyncio.wait_for(
                Client.connect(
                    settings.TEMPORAL_HOST,
                    namespace=settings.TEMPORAL_NAMESPACE
                ),
                timeout=5
            )
        temporal_ok = True
    except Exception as e:
        print(f"⚠️  Temporal health check failed: {e}")

    # Check Redis
    try:
        from app.core.events import event_bus
        event_bus.redis_client.ping()
        redis_ok = True
    except Exception as e:
        print(f"⚠️  Redis health check failed: {e}")

    all_healthy = db_ok and temporal_ok and redis_ok

    return {
        "status": "healthy" if all_healthy else "degraded",
        "database": "ok" if db_ok else "error",
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