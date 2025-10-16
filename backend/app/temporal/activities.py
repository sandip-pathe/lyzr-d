"""Temporal activities - CORRECTED with await"""
from datetime import datetime, timezone
from uuid import uuid4
from temporalio import activity
import httpx
import asyncio
from typing import Any, Dict, List, Optional
from app.services.agent_executor import AgentExecutor
from app.services.eval_service import EvalService
from app.services.compensation_service import CompensationService
from app.services.self_healing import SelfHealingService
from app.core.database import SessionLocal
from app.models.workflow import ApprovalRequest
from app.core.events import event_bus

eval_service = EvalService()
compensation_service = CompensationService()
self_healing_service = SelfHealingService()

@activity.defn
async def execute_agent_node(node: dict, state: dict) -> dict:
    """Execute agent node"""
    executor = AgentExecutor()
    node_data = node.get("data", {})
    
    # Resolve input from the current state
    input_mapping = node_data.get("config", {}).get("input_mapping", {})
    input_data = executor.resolve_input(input_mapping, state)
    
    result = await executor.execute(
        provider=node_data.get("config", {}).get("provider", "openai"),
        agent_id=node_data.get("config", {}).get("agent_id"),
        input_data=input_data,
    )
    
    await event_bus.publish("node.completed", {
        "workflow_id": state.get("workflow_id"),
        "execution_id": state.get("execution_id"),
        "node_id": node.get("id"),
        "node_type": "agent",
        "result": result
    })
    
    return result

@activity.defn
async def get_fallback_agent(provider: str, failed_agent_id: str, all_agent_ids: List[str]) -> Optional[str]:
    """Activity to get a fallback agent using the self-healing service."""
    activity.logger.info(f"Getting fallback for failed agent {failed_agent_id}")
    return self_healing_service.get_alternate_agent(provider, failed_agent_id, all_agent_ids)


@activity.defn
async def compensate_node(node: dict, state: dict):
    """Activity to trigger compensation for a single node."""
    activity.logger.info(f"Compensating node {node.get('id')}")
    await compensation_service.compensate_node(
        node=node,
        execution_id=state.get("execution_id", ""),
        workflow_id=state.get("workflow_id", ""),
        state=state
    )

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
    
    await event_bus.publish("timer.started", {
        "workflow_id": state.get("workflow_id"),
        "execution_id": state.get("execution_id"),
        "node_id": node.get("id"),
        "duration": duration_seconds
    })
    
    await asyncio.sleep(duration_seconds)
    
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
        await event_bus.publish(channel, {
            "workflow_id": state.get("workflow_id"),
            "execution_id": state.get("execution_id"),
            "node_id": node.get("id"),
            "payload": state.get("previous_output", {})
        })
        return {"operation": "published", "channel": channel}
    
    elif operation == "subscribe":
        # In a real scenario, this would likely involve a long-running activity or a signal
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

@activity.defn
async def request_ui_approval(node: dict, state: dict) -> dict:
    """Publish an event for the UI to catch for a simple approval."""
    node_id = node.get("id")
    prompt = node.get("data", {}).get("config", {}).get("prompt", "Do you approve?")
    
    await event_bus.publish("ui.approval.requested", {
        "workflow_id": state.get("workflow_id"),
        "execution_id": state.get("execution_id"),
        "node_id": node_id,
        "prompt": prompt,
        "context": state.get("previous_output", {}) # Pass previous node output as context
    })
    
    activity.logger.info(f"UI approval request sent for node {node_id}")
    return {"status": "ui_approval_sent"}