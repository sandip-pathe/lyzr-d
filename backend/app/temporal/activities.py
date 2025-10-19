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
    """Execute agent node using resolved input."""
    node_data = node.get("data", {})
    node_config = node_data.get("config", {})
    input_data = activity_context.get("current_input", {}) # Use resolved input

    activity.logger.info(f"Executing agent node {node.get('id')} with input: {input_data}")

    result = await agent_executor_util.execute(
        provider=node_config.get("provider", "openai"),
        agent_id=node_config.get("agent_id"),
        input_data=input_data, # Pass the resolved input data
        # Add auto-tuning/previous_eval_score if needed from activity_context
    )

    # Publishing event is now handled by the workflow using publish_generic_event
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
    """Execute API Call node using resolved input and body template."""
    node_data = node.get("data", {})
    node_config = node_data.get("config", {})
    input_data = activity_context.get("current_input", {}) # Use resolved input

    url = node_config.get("url")
    method = node_config.get("method", "POST")
    headers = node_config.get("headers", {})
    body_template = node_config.get("body_template", {})

    # Resolve body template using the input data
    # (Using the same logic as input_mapping resolution for simplicity)
    request_body = agent_executor_util.resolve_input(body_template, {"input": input_data, **activity_context})

    activity.logger.info(f"Executing API call to {method} {url} with body: {request_body}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=method,
                url=url,
                json=request_body,
                headers=headers,
                timeout=60.0, # Increased timeout
            )
            response.raise_for_status() # Raise exception for 4xx/5xx responses
            result = {
                "status_code": response.status_code,
                "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
                "headers": dict(response.headers)
            }
        activity.logger.info(f"API call successful: Status {result['status_code']}")
        return result
    except httpx.HTTPStatusError as e:
        activity.logger.error(f"API call failed: Status {e.response.status_code}, Response: {e.response.text}")
        # Re-raise as an activity error so Temporal handles retries/failure
        raise RuntimeError(f"API call failed with status {e.response.status_code}: {e.response.text}") from e
    except httpx.RequestError as e:
        activity.logger.error(f"API call request error: {e}")
        raise RuntimeError(f"API call request error: {e}") from e


# --- Updated: execute_merge_node ---
@activity.defn
async def execute_merge_node(node: dict, activity_context: dict) -> dict:
    """Merge results from parallel branches based on strategy."""
    node_id = node.get("id")
    node_config = node.get("data", {}).get("config", {})
    merge_strategy = node_config.get("merge_strategy", "combine")
    node_outputs = activity_context.get("node_outputs", {})

    # --- Logic to find incoming node IDs (Requires Workflow Definition Access or Context Passing) ---
    # This is a complex part. Ideally, the workflow knows which nodes feed into the merge.
    # For now, let's assume the context *could* contain IDs of completed branches,
    # or we infer based on naming conventions or graph structure analysis (less reliable in activity).
    # Simplified: We'll look for keys in node_outputs that *might* be from branches.
    # A better approach: The workflow passes the specific node IDs of the branches to merge.
    # Let's assume activity_context['incoming_branch_node_ids'] = ['node_a', 'node_b'] exists.
    incoming_branch_node_ids = activity_context.get("incoming_branch_node_ids", []) # Needs to be populated by workflow
    branch_results = [node_outputs.get(branch_id) for branch_id in incoming_branch_node_ids if branch_id in node_outputs]

    activity.logger.info(f"Merging results from branches {incoming_branch_node_ids} using strategy '{merge_strategy}'")

    merged_result: Any = None
    if not branch_results:
        activity.logger.warning(f"No branch results found for merge node {node_id}")
        merged_result = {"warning": "No branch results to merge", "results": []}

    elif merge_strategy == "combine":
        # Combine into a list or dictionary
        merged_result = {"merged_results": branch_results}
        # Or combine into a dict if branch IDs are meaningful keys:
        # merged_result = {branch_id: node_outputs.get(branch_id) for branch_id in incoming_branch_node_ids if branch_id in node_outputs}

    elif merge_strategy == "first":
        merged_result = branch_results[0]

    elif merge_strategy == "vote":
        # Simple voting based on string representation (can be customized)
        try:
            votes = [json.dumps(r, sort_keys=True) for r in branch_results] # Make hashable
        except TypeError:
             votes = [str(r) for r in branch_results] # Fallback
        if votes:
            most_common_vote_str = Counter(votes).most_common(1)[0][0]
            try:
                winner = json.loads(most_common_vote_str) # Try converting back
            except json.JSONDecodeError:
                winner = most_common_vote_str # Keep as string if not valid JSON
            merged_result = {"winner": winner, "all_votes": branch_results}
        else:
            merged_result = {"winner": None, "all_votes": []}

    else: # Default to combine
        activity.logger.warning(f"Unknown merge strategy '{merge_strategy}', defaulting to 'combine'")
        merged_result = {"merged_results": branch_results}

    activity.logger.info(f"Merge result: {merged_result}")
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

    # --- Optional: Send external notifications ---
    # from app.services.notification import NotificationService
    # notification_service = NotificationService()
    # try:
    #     await notification_service.send_approval(
    #         workflow_id=workflow_id,
    #         node_id=node_id,
    #         title=title,
    #         description=description,
    #         approvers=approvers,
    #         channels=[ch for ch in channels if ch != "ui"] # Exclude UI channel
    #     )
    # except Exception as e:
    #     activity.logger.error(f"Failed to send external approval notification: {e}")
    # --- End Optional ---


    activity.logger.info(f"Approval request '{approval_id}' sent for node {node_id}")
    return {"approval_id": approval_id, "status": "pending"}

