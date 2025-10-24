from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from temporalio.client import Client
from app.core.database import get_db
from app.core.config import settings
from app.models.workflow import Execution
from app.temporal.workflows import OrchestrationWorkflow
from app.services.narration import NarrationService

router = APIRouter(prefix="/executions", tags=["executions"])


def serialize_execution(execution: Execution) -> Dict[str, Any]:
    """Serialize Execution ORM object into a clean dictionary for API responses."""
    return {
        "id": execution.id,
        "workflow_id": execution.workflow_id,
        "status": execution.status,
        "input_data": execution.input_data,
        "output_data": execution.output_data,
        "current_node": execution.current_node,
        "error": execution.error,
        "started_at": execution.started_at,
        "completed_at": execution.completed_at,
    }


@router.get("/{execution_id}")
async def get_execution(execution_id: str, db: Session = Depends(get_db)):
    """Fetch a specific execution from DB and optionally augment with live Temporal state."""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    # Always start with DB-backed data
    data = {
        "id": execution.id,
        "workflow_id": execution.workflow_id,
        "status": execution.status,
        "input_data": execution.input_data,
        "output_data": execution.output_data,
        "current_node": execution.current_node,
        "error": execution.error,
        "started_at": execution.started_at,
        "completed_at": execution.completed_at,
    }

    # Try to augment with live Temporal state, if available
    try:
        if settings.TEMPORAL_API_KEY:
            client = await Client.connect(
                settings.TEMPORAL_HOST,
                namespace=settings.TEMPORAL_NAMESPACE,
                api_key=settings.TEMPORAL_API_KEY,
                tls=True
            )
        else:
            client = await Client.connect(
                settings.TEMPORAL_HOST,
                namespace=settings.TEMPORAL_NAMESPACE,
            )
        handle = client.get_workflow_handle(execution_id)
        state = await handle.query(OrchestrationWorkflow.get_state)
        data["current_state"] = state
    except Exception:
        # If Temporal is unavailable or workflow closed, skip state enrichment
        pass

    return data


@router.get("/")
async def list_executions(
    workflow_id: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List recent executions, optionally filtered by workflow_id."""
    q = db.query(Execution)
    if workflow_id:
        q = q.filter(Execution.workflow_id == workflow_id)

    q = q.order_by(Execution.started_at.desc()).limit(limit)
    items = [serialize_execution(e) for e in q.all()]
    return {"items": items, "count": len(items)}


@router.post("/{execution_id}/cancel")
async def cancel_execution(execution_id: str, db: Session = Depends(get_db)):
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if settings.TEMPORAL_API_KEY:
        client = await Client.connect(
            settings.TEMPORAL_HOST,
            namespace=settings.TEMPORAL_NAMESPACE,
            api_key=settings.TEMPORAL_API_KEY,
            tls=True
        )
    else:
        client = await Client.connect(
            settings.TEMPORAL_HOST,
            namespace=settings.TEMPORAL_NAMESPACE,
        )
    
    handle = client.get_workflow_handle(execution_id)
    await handle.cancel()
    execution.status = "canceled"
    db.commit()
    return {"status": "cancel_requested"}


@router.get("/{execution_id}/narrate")
async def get_execution_narration(execution_id: str, db: Session = Depends(get_db)):
    """Generate a human-readable narration of the execution."""
    # You'll need to get the workflow_id from the execution
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    narration_service = NarrationService()
    report = narration_service.generate_narration(execution.workflow_id, execution_id)
    return {"narration": report}