from datetime import datetime
from uuid import uuid4
from temporalio import activity
import httpx
from app.services.agent_executor import AgentExecutor
from app.core.database import SessionLocal
from app.models.workflow import ApprovalRequest

@activity.defn
async def execute_agent_node(node: dict, state: dict) -> dict:
    executor = AgentExecutor()
    node_data = node.get("data", {})  # pull config from data
    input_data = executor.resolve_input(node_data.get("input_mapping", {}), state)
    result = await executor.execute(
        provider=node_data.get("provider", "openai"),
        agent_id=node_data.get("agent_id"),
        input_data=input_data,
    )
    return result

@activity.defn
async def execute_http_request(node: dict, state: dict) -> dict:
    node_data = node.get("data", {})
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=node_data.get("method", "POST"),
            url=node_data["url"],
            json=node_data.get("body", {}),
            headers=node_data.get("headers", {}),
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()


@activity.defn
async def send_approval_request(workflow_id: str, node: dict) -> None:
    notification = notification.NotificationService()
    node_id = node["id"]
    # create pending approval record
    db = SessionLocal()
    try:
        approval = ApprovalRequest(
            id=str(uuid4()),
            execution_id=workflow_id,  # Note: here execution_id should be the workflow run id (passed from caller)
            node_id=node_id,
            status="pending",
            approver="",
            approval_data=None,
            requested_at=datetime.utcnow(),
        )
        db.add(approval)
        db.commit()
    finally:
        db.close()

    node_data = node.get("data", {})
    await notification.send_approval(
        workflow_id=workflow_id,
        node_id=node_id,
        title=node_data.get("title", "Approval Required"),
        description=node_data.get("description", ""),
        approvers=node_data.get("approvers", []),
        channels=node_data.get("channels", ["email"]),
    )

