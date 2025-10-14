"""Temporal activities - CORRECTED with await"""
from datetime import datetime, timezone
from uuid import uuid4
from temporalio import activity
import httpx
import asyncio
from typing import Any, Dict, List, Optional
from app.services.agent_executor import AgentExecutor
from app.services.eval_service import EvalService
from app.core.database import SessionLocal
from app.models.workflow import ApprovalRequest
from app.core.events import event_bus

eval_service = EvalService()

@activity.defn
async def execute_agent_node(node: dict, state: dict) -> dict:
    """Execute agent node"""
    executor = AgentExecutor()
    node_data = node.get("data", {})
    input_data = executor.resolve_input(node_data.get("input_mapping", {}), state)
    
    result = await executor.execute(
        provider=node_data.get("provider", "openai"),
        agent_id=node_data.get("agent_id"),
        input_data=input_data,
    )
    
    # ✅ FIX: Added await
    await event_bus.publish("node.completed", {
        "workflow_id": state.get("workflow_id"),
        "execution_id": state.get("execution_id"),
        "node_id": node.get("id"),
        "node_type": "agent",
        "result": result
    })
    
    return result

@activity.defn
async def execute_http_request(node: dict, state: dict) -> dict:
    """Execute HTTP action node"""
    node_data = node.get("data", {})
    
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=node_data.get("method", "POST"),
            url=node_data["url"],
            json=node_data.get("body", {}),
            headers=node_data.get("headers", {}),
            timeout=30.0,
        )
        result = {
            "status_code": response.status_code,
            "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
            "headers": dict(response.headers)
        }
    
    # ✅ FIX: Added await
    await event_bus.publish("node.completed", {
        "workflow_id": state.get("workflow_id"),
        "execution_id": state.get("execution_id"),
        "node_id": node.get("id"),
        "node_type": "action",
        "result": result
    })
    
    return result

@activity.defn
async def send_approval_request(node: dict, state: dict) -> dict:
    """Send approval request"""
    from app.services.notification import NotificationService
    notification_service = NotificationService()
    
    node_data = node.get("data", {})
    approval_id = str(uuid4())
    
    db = SessionLocal()
    approval = ApprovalRequest(
        id=approval_id,
        execution_id=state.get("execution_id"),
        node_id=node.get("id"),
        status="pending",
        requested_at=datetime.now(timezone.utc)
    )
    db.add(approval)
    db.commit()
    db.close()
    
    await notification_service.send_approval(
        workflow_id=state.get("workflow_id", ""),
        node_id=node.get("id", ""),
        title=node_data.get("title", "Approval Required"),
        description=node_data.get("description", ""),
        approvers=node_data.get("approvers", []),
        channels=node_data.get("channels", ["slack"])
    )
    
    # ✅ FIX: Added await
    await event_bus.publish("approval.requested", {
        "workflow_id": state.get("workflow_id"),
        "execution_id": state.get("execution_id"),
        "node_id": node.get("id"),
        "approval_id": approval_id
    })
    
    return {"approval_id": approval_id, "status": "pending"}

@activity.defn
async def execute_eval_node(node: dict, state: dict) -> dict:
    """Execute eval/compliance node"""
    node_data = node.get("data", {})
    eval_type = node_data.get("eval_type", "schema")
    previous_output = state.get("previous_output", {})
    
    result = await eval_service.evaluate(eval_type, previous_output, node_data)
    
    # ✅ FIX: Added await
    await event_bus.publish("eval.completed", {
        "workflow_id": state.get("workflow_id"),
        "execution_id": state.get("execution_id"),
        "node_id": node.get("id"),
        "passed": result.get("passed"),
        "score": result.get("score"),
        "reason": result.get("reason")
    })
    
    if not result.get("passed") and node_data.get("on_failure") == "block":
        raise Exception(f"Eval failed: {result.get('reason')}")
    
    return result

