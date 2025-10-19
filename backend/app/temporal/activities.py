"""Temporal activities - CORRECTED with await"""
from datetime import datetime, timezone
import json
from uuid import uuid4
from temporalio import activity
import httpx
import asyncio
from typing import Any, Counter, Dict, List, Optional
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
agent_executor_util = AgentExecutor()

@activity.defn
async def execute_agent_node(node: dict, activity_context: dict) -> dict:
    """Execute agent node using new schema."""
    node_data = node.get("data", {})
    node_config = node_data.get("config", {})
    
    # Extract config based on new schema
    name = node_config.get("name", "Unnamed Agent")
    system_instructions = node_config.get("system_instructions", "You are a helpful assistant.")
    temperature = node_config.get("temperature", 0.7)
    expected_output_format = node_config.get("expected_output_format")
    
    # Legacy support for provider/agent_id
    provider = node_config.get("provider", "openai")
    agent_id = node_config.get("agent_id", "gpt-4o-mini")
    
    # Get input from previous node or workflow context
    previous_output = activity_context.get("previous_output", {})
    workflow_input = activity_context.get("input", {})
    
    # Prepare input_data for the agent
    input_data = previous_output if previous_output else workflow_input

    activity.logger.info(f"Executing agent node '{name}' with model {agent_id}")

    result = await agent_executor_util.execute(
        name=name,
        system_instructions=system_instructions,
        input_data=input_data,
        temperature=temperature,
        expected_output_format=expected_output_format,
        provider=provider,
        agent_id=agent_id
    )

    return result

@activity.defn
async def get_fallback_agent(provider: str, failed_agent_id: str, all_agent_ids: List[str]) -> Optional[str]:
    """Activity to get a fallback agent using the self-healing service."""
    activity.logger.info(f"Getting fallback for failed agent {failed_agent_id}")
    return self_healing_service.get_alternate_agent(provider, failed_agent_id, all_agent_ids)

@activity.defn
async def compensate_node(node: dict, state: dict):
    """Activity to trigger compensation for a single node."""
    activity.logger.info(f"⏪ Compensating node {node.get('id')}")
    # state here is the full state passed from the workflow (_get_full_state())
    result = await compensation_service.compensate_node(
        node=node,
        execution_id=state.get("execution_id", ""),
        workflow_id=state.get("workflow_id", ""),
        state=state
    )
    activity.logger.info(f"Compensation result for node {node.get('id')}: {result}")

@activity.defn
async def execute_api_call_node(node: dict, activity_context: dict) -> dict:
    """Execute API Call node using new schema."""
    node_data = node.get("data", {})
    node_config = node_data.get("config", {})
    
    # Extract config based on new schema
    name = node_config.get("name", "Unnamed API Call")
    url = node_config.get("url")
    method = node_config.get("method", "POST")
    headers = node_config.get("headers", {})
    body = node_config.get("body", {})
    
    if not url:
        raise ValueError(f"API Call node '{name}' requires a URL")

    # Get input from previous node for dynamic body values
    previous_output = activity_context.get("previous_output", {})
    
    # Merge previous output into body if needed
    request_body = {**body}
    if previous_output and isinstance(previous_output, dict):
        # Simple merge - can be enhanced with template resolution
        request_body = {**request_body, "input": previous_output}

    activity.logger.info(f"Executing API call '{name}' to {method} {url}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=method,
                url=url,
                json=request_body if method != "GET" else None,
                headers=headers,
                timeout=60.0,
            )
            response.raise_for_status()
            result = {
                "status_code": response.status_code,
                "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
                "headers": dict(response.headers)
            }
        activity.logger.info(f"API call '{name}' successful: Status {result['status_code']}")
        return result
    except httpx.HTTPStatusError as e:
        activity.logger.error(f"API call '{name}' failed: Status {e.response.status_code}, Response: {e.response.text}")
        raise RuntimeError(f"API call failed with status {e.response.status_code}: {e.response.text}") from e
    except httpx.RequestError as e:
        activity.logger.error(f"API call '{name}' request error: {e}")
        raise RuntimeError(f"API call request error: {e}") from e


