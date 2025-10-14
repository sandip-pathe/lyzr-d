"""Approval API - enhanced with multi-approver support"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from temporalio.client import Client
from typing import List
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
    """Approve/reject approval request with multi-approver support"""
    approval = db.query(ApprovalRequest).filter(
        ApprovalRequest.execution_id == execution_id,
        ApprovalRequest.status == "pending"
    ).first()
    
    if not approval:
        raise HTTPException(404, "Approval request not found")
    
    if response.action not in {"approve", "reject"}:
        raise HTTPException(400, "Invalid action")
    
    # For multi-approver: store individual responses
    if not approval.approval_data:
        approval.approval_data = {"responses": []}
    
    approval.approval_data["responses"].append({
        "approver": response.approver,
        "action": response.action,
        "comment": response.comment,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Check if approval threshold is met
    approval_type = approval.approval_data.get("approval_type", "any")
    total_approvers = approval.approval_data.get("total_approvers", 1)
    responses = approval.approval_data["responses"]
    
    approvals = [r for r in responses if r["action"] == "approve"]
    rejections = [r for r in responses if r["action"] == "reject"]
    
    should_proceed = False
    final_status = "pending"
    
    if approval_type == "any":
        # Any approval proceeds
        if len(approvals) > 0:
            should_proceed = True
            final_status = "approved"
        elif len(rejections) > 0:
            should_proceed = True
            final_status = "rejected"
    
    elif approval_type == "all":
        # All must approve
        if len(rejections) > 0:
            should_proceed = True
            final_status = "rejected"
        elif len(approvals) == total_approvers:
            should_proceed = True
            final_status = "approved"
    
    elif approval_type == "majority":
        # Majority wins
        if len(responses) >= total_approvers:
            if len(approvals) > len(rejections):
                should_proceed = True
                final_status = "approved"
            else:
                should_proceed = True
                final_status = "rejected"
    
    if should_proceed:
        approval.status = final_status
        db.commit()
        
        # Signal Temporal workflow
        client = await Client.connect(settings.TEMPORAL_HOST, namespace=settings.TEMPORAL_NAMESPACE)
        handle = client.get_workflow_handle(execution_id)
        
        await handle.signal(
            OrchestrationWorkflow.approve,
            {"action": final_status, "responses": responses}
        )
        
        return {"status": final_status, "execution_id": execution_id}
    else:
        db.commit()
        return {"status": "pending", "execution_id": execution_id, "waiting_for_more": True}

@router.get("/pending")
async def get_pending_approvals(db: Session = Depends(get_db)):
    """Get all pending approvals"""
    approvals = db.query(ApprovalRequest).filter(
        ApprovalRequest.status == "pending"
    ).all()
    
    return [
        {
            "id": a.id,
            "execution_id": a.execution_id,
            "node_id": a.node_id,
            "requested_at": a.requested_at,
            "approval_data": a.approval_data
        }
        for a in approvals
    ]
