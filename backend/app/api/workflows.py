from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from temporalio.client import Client
from uuid import uuid4

from app.core.database import get_db
from app.core.config import settings
from app.models.workflow import Workflow, Execution
from app.schemas.workflow import WorkflowCreateSchema, WorkflowExecuteSchema
from app.temporal.workflows import OrchestrationWorkflow

router = APIRouter(prefix="/workflows", tags=["workflows"])

@router.post("/")
async def create_workflow(
    workflow: WorkflowCreateSchema,
    db: Session = Depends(get_db)
):
    """Create new workflow"""
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
    """Get workflow by ID"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(404, "Workflow not found")
    return workflow

@router.post("/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: str,
    execute_data: WorkflowExecuteSchema,
    db: Session = Depends(get_db)
):
    """Start workflow execution"""
    # Get workflow
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(404, "Workflow not found")
    
    # Create execution record
    execution_id = str(uuid4())
    execution = Execution(
        id=execution_id,
        workflow_id=workflow_id,
        status="running",
        input_data=execute_data.input_data
    )
    db.add(execution)
    db.commit()
    
    # Start Temporal workflow
    client = await Client.connect(settings.TEMPORAL_HOST)
    handle = await client.start_workflow(
        OrchestrationWorkflow.run,
        args=[execution_id, workflow.definition, execute_data.input_data, workflow_id],
        id=execution_id,
        task_queue="orchestrator-tasks",
    )
    
    return {
        "execution_id": execution_id,
        "status": "running",
        "workflow_id": handle.id
    }

@router.get("/{workflow_id}/executions/{execution_id}")
async def get_execution(
    workflow_id: str,
    execution_id: str,
    db: Session = Depends(get_db)
):
    """Get execution status"""
    execution = db.query(Execution).filter(
        Execution.id == execution_id,
        Execution.workflow_id == workflow_id
    ).first()
    
    if not execution:
        raise HTTPException(404, "Execution not found")
    
    # Query Temporal for current state
    client = await Client.connect(settings.TEMPORAL_HOST)
    handle = client.get_workflow_handle(execution_id)
    
    try:
        state = await handle.query(OrchestrationWorkflow.get_state)
        return {
            **execution.__dict__,
            "current_state": state
        }
    except:
        return execution