@activity.defn
async def execute_merge_node(node: dict, activity_context: dict) -> dict:
    """Merge results from parallel branches based on strategy."""
    node_config = node.get("data", {}).get("config", {})
    
    # Extract config based on new schema
    name = node_config.get("name", "Unnamed Merge")
    merge_strategy = node_config.get("merge_strategy", "combine")
    
    node_outputs = activity_context.get("node_outputs", {})
    incoming_branch_node_ids = activity_context.get("incoming_branch_node_ids", [])
    branch_results = [node_outputs.get(branch_id) for branch_id in incoming_branch_node_ids if branch_id in node_outputs]

    activity.logger.info(f"Merging results from branches {incoming_branch_node_ids} using strategy '{merge_strategy}'")

    merged_result: Any = None
    if not branch_results:
        activity.logger.warning(f"No branch results found for merge node '{name}'")
        merged_result = {"warning": "No branch results to merge", "results": []}

    elif merge_strategy == "combine":
        merged_result = {"merged_results": branch_results}

    elif merge_strategy == "first":
        merged_result = branch_results[0]

    elif merge_strategy == "vote":
        try:
            votes = [json.dumps(r, sort_keys=True) for r in branch_results]
        except TypeError:
             votes = [str(r) for r in branch_results]
        if votes:
            most_common_vote_str = Counter(votes).most_common(1)[0][0]
            try:
                winner = json.loads(most_common_vote_str)
            except json.JSONDecodeError:
                winner = most_common_vote_str
            merged_result = {"winner": winner, "all_votes": branch_results}
        else:
            merged_result = {"winner": None, "all_votes": []}

    else:
        activity.logger.warning(f"Unknown merge strategy '{merge_strategy}', defaulting to 'combine'")
        merged_result = {"merged_results": branch_results}

    activity.logger.info(f"Merge '{name}' completed")
    return merged_result


# --- NEW: publish_generic_event Activity ---
@activity.defn
async def publish_generic_event(event_type: str, data: Dict[str, Any]):
    """Publishes any event to the event bus."""
    # Ensure data doesn't contain non-serializable items if not already handled
    try:
        await event_bus.publish(event_type, data)
        activity.logger.info(f"Published generic event: {event_type}")
        return {"status": "published", "event_type": event_type}
    except Exception as e:
        activity.logger.error(f"Failed to publish generic event {event_type}: {e}")
        # Return a structured failure result rather than raising so workflow can decide retry behavior
        return {"status": "failed", "event_type": event_type, "error": str(e)}

@activity.defn
async def send_approval_request(node: dict, activity_context: dict) -> dict:
    """Send approval request (UI or external). Now uses activity_context."""
    # This was previously request_ui_approval, let's keep it general
    node_id = node.get("id")
    node_config = node.get("data", {}).get("config", {})
    # Get details from the node config defined in schemas/node_types.py
    title = node_config.get("title", "Approval Required")
    description = node_config.get("description", "Please review and take action.")
    approvers = node_config.get("approvers", [])
    channels = node_config.get("channels", ["ui"]) # Default to UI event

    approval_id = str(uuid4())
    workflow_id = activity_context.get("workflow_id")
    execution_id = activity_context.get("execution_id")
    previous_output = activity_context.get("node_outputs", {}).get(activity_context.get("previous_node_id")) # Or get from history

    # Persist the request state
    db = SessionLocal()
    try:
        approval = ApprovalRequest(
            id=approval_id,
            execution_id=execution_id,
            node_id=node_id,
            status="pending",
            approval_data={ # Store context for display
                "title": title,
                "description": description,
                "context": previous_output,
                "approvers": approvers,
                "channels": channels,
            },
            requested_at=datetime.now(timezone.utc)
        )
        db.add(approval)
        db.commit()
    finally:
        db.close()

    # Publish event for UI/Notifications
    await event_bus.publish("approval.requested", {
        "workflow_id": workflow_id,
        "execution_id": execution_id,
        "node_id": node_id,
        "approval_id": approval_id,
        "title": title,
        "description": description,
        "context": previous_output, # Send context in the event too
    })



    activity.logger.info(f"Approval request '{approval_id}' sent for node {node_id}")
    return {"approval_id": approval_id, "status": "pending"}

