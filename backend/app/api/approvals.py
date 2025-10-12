from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from temporalio.client import Client


from app.core.config import settings
from app.core.database import get_db
from app.models.workflow import ApprovalRequest
from app.schemas.workflow import ApprovalResponseSchema
from app.temporal.workflows import OrchestrationWorkflow

router = APIRouter(prefix="/approvals", tags=["approvals"])

@router.post("/{execution_id}/approve")
async def respond_to_approval(
    execution_id: str,
    response: ApprovalResponseSchema,
    db: Session = Depends(get_db)
):
    """Approve/reject approval request"""
    # Update approval record
    approval = db.query(ApprovalRequest).filter(
        ApprovalRequest.execution_id == execution_id,
        ApprovalRequest.status == "pending"
    ).first()
    
    if not approval:
        raise HTTPException(404, "Approval request not found")

    if response.action not in {"approve","reject"}:
        raise HTTPException(400, "Invalid action")
    approval.status = "approved" if response.action == "approve" else "rejected"
    approval.approval_data = response.data
    db.commit()

    
    # Send signal to Temporal workflow
    client = await Client.connect(settings.TEMPORAL_HOST)
    handle = client.get_workflow_handle(execution_id)
    
    await handle.signal(
        OrchestrationWorkflow.approve,
        {"action": response.action, "data": response.data}
    )
    
    return {"status": "approval_processed"}
