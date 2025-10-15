"""Workflow API endpoints - enhanced with pause/resume/reset"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session
from temporalio.client import Client, WorkflowHandle
from uuid import uuid4
from app.core.database import get_db
from app.core.config import settings
from app.models.workflow import Workflow, Execution
from app.schemas.workflow import WorkflowCreateSchema, WorkflowExecuteSchema, WorkflowUpdateSchema
from app.temporal.workflows import OrchestrationWorkflow

router = APIRouter(prefix="/workflows", tags=["workflows"])

async def get_temporal_client() -> Client:
    """Get Temporal client"""
    return await Client.connect(settings.TEMPORAL_HOST, namespace=settings.TEMPORAL_NAMESPACE)

# --- [NEW ENDPOINT] ---
@router.get("/")
async def list_workflows(db: Session = Depends(get_db)):
    """List all available workflow definitions"""
    workflows = db.query(Workflow).order_by(desc(Workflow.updated_at)).all()
    return {"items": workflows}

@router.post("/")
async def create_workflow(
    workflow: WorkflowCreateSchema,
    db: Session = Depends(get_db)
):
    """Create new workflow definition"""
    workflow_id = str(uuid4())
    db_workflow = Workflow(
        id=workflow_id,
        name=workflow.name,
        description=workflow.description,
        definition={
            "nodes": [n.dict() for n in workflow.nodes],
            "edges": [e.dict() for e in workflow.edges]
        }
    )
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)
    
    return {"id": workflow_id, "status": "created"}

@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """Get workflow definition"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(404, "Workflow not found")
    
    return {
        "id": workflow.id,
        "name": workflow.name,
        "description": workflow.description,
        "definition": workflow.definition,
        "created_at": workflow.created_at
    }

@router.post("/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: str,
    execute_request: WorkflowExecuteSchema,
    db: Session = Depends(get_db)
):
    """Start workflow execution"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(404, "Workflow not found")
    
    execution_id = str(uuid4())
    
    # Create execution record
    execution = Execution(
        id=execution_id,
        workflow_id=workflow_id,
        status="running",
        input_data=execute_request.input_data
    )
    db.add(execution)
    db.commit()
    
    # Start Temporal workflow
    client = await get_temporal_client()
    
    handle = await client.start_workflow(
        OrchestrationWorkflow.run,
        args=[workflow_id, workflow.definition, execute_request.input_data],
        id=execution_id,
        task_queue="orchestration-queue"
    )
    
    return {
        "execution_id": execution_id,
        "workflow_id": workflow_id,
        "status": "running"
    }

@router.post("/{workflow_id}/pause")
async def pause_workflow(workflow_id: str, execution_id: str):
    """Pause running workflow"""
    client = await get_temporal_client()
    handle = client.get_workflow_handle(execution_id)
    
    try:
        await handle.signal(OrchestrationWorkflow.pause)
        return {"status": "paused", "execution_id": execution_id}
    except Exception as e:
        raise HTTPException(500, f"Failed to pause: {str(e)}")

@router.post("/{workflow_id}/resume")
async def resume_workflow(workflow_id: str, execution_id: str):
    """Resume paused workflow"""
    client = await get_temporal_client()
    handle = client.get_workflow_handle(execution_id)
    
    try:
        await handle.signal(OrchestrationWorkflow.resume)
        return {"status": "resumed", "execution_id": execution_id}
    except Exception as e:
        raise HTTPException(500, f"Failed to resume: {str(e)}")

@router.get("/{workflow_id}/history")
async def get_workflow_history(workflow_id: str, execution_id: str):
    """Get workflow execution history from Temporal"""
    client = await get_temporal_client()
    handle = client.get_workflow_handle(execution_id)
    
    try:
        # Query workflow state
        state = await handle.query(OrchestrationWorkflow.get_state)
        
        # Get event history from Temporal
        history = []
        history_result = await handle.fetch_history()
        for event in history_result.events:
            history.append({
                "event_id": event.event_id,
                "event_type": event.event_type,
                "timestamp": event.event_time
            })
        
        return {
            "execution_id": execution_id,
            "state": state,
            "history": history
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to get history: {str(e)}")

@router.post("/{workflow_id}/compensate")
async def trigger_compensation(workflow_id: str, execution_id: str):
    """Manually trigger compensation/rollback"""
    # This would terminate workflow and trigger compensation
    client = await get_temporal_client()
    handle = client.get_workflow_handle(execution_id)
    
    try:
        await handle.terminate(reason="Manual compensation triggered")
        return {"status": "compensating", "execution_id": execution_id}
    except Exception as e:
        raise HTTPException(500, f"Failed to compensate: {str(e)}")

@router.put("/{workflow_id}")
async def update_workflow(
    workflow_id: str,
    workflow_update: WorkflowUpdateSchema,
    db: Session = Depends(get_db)
):
    """Update an existing workflow definition"""
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Pydantic's exclude_unset is great for PATCH, but for PUT we want to update the whole definition.
    update_data = workflow_update.dict()

    if "name" in update_data:
        db_workflow.name = update_data["name"]
    if "description" in update_data:
        db_workflow.description = update_data["description"]
    
    # Update the definition field with the new nodes and edges
    # This replaces the entire 'definition' JSONB field.
    db_workflow.definition = {
        "nodes": [n for n in update_data.get("nodes", [])],
        "edges": [e for e in update_data.get("edges", [])]
    }

    db.commit()
    db.refresh(db_workflow)
    
    return {"id": db_workflow.id, "status": "updated"}


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """Delete workflow definition"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(404, "Workflow not found")
    
    db.delete(workflow)
    db.commit()
    
    return {"status": "deleted", "workflow_id": workflow_id}