@activity.defn
async def execute_eval_node(node: dict, activity_context: dict) -> dict:
    """Execute eval/compliance node using new schema."""
    node_config = node.get("data", {}).get("config", {})
    
    # Extract config based on new schema
    name = node_config.get("name", "Unnamed Eval")
    eval_type = node_config.get("eval_type", "schema")
    eval_specific_config = node_config.get("config", {})
    on_failure = node_config.get("on_failure", "block")
    
    # Eval usually operates on the previous node's output
    input_to_evaluate = activity_context.get("previous_output", {})

    activity.logger.info(f"Evaluating input for node '{name}' using type '{eval_type}'")

    result = await eval_service.evaluate(eval_type, input_to_evaluate, eval_specific_config)
    
    # Add on_failure to result for workflow to handle
    result["on_failure"] = on_failure

    return result

@activity.defn
async def execute_timer_node(node: dict, activity_context: dict) -> dict:
    """Logs start/end for timer node (actual sleep is in workflow)."""
    node_config = node.get("data", {}).get("config", {})
    
    # Extract config based on new schema
    name = node_config.get("name", "Unnamed Timer")
    duration_seconds = node_config.get("duration_seconds", 0)

    activity.logger.info(f"Timer node '{name}' activity started (wait duration: {duration_seconds}s)")

    return {"waited_seconds": duration_seconds}


@activity.defn
async def execute_event_node(node: dict, activity_context: dict) -> dict:
    """Publish or subscribe to event using new schema."""
    node_config = node.get("data", {}).get("config", {})
    
    # Extract config based on new schema
    name = node_config.get("name", "Unnamed Event")
    operation = node_config.get("operation", "publish")
    channel = node_config.get("channel")

    if not channel:
         raise ValueError(f"Event node '{name}' requires a 'channel' in its config")

    previous_output = activity_context.get("previous_output", {})

    if operation == "publish":
        payload = {
            "workflow_id": activity_context.get("workflow_id"),
            "execution_id": activity_context.get("execution_id"),
            "node_id": node.get("id"),
            "payload": previous_output
        }
        await event_bus.publish(channel, payload)
        activity.logger.info(f"Event node '{name}' published to channel '{channel}'")
        return {"operation": "published", "channel": channel}

    elif operation == "subscribe":
        activity.logger.warning(f"Event node '{name}': 'subscribe' operation is not fully implemented in this activity.")
        return {"operation": "subscribe_attempted", "channel": channel}

    else:
        raise ValueError(f"Unknown event operation: {operation}")


@activity.defn
async def execute_meta_node(node: dict, activity_context: dict) -> dict:
    """Execute meta-observability node."""
    node_config = node.get("data", {}).get("config", {})
    operation = node_config.get("operation", "observe")

    if operation == "observe":
        metrics = {
            # Example metrics - customize as needed
            "nodes_executed_count": len(activity_context.get("node_outputs", {})),
            "current_node_id": node.get("id"),
            "workflow_id": activity_context.get("workflow_id"),
            "execution_id": activity_context.get("execution_id"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metrics_to_capture": node_config.get("metrics_to_capture", [])
        }
        activity.logger.info(f"Meta observation: {metrics}")
        # Publishing event is now handled by the workflow using publish_generic_event
        return metrics
    else:
        activity.logger.warning(f"Meta operation '{operation}' not fully implemented.")
        return {"operation": operation, "status": "not_implemented"}


@activity.defn
async def publish_workflow_status(execution_id: str, workflow_id: str, status: str, result: Optional[Dict[str, Any]] = None, error: Optional[str] = None):
    """Publish workflow completion or failure event."""
    event_type = f"workflow.{status}"
    data = {
        "execution_id": execution_id,
        "workflow_id": workflow_id,
        # Ensure result and error are serializable
        "result": result, # Already should be dict/serializable
        "error": error
    }
    await event_bus.publish(event_type, data)


@activity.defn
async def request_ui_approval(node: dict, activity_context: dict) -> dict:
    """Publish an event specifically for the UI to request approval using new schema."""
    node_config = node.get("data", {}).get("config", {})
    
    # Extract config based on new schema
    name = node_config.get("name", "Unnamed Approval")
    description = node_config.get("description", "Please review and approve this step.")
    
    previous_output = activity_context.get("previous_output", {})
    approval_id = str(uuid4())

    await event_bus.publish("ui.approval.requested", {
        "workflow_id": activity_context.get("workflow_id"),
        "execution_id": activity_context.get("execution_id"),
        "node_id": node.get("id"),
        "approval_id": approval_id,
        "title": name,
        "description": description,
        "context": previous_output
    })

    activity.logger.info(f"UI approval request '{approval_id}' sent for node '{name}'")
    return {"status": "ui_approval_sent", "approval_id": approval_id}