# Ensure execute_eval_node uses activity_context correctly
@activity.defn
async def execute_eval_node(node: dict, activity_context: dict) -> dict:
    """Execute eval/compliance node using resolved input."""
    node_config = node.get("data", {}).get("config", {})
    eval_type = node_config.get("eval_type", "schema")
    # Eval usually operates on the *previous* node's output
    input_to_evaluate = activity_context.get("previous_output", {})
    eval_specific_config = node_config.get("config", {}) # The nested config dict

    activity.logger.info(f"Evaluating input for node {node.get('id')} using type '{eval_type}'")

    result = await eval_service.evaluate(eval_type, input_to_evaluate, eval_specific_config)

    # Publishing event is now handled by the workflow using publish_generic_event

    # Note: Failure handling logic (block/compensate/retry/warn) is now primarily in the workflow itself.
    # The activity just returns the evaluation result.
    return result

# Timer, Event, Meta activities likely need minimal changes, just ensure they use activity_context if accessing state
@activity.defn
async def execute_timer_node(node: dict, activity_context: dict) -> dict:
    """Logs start/end for timer node (actual sleep is in workflow)."""
    node_id = node.get("id")
    node_config = node.get("data", {}).get("config", {})
    duration_seconds = node_config.get("duration_seconds", 0)

    # Log start event immediately
    # Publishing event is now handled by the workflow using publish_generic_event

    # The actual wait happens via workflow.sleep() in the workflow code
    # This activity now mainly serves logging purposes if needed, or could be removed
    # if workflow._publish_node_event is sufficient.
    activity.logger.info(f"Timer node {node_id} activity started (wait duration: {duration_seconds}s)")

    # Simulate completion logging after the sleep would have occurred
    return {"waited_seconds": duration_seconds} # Result reflects the intended duration


@activity.defn
async def execute_event_node(node: dict, activity_context: dict) -> dict:
    """Publish or subscribe to event."""
    node_config = node.get("data", {}).get("config", {})
    operation = node_config.get("operation", "publish")
    channel = node_config.get("channel")
    input_data = activity_context.get("current_input", {}) # Use resolved input for payload

    if not channel:
         raise ValueError("Event node requires a 'channel' in its config")

    if operation == "publish":
        payload = {
            "workflow_id": activity_context.get("workflow_id"),
            "execution_id": activity_context.get("execution_id"),
            "node_id": node.get("id"),
            "payload": input_data # Use the resolved input as the event payload
        }
        await event_bus.publish(channel, payload)
        activity.logger.info(f"Published event to channel '{channel}'")
        return {"operation": "published", "channel": channel}

    elif operation == "subscribe":
        # Subscription logic is more complex in Temporal.
        # It might involve waiting for a signal, using long-running activities,
        # or external triggers starting a workflow.
        # This activity can't easily block and wait for an external event.
        activity.logger.warning("Event 'subscribe' operation is not fully implemented in this activity.")
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
    """Publish an event specifically for the UI to request approval."""
    node_id = node.get("id")
    node_config = node.get("data", {}).get("config", {})
    prompt = node_config.get("prompt", "Do you approve this step?") # Using schema field
    title = node_config.get("title", "Approval Required")
    description = node_config.get("description", prompt) # Use prompt as fallback description
    previous_output = activity_context.get("previous_output", {}) # Get previous node's output

    approval_id = str(uuid4()) # Generate a unique ID for this specific request instance

    await event_bus.publish("ui.approval.requested", {
        "workflow_id": activity_context.get("workflow_id"),
        "execution_id": activity_context.get("execution_id"),
        "node_id": node_id,
        "approval_id": approval_id, # Include the unique ID
        "title": title,
        "description": description,
        "context": previous_output # Pass previous node output as context for the UI modal
    })

    activity.logger.info(f"UI approval request '{approval_id}' sent for node {node_id}")
    # Persist request? Maybe not needed if UI signal includes approval_id
    # DB persistence happens in send_approval_request if used for external notifications

    return {"status": "ui_approval_sent", "approval_id": approval_id}