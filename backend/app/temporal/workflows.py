"""Temporal Orchestration Workflow - CORRECTED VERSION"""

import asyncio
from temporalio import workflow
from temporalio.common import RetryPolicy 
from temporalio.exceptions import ApplicationError, ActivityError
from datetime import timedelta, datetime
from typing import Dict, Any, List, Optional


with workflow.unsafe.imports_passed_through():
    from app.temporal.activities import (
        compensate_node, execute_agent_node, execute_api_call_node,
        execute_eval_node, execute_event_node, execute_merge_node,
        execute_timer_node, get_fallback_agent,
        publish_workflow_status, request_ui_approval
    )
    from app.services.agent_executor import AgentExecutor
    from app.services.output_mapper import output_mapper
    from app.schemas.node_outputs import BaseNodeOutput
    from app.services.execution_context import ExecutionContext


DEFAULT_ACTIVITY_RETRY_POLICY = RetryPolicy(
    initial_interval=timedelta(seconds=1),
    maximum_interval=timedelta(seconds=10),
    backoff_coefficient=2.0,
    maximum_attempts=3,
)


@workflow.defn
class OrchestrationWorkflow:
    """
    Revised orchestration workflow managing state, execution flow,
    conditionals, approvals, error handling, and compensation.
    """
    def __init__(self):
        self.node_outputs: Dict[str, Any] = {}
        self.mapped_outputs: Dict[str, BaseNodeOutput] = {}  # Store mapped outputs
        self.workflow_context: Dict[str, Any] = {}
        self.execution_history: List[Dict[str, Any]] = []
        self._approval_status: Optional[str] = None
        self._approval_data: Optional[Dict[str, Any]] = None
        self._paused = False
        self.execution_context: Optional[ExecutionContext] = None  # Will be initialized in run()

    def _get_full_state(self) -> Dict[str, Any]:
        """Combines workflow context and node outputs for activities."""
        return {
            **self.workflow_context,
            "node_outputs": self.node_outputs,
            "previous_output": self.execution_history[-1].get("result") if self.execution_history else None
        }

    def _get_node_input(self, node_id: str, node_type: str, node_config: Dict[str, Any]) -> Any:
        """Get intelligent input for a node from previous node using output mapper."""
        print(f"=== _get_node_input CALLED ===")
        print(f"Target node: {node_id} ({node_type})")
        print(f"Execution history length: {len(self.execution_history)}")
        print(f"Mapped outputs keys: {list(self.mapped_outputs.keys())}")
        
        # For trigger nodes, use workflow input
        if node_type == "trigger":
            return self.workflow_context.get("input", {})
        
        # Find previous node(s) that lead to this node
        if len(self.execution_history) > 0:
            # The current node might already be in history with "running" status
            # So we need to look at the PREVIOUS completed node, not the last entry
            last_executed = None
            for i in range(len(self.execution_history) - 1, -1, -1):
                entry = self.execution_history[i]
                # Skip the current node if it's already in history
                if entry.get("node_id") == node_id:
                    continue
                # Found a previous node
                last_executed = entry
                break
            
            if last_executed is None:
                workflow.logger.info(f"⚠️ No previous executed node found, using workflow input")
                return self.workflow_context.get("input", {})
            
            last_node_id = last_executed.get("node_id")
            
            print(f"Last executed node_id: {last_node_id}")
            workflow.logger.info(f"🔍 _get_node_input: last_node_id={last_node_id}, has mapped_output={last_node_id in self.mapped_outputs}")
            
            # Check if we have mapped output for the previous node
            if last_node_id in self.mapped_outputs:
                previous_mapped = self.mapped_outputs[last_node_id]
                
                print(f"Found mapped output! Type: {type(previous_mapped)}")
                print(f"Mapped output value: {previous_mapped}")
                workflow.logger.info(f"🔍 Mapped output type: {type(previous_mapped)}, node_type: {previous_mapped.node_type}")
                
                # Use output mapper to extract appropriate input for current node
                extracted_input = output_mapper.extract_for_target(
                    output=previous_mapped,
                    target_node_type=node_type,
                    target_config=node_config
                )
                
                print(f"Extracted input: {extracted_input}")
                workflow.logger.info(f"🔄 Mapped input from {last_node_id} ({previous_mapped.node_type}) → {node_id} ({node_type})")
                workflow.logger.info(f"🔍 Extracted input: {extracted_input}")
                return extracted_input
            
            # Fallback to raw result
            raw_result = last_executed.get("result", {})
            workflow.logger.info(f"⚠️ No mapped output, using raw result: {raw_result}")
            return raw_result
        
        # Ultimate fallback: workflow input
        workflow.logger.info(f"⚠️ No execution history, using workflow input")
        return self.workflow_context.get("input", {})

    @workflow.run
    async def run(self, workflow_id: str, workflow_def: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main workflow execution entry point."""
        execution_id = workflow.info().workflow_id
        
        self.workflow_context = {
            "input": input_data,
            "workflow_id": workflow_id,
            "execution_id": execution_id,
        }
        self.node_outputs = {}
        self.execution_history = []
        self._paused = False
        self._approval_status = None
        self._approval_data = None
        
        # TODO: Re-enable ExecutionContext after fixing datetime serialization
        # self.execution_context = ExecutionContext(
        #     execution_id=execution_id,
        #     workflow_id=workflow_id,
        #     started_at=workflow.now()
        # )
        # self.execution_context.metadata["initial_input"] = input_data

        nodes: List[Dict] = workflow_def.get("nodes", [])
        edges: List[Dict] = workflow_def.get("edges", [])
        node_map = {node["id"]: node for node in nodes}

        workflow.logger.info(f"🚀 Starting workflow {workflow_id} (Execution ID: {workflow.info().workflow_id})")
        await self._publish_status("started")

        try:
            current_node_id = self._find_start_node_id(nodes)

            while current_node_id:
                # --- Pause Handling ---
                await workflow.wait_condition(lambda: not self._paused)

                node = node_map.get(current_node_id)
                if not node:
                    raise ApplicationError(f"Node '{current_node_id}' not found in definition.", non_retryable=True)

                node_type = node.get("type", "unknown")
                node_label = node.get("data", {}).get("label", current_node_id)

                # --- End Node Check ---
                if node_type == "end":
                    workflow.logger.info(f"🏁 Workflow reached end node: {node_label} ({current_node_id})")
                    break

                workflow.logger.info(f"⚡ Executing node: {node_label} ({current_node_id}, Type: {node_type})")
                await self._publish_node_event(current_node_id, node_type, "started")

                history_entry = {
                    "node_id": current_node_id,
                    "type": node_type,
                    "label": node_label, # Add label for better history
                    "start_time": workflow.now().isoformat(),
                    "end_time": None,
                    "status": "running",
                    "result": None,
                    "error": None,
                }
                self.execution_history.append(history_entry)

                try:
                    # --- Node Execution ---
                    result = await self._execute_node(node)

                    # --- Map Output to Schema ---
                    node_config = node.get("data", {}).get("config", {})
                    mapped_output = output_mapper.map_output(
                        node_type=node_type,
                        raw_output=result,
                        node_id=current_node_id,
                        node_config=node_config
                    )
                    self.mapped_outputs[current_node_id] = mapped_output
                    print(f"=== MAPPED OUTPUT STORED ===")
                    print(f"Node: {current_node_id} ({node_type})")
                    print(f"Mapped type: {type(mapped_output)}")
                    print(f"Mapped data: {mapped_output}")
                    print(f"All mapped_outputs keys: {list(self.mapped_outputs.keys())}")

                    # TODO: Re-enable ExecutionContext tracking
                    # node_metadata = {
                    #     "label": node_label,
                    #     "config": node_config,
                    #     "raw_output": result,
                    # }
                    # if isinstance(result, dict):
                    #     if "cost" in result:
                    #         node_metadata["cost"] = result["cost"]
                    #     if "tokens_used" in result:
                    #         node_metadata["tokens_used"] = result["tokens_used"]
                    # self.execution_context.add_node_execution(
                    #     node_id=current_node_id,
                    #     node_type=node_type,
                    #     output=mapped_output,
                    #     metadata=node_metadata,
                    #     timestamp=workflow.now()
                    # )

                    # --- Update State & History ---
                    self.node_outputs[current_node_id] = result
                    history_entry["result"] = result
                    history_entry["status"] = "success"
                    history_entry["end_time"] = workflow.now().isoformat()
                    await self._publish_node_event(current_node_id, node_type, "completed", result=result)

                    # --- Determine Next Node ---
                    current_node_id = self._get_next_node_id(node, edges, result)

                except ActivityError as e:
                    error_message = f"ActivityError in node {node_label} ({current_node_id}): {e.__cause__ or e}"
                    workflow.logger.error(f"❌ {error_message}")
                    history_entry["status"] = "failed"
                    history_entry["error"] = error_message
                    history_entry["end_time"] = workflow.now().isoformat()
                    await self._publish_node_event(current_node_id, node_type, "failed", error=error_message)

                    # --- Attempt Self-Healing (if applicable) ---
                    # if node_type == 'agent': # Example self-healing trigger
                    #     is_rerouted = await self._handle_agent_failure(node, nodes, edges)
                    #     if is_rerouted:
                    #         current_node_id = self._get_next_node_id(...) # Need refined logic here
                    #         continue # Skip compensation if rerouted successfully

                    # --- Trigger Compensation ---
                    await self._trigger_compensation(node_map)
                    await self._publish_status("failed", error=error_message)
                    raise ApplicationError(error_message) from e

                except Exception as e: # Includes ApplicationError from _execute_node logic
                    error_message = f"Error in node {node_label} ({current_node_id}): {e}"
                    workflow.logger.error(f"❌ {error_message}")
                    history_entry["status"] = "failed"
                    history_entry["error"] = error_message
                    history_entry["end_time"] = workflow.now().isoformat()
                    await self._publish_node_event(current_node_id, node_type, "failed", error=error_message)

                    # --- Trigger Compensation ---
                    await self._trigger_compensation(node_map)
                    await self._publish_status("failed", error=error_message)
                    raise

            # --- Workflow Completion ---
            # Use simple last node output for now (will add intelligent selection later)
            final_output = None
            if current_node_id and node_map.get(current_node_id, {}).get("type") == "end":
                end_node_config = node_map[current_node_id].get("data", {}).get("config", {})
                if end_node_config.get("capture_output", True):
                    # Get output from the last executed (non-end) node
                    if self.execution_history:
                        last_executed = self.execution_history[-1]
                        final_output = last_executed.get("result")
            else:
                # If no end node, use output from the last node
                final_output = self.node_outputs.get(current_node_id if current_node_id else self.execution_history[-1]["node_id"], None)
            
            workflow.logger.info(f"✅ Workflow {workflow_id} completed successfully. Final output: {final_output is not None}")
            await self._publish_status("completed", result=final_output)
            return {
                "status": "completed",
                "result": final_output,
                "execution_history": self.execution_history,
                "node_outputs": self.node_outputs
            }

        except Exception as e:
            # Catch failures during the main loop or compensation
            final_error = f"💥 Workflow failed: {str(e)}"
            workflow.logger.error(final_error)
            # Ensure final status is published even if compensation failed
            if not any(h["event_type"] == "workflow.failed" for h in self._get_internal_event_history()):
                 await self._publish_status("failed", error=str(e))
            return {
                "status": "failed",
                "error": str(e),
                "execution_history": self.execution_history,
                "node_outputs": self.node_outputs
            }

    async def _execute_node(self, node: Dict[str, Any]) -> Any:
        """Executes the appropriate activity based on node type."""
        node_type = node.get("type", "unknown")
        node_id = node.get("id", "")
        node_config = node.get("data", {}).get("config", {})

        # Get intelligent input from previous node using output mapper
        previous_output_data = self._get_node_input(node_id, node_type, node_config)

        # Prepare context to pass to activities
        activity_context = {
            **self.workflow_context,
            "node_outputs": self.node_outputs,
            "current_node_id": node_id,
            "previous_output": previous_output_data
        }

        # Define default retry policy
        retry_policy = DEFAULT_ACTIVITY_RETRY_POLICY

        # Default timeout
        timeout = timedelta(minutes=5)

        if node_type == "agent":
            timeout = timedelta(minutes=10)
            return await workflow.execute_activity(
                execute_agent_node, args=[node, activity_context],
                start_to_close_timeout=timeout, retry_policy=retry_policy
            )
        elif node_type == "api_call":
            timeout = timedelta(minutes=2)
            return await workflow.execute_activity(
                execute_api_call_node, args=[node, activity_context],
                start_to_close_timeout=timeout, retry_policy=retry_policy
            )
        elif node_type == "approval":
            timeout = timedelta(seconds=60)
            retry_policy=RetryPolicy(maximum_attempts=1) # Don't retry sending approval request usually
            await workflow.execute_activity(
                request_ui_approval, args=[node, activity_context],
                start_to_close_timeout=timeout, retry_policy=retry_policy
            )
            # Wait for the signal
            await workflow.wait_condition(lambda: self._approval_status is not None)
            approval_result = {"action": self._approval_status, **(self._approval_data or {})}
            # Reset for potential future approvals in the same workflow run
            self._approval_status = None
            self._approval_data = None
            return approval_result # Return the action ('approved'/'rejected') and any extra data

        elif node_type == "eval":
            timeout = timedelta(minutes=2)
            result = await workflow.execute_activity(
                execute_eval_node, args=[node, activity_context],
                start_to_close_timeout=timeout, retry_policy=retry_policy
            )
            if not result.get("passed", False):
                on_failure = node_config.get("on_failure", "block")
                reason = result.get('reason', 'Evaluation failed')
                if on_failure == "block":
                     raise ApplicationError(f"Eval failed: {reason}", non_retryable=True)
                elif on_failure == "compensate":
                    raise ApplicationError(f"Eval failed, triggering compensation: {reason}", non_retryable=True) # Will be caught by main loop
                elif on_failure == "retry":
                    raise ApplicationError(f"Eval failed, attempting retry: {reason}") # Will be retried if activity policy allows
            return result

        elif node_type == "timer":
            # ✅ Smart duration extraction
            duration = node_config.get("duration_seconds", 0)
            
            # Try to extract duration from previous output if not in config
            if duration == 0 and previous_output_data:
                if isinstance(previous_output_data, dict):
                    # Check for explicit delay_seconds field (from Output Mapper)
                    if "delay_seconds" in previous_output_data:
                        duration = previous_output_data["delay_seconds"]
                    # Check for agent output with time reference
                    elif "output" in previous_output_data:
                        text = previous_output_data["output"]
                        # Simple parsing for common patterns
                        import re
                        # Match "X seconds", "X minutes", "X hours"
                        match = re.search(r'(\d+)\s*(second|minute|hour)s?', text.lower())
                        if match:
                            value = int(match.group(1))
                            unit = match.group(2)
                            if unit == "minute":
                                duration = value * 60
                            elif unit == "hour":
                                duration = value * 3600
                            else:
                                duration = value
                            workflow.logger.info(f"⏰ Extracted duration from agent: {value} {unit}(s) = {duration}s")
            
            workflow.logger.info(f"⏰ Timer node starting {duration}s delay")
            if duration > 0:
                # Use Temporal's deterministic sleep
                await asyncio.sleep(duration)
                workflow.logger.info(f"⏰ Timer node completed {duration}s delay")
            return {"waited_seconds": duration, "completed_at": workflow.now().isoformat()}

        elif node_type == "event":
             timeout = timedelta(seconds=30)
             return await workflow.execute_activity(
                 execute_event_node, args=[node, activity_context],
                 start_to_close_timeout=timeout, retry_policy=RetryPolicy(maximum_attempts=2)
             )
        elif node_type == "merge":
            timeout = timedelta(seconds=60)
            return await workflow.execute_activity(
                execute_merge_node, args=[node, activity_context],
                start_to_close_timeout=timeout, retry_policy=RetryPolicy(maximum_attempts=1)
            )

        # --- Nodes handled by workflow logic, not activities ---
        elif node_type == "trigger":
            return self.workflow_context.get("input", {})
        elif node_type == "conditional":
            # Conditional logic happens in _get_next_node_id
            return {"status": "condition evaluated"}
        elif node_type == "end":
            return {"status": "workflow end"}

        else:
            raise ApplicationError(f"Unknown node type: {node_type}", non_retryable=True)

    async def _trigger_compensation(self, node_map: Dict[str, Dict]) -> None:
        """Triggers SAGA compensation for successfully completed nodes."""
        workflow.logger.info("🔄 Triggering compensation (rollback)")
        await self._publish_node_event(None, "workflow", "compensation.started")

        # Get successfully executed nodes in reverse order
        nodes_to_compensate = [
            h for h in reversed(self.execution_history) if h.get("status") == "success"
        ]

        compensation_futures = []
        for history_entry in nodes_to_compensate:
            node_id = history_entry.get("node_id")
            if not isinstance(node_id, str):
                continue
            node = node_map.get(node_id)
            if node:
                compensation_futures.append(
                    workflow.execute_activity(
                        compensate_node,
                        args=[node, self._get_full_state()],
                        start_to_close_timeout=timedelta(minutes=1),
                        retry_policy=RetryPolicy(maximum_attempts=2)
                    )
                )

        try:
            await asyncio.gather(*compensation_futures)
            workflow.logger.info("✅ Compensation completed successfully.")
            await self._publish_node_event(None, "workflow", "compensation.completed")
        except Exception as e:
            # Log failure but don't stop the workflow failure process
            workflow.logger.error(f"❌ Compensation failed for one or more nodes: {e}")
            await self._publish_node_event(None, "workflow", "compensation.failed", error=str(e))
            # Depending on requirements, you might want to raise here
            # raise ApplicationError("Compensation failed") from e


    def _find_start_node_id(self, nodes: List[Dict]) -> Optional[str]:
        """Finds the ID of the first 'trigger' node."""
        for node in nodes:
            if node.get("type") == "trigger":
                return node.get("id")
        # Fallback if no trigger node (should be validated earlier)
        return nodes[0].get("id") if nodes else None

    def _get_next_node_id(
        self,
        current_node: Dict[str, Any],
        edges: List[Dict],
        result: Any
    ) -> Optional[str]:
        """Determines the next node ID based on edges and node type logic."""
        current_id = current_node.get("id")
        node_type = current_node.get("type")

        # --- Conditional Logic ---
        if node_type == "conditional":
            condition_expr = current_node.get("data", {}).get("config", {}).get("condition_expression", "False")
            try:
                # Evaluate expression safely using workflow state
                condition_eval = self._evaluate_condition(condition_expr, result)
                workflow.logger.info(f"Condition '{condition_expr}' evaluated to {condition_eval}")
            except Exception as e:
                workflow.logger.warning(f"Failed to evaluate condition '{condition_expr}': {e}. Defaulting to false.")
                condition_eval = False

            handle_id = 'true' if condition_eval else 'false'
            edge = next((e for e in edges if e.get("source") == current_id and e.get("sourceHandle") == handle_id), None)
            return edge.get("target") if edge else None

        # --- Approval Logic ---
        elif node_type == "approval":
            # 'result' contains {'action': 'approved'|'rejected', ...}
            action = result.get("action", "rejected")
            handle_id = 'approve' if action == "approved" else 'reject'
            edge = next((e for e in edges if e.get("source") == current_id and e.get("sourceHandle") == handle_id), None)
            return edge.get("target") if edge else None

        # --- Default Logic (Follow the first outgoing edge) ---
        else:
            outgoing_edges = [e for e in edges if e.get("source") == current_id]
            if not outgoing_edges:
                return None
            if len(outgoing_edges) > 1:
                 workflow.logger.warning(f"Node {current_id} has multiple outgoing edges but isn't a Conditional/Approval. Following the first edge.")
            return outgoing_edges[0].get("target")

    def _evaluate_condition(self, expression: str, current_result: Any) -> bool:
        """
        Safely evaluates a Python condition expression.
        Uses a limited context to prevent unsafe operations.
        """
        # Context includes node outputs and initial input
        context = {
            "output": current_result, # Result of the *immediately preceding* node
            "nodes": self.node_outputs, # Outputs of *all completed* nodes by ID
            "input": self.workflow_context.get("input"), # Initial workflow input
        }
        # Allowed builtins (extend carefully)
        safe_builtins = {
            "True": True, "False": False, "None": None,
            "len": len, "str": str, "int": int, "float": float, "list": list, "dict": dict,
            "abs": abs, "round": round, "max": max, "min": min, "sum": sum, "any": any, "all": all,
        }
        try:
            # Evaluate using a restricted global and local scope
            # Note: eval() still has risks if expression is user-controlled; consider safer alternatives if needed.
            return bool(eval(expression, {"__builtins__": safe_builtins}, context))
        except Exception as e:
            workflow.logger.error(f"Error evaluating condition '{expression}': {e}")
            return False # Default to False on error

    async def _publish_status(self, status: str, result: Optional[Any] = None, error: Optional[str] = None):
        """Helper to publish workflow-level status events."""
        await workflow.execute_activity(
            publish_workflow_status,
            args=[
                workflow.info().workflow_id,
                self.workflow_context["workflow_id"],
                status,
                result,
                error
            ],
            start_to_close_timeout=timedelta(seconds=10),
            retry_policy=RetryPolicy(maximum_attempts=2),
        )

    async def _publish_node_event(self, node_id: Optional[str], node_type: str, event_suffix: str,      result: Optional[Any] = None, error: Optional[str] = None):
        """Helper to publish node-level events via an activity."""
        # We use an activity here to interact with the external event bus
        event_type = f"node.{event_suffix}"
        if node_type == "workflow": # For compensation events etc.
             event_type = f"workflow.{event_suffix}"

        data = {
            "workflow_id": self.workflow_context["workflow_id"],
            "execution_id": self.workflow_context["execution_id"],
            "node_id": node_id,
            "node_type": node_type,
            "result": result,
            "error": error,
            "timestamp": workflow.now().isoformat() # Add timestamp
        }
        # Using publish_workflow_status activity for simplicity, could create a dedicated one
        await workflow.execute_activity(
            "publish_generic_event", # Assuming a generic activity exists or reusing publish_workflow_status
            args=[event_type, data],
            start_to_close_timeout=timedelta(seconds=10),
            retry_policy=RetryPolicy(maximum_attempts=2),
        )



    @workflow.signal(name="approval_signal")
    def approval_signal(self, data: dict) -> None:
        self._approval_status = data.get("action")
        self._approval_data = data

    @workflow.signal(name="pause")
    def pause(self) -> None:
        self._paused = True

    @workflow.signal(name="resume")
    def resume(self) -> None:
        self._paused = False


    # --- Queries ---
    @workflow.query
    def get_state(self) -> Dict[str, Any]:
        """Returns the current state of the workflow."""
        return {
            "workflow_context": self.workflow_context,
            "node_outputs": self.node_outputs,
            "execution_history": self.execution_history,
            "is_paused": self._paused,
            "is_waiting_approval": self._approval_status is None and any(h['type'] == 'approval' and h['status'] == 'running' for h in self.execution_history)
        }

    @workflow.query
    def get_execution_history(self) -> List[Dict[str, Any]]:
        """Returns the detailed execution history."""
        return self.execution_history

    @workflow.query
    def is_paused(self) -> bool:
        """Checks if the workflow is currently paused."""
        return self._paused

    def _get_internal_event_history(self) -> List[Dict[str, Any]]:
        """Utility to access Temporal's internal event history if needed (debugging)."""
        # This is illustrative; direct access might not be standard/easy.
        # Typically rely on emitted signals/events or workflow state.
        return [] # Placeholder