@activity.defn
async def execute_fork_node(node: dict, state: dict) -> dict:
    """Fork execution into parallel branches"""
    node_data = node.get("data", {})
    branches = node_data.get("branches", [])
    
    # ✅ FIX: Added await
    await event_bus.publish("fork.started", {
        "workflow_id": state.get("workflow_id"),
        "execution_id": state.get("execution_id"),
        "node_id": node.get("id"),
        "branch_count": len(branches)
    })
    
    return {"branches": branches, "fork_id": node.get("id")}

@activity.defn
async def execute_merge_node(node: dict, state: dict) -> dict:
    """Merge results from parallel branches"""
    node_data = node.get("data", {})
    merge_strategy = node_data.get("merge_strategy", "combine")
    branch_results = state.get("branch_results", [])
    
    if merge_strategy == "combine":
        merged = {"results": branch_results}
    elif merge_strategy == "first":
        merged = branch_results[0] if branch_results else {}
    elif merge_strategy == "vote":
        from collections import Counter
        votes = [str(r) for r in branch_results]
        most_common = Counter(votes).most_common(1)[0][0]
        merged = {"winner": most_common, "votes": branch_results}
    else:
        merged = {"results": branch_results}
    
    # ✅ FIX: Added await
    await event_bus.publish("merge.completed", {
        "workflow_id": state.get("workflow_id"),
        "execution_id": state.get("execution_id"),
        "node_id": node.get("id"),
        "merged_result": merged
    })
    
    return merged

@activity.defn
async def execute_timer_node(node: dict, state: dict) -> dict:
    """Execute timer/wait node"""
    node_data = node.get("data", {})
    duration_seconds = node_data.get("duration_seconds", 0)
    
    # ✅ FIX: Added await
    await event_bus.publish("timer.started", {
        "workflow_id": state.get("workflow_id"),
        "execution_id": state.get("execution_id"),
        "node_id": node.get("id"),
        "duration": duration_seconds
    })
    
    await asyncio.sleep(duration_seconds)
    
    # ✅ FIX: Added await
    await event_bus.publish("timer.completed", {
        "workflow_id": state.get("workflow_id"),
        "execution_id": state.get("execution_id"),
        "node_id": node.get("id")
    })
    
    return {"waited": duration_seconds, "completed_at": datetime.now(timezone.utc).isoformat()}

@activity.defn
async def execute_event_node(node: dict, state: dict) -> dict:
    """Publish or subscribe to event"""
    node_data = node.get("data", {})
    operation = node_data.get("operation", "publish")
    channel = node_data.get("channel")
    
    if operation == "publish":
        # ✅ FIX: Added await
        await event_bus.publish(channel, {
            "workflow_id": state.get("workflow_id"),
            "execution_id": state.get("execution_id"),
            "node_id": node.get("id"),
            "payload": state.get("previous_output", {})
        })
        return {"operation": "published", "channel": channel}
    
    elif operation == "subscribe":
        return {"operation": "subscribed", "channel": channel}
    
    return {}

@activity.defn
async def execute_meta_node(node: dict, state: dict) -> dict:
    """Execute meta-observability node"""
    node_data = node.get("data", {})
    operation = node_data.get("operation", "observe")
    
    if operation == "observe":
        metrics = {
            "nodes_executed": len(state.get("execution_history", [])),
            "current_node": node.get("id"),
            "workflow_id": state.get("workflow_id"),
            "execution_id": state.get("execution_id"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # ✅ FIX: Added await
        await event_bus.publish("meta.observation", {
            "workflow_id": state.get("workflow_id"),
            "execution_id": state.get("execution_id"),
            "metrics": metrics
        })
        
        return metrics
    
    return {"operation": operation}

@activity.defn
async def publish_workflow_status(execution_id: str, workflow_id: str, status: str, result: Optional[Dict[str, Any]] = None, error: Optional[str] = None):
    """Publish workflow completion or failure event."""
    event_type = f"workflow.{status}"
    data = {
        "execution_id": execution_id,
        "workflow_id": workflow_id,
        "result": result,
        "error": error
    }
    await event_bus.publish(event_type, data)