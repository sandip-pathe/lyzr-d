"""Temporal Orchestration Workflow - CORRECTED VERSION"""

from temporalio import workflow
from temporalio.common import RetryPolicy 
from temporalio.exceptions import ApplicationError, ActivityError
from datetime import timedelta
from typing import Dict, Any, List, Optional


with workflow.unsafe.imports_passed_through():
    from app.temporal.activities import (
        execute_agent_node,
        execute_http_request,
        send_approval_request,
        execute_eval_node,
        execute_fork_node,
        execute_merge_node,
        execute_timer_node,
        execute_event_node,
        execute_meta_node,
        publish_workflow_status,
        compensate_node,
        get_fallback_agent,
    )
    from app.services.agent_executor import AgentExecutor


@workflow.defn
class OrchestrationWorkflow:
    """
    Main orchestration workflow with support for:
    - Dynamic node execution (agent, action, approval, eval, fork, merge, timer, event, meta)
    - SAGA compensation pattern
    - Pause/Resume control
    - Parallel branches (fork/merge)
    - Conditional routing
    """

    def __init__(self):
        self.current_state: Dict[str, Any] = {}
        self.approval_received = False
        self.approval_data: Optional[Dict[str, Any]] = None
        self.paused = False
        self.execution_history: List[Dict[str, Any]] = []

    @workflow.run
    async def run(self, workflow_id: str, workflow_def: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main workflow execution entry point"""
        self.current_state = {
            "input": input_data,
            "workflow_id": workflow_id,
            "execution_id": workflow.info().workflow_id,
            "execution_history": []
        }

        nodes = workflow_def.get("nodes", [])
        edges = workflow_def.get("edges", [])

        workflow.logger.info(f"🚀 Starting workflow {workflow_id}")

        try:
            current_node_id = self._find_start_node(nodes)

            while current_node_id:
                # Check if paused - wait for resume signal
                await workflow.wait_condition(lambda: not self.paused)

                node = self._find_node(nodes, current_node_id)
                if not node:
                    break

                node_type = node.get("type", "unknown")
                if node_type == "end":
                    workflow.logger.info(f"Workflow ended at node: {current_node_id}")
                    break

                workflow.logger.info(f"⚡ Executing node: {current_node_id} (type: {node_type})")

                try:
                    # Execute node based on type
                    result = await self._execute_node(node, nodes, edges)

                    # Record successful execution
                    self.execution_history.append({
                        "node_id": current_node_id,
                        "type": node_type,
                        "result": result,
                        "status": "success"
                    })

                    # Update state
                    self.current_state["previous_output"] = result
                    self.current_state[current_node_id] = result

                    # Determine next node
                    current_node_id = await self._get_next_node(node, edges, result)

                except ActivityError as e:
                    workflow.logger.error(f"❌ Node {current_node_id} failed with ActivityError: {str(e)}")

                    if node_type == 'agent':
                        is_rerouted = await self._handle_agent_failure(node, nodes, edges)
                        if is_rerouted:
                            current_node_id = self.current_state.get("next_node_id")
                            continue

                    self.execution_history.append({
                        "node_id": current_node_id,
                        "type": node_type,
                        "error": str(e),
                        "status": "failed"
                    })
                    await self._trigger_compensation(nodes)
                    raise

                except Exception as e:
                    workflow.logger.error(f"❌ Node {current_node_id} failed: {str(e)}")

                    # Record failure
                    self.execution_history.append({
                        "node_id": current_node_id,
                        "type": node_type,
                        "error": str(e),
                        "status": "failed"
                    })

                    # Trigger SAGA compensation (rollback)
                    await self._trigger_compensation(nodes)
                    raise

            # Publish completion event
            await workflow.execute_activity(
                publish_workflow_status,
                args=[workflow.info().workflow_id, workflow_id, "completed", self.current_state.get("previous_output")],
                start_to_close_timeout=timedelta(seconds=10),
            )

            return {
                "status": "completed",
                "result": self.current_state.get("previous_output"),
                "execution_history": self.execution_history
            }

        except Exception as e:
            workflow.logger.error(f"💥 Workflow failed: {str(e)}")
            # Publish failure event
            await workflow.execute_activity(
                publish_workflow_status,
                args=[workflow.info().workflow_id, workflow_id, "failed", None, str(e)],
                start_to_close_timeout=timedelta(seconds=10),
            )
            return {
                "status": "failed",
                "error": str(e),
                "execution_history": self.execution_history
            }

    async def _execute_node(self, node: Dict[str, Any], nodes: List[Dict], edges: List[Dict]) -> Any:
        """Execute a single node based on its type"""

        node_type = node.get("type", "unknown")
        node_id = node.get("id", "")

        execution_context = {
            **self.current_state,
            "current_node_id": node_id
        }

        if node_type == "agent":
            return await workflow.execute_activity(
                execute_agent_node,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(seconds=300),
                retry_policy=RetryPolicy(
                    maximum_attempts=3,
                    initial_interval=timedelta(seconds=1),
                    maximum_interval=timedelta(seconds=10),
                    backoff_coefficient=2.0
                )
            )

        elif node_type == "api_call":
            return await workflow.execute_activity(
                execute_http_request,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(seconds=60),
                retry_policy=RetryPolicy(maximum_attempts=3)
            )
        elif node_type == "approval":
            from app.temporal.activities import request_ui_approval
            await workflow.execute_activity(
                request_ui_approval,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(seconds=30)
            )

            await workflow.wait_condition(lambda: self.approval_received)

            self.approval_received = False # Reset for next approval
            return self.approval_data

        elif node_type == "conditional":
            # This node type doesn't execute an activity.
            # Its logic is handled in the _get_next_node method.
            workflow.logger.info(f"Evaluating conditions for node {node_id}")
            return {"status": "conditions evaluated"}

        elif node_type == "eval":
            result = await workflow.execute_activity(
                execute_eval_node,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(seconds=120)
            )

            # Handle evaluation failure
            if not result.get("passed", False):
                on_failure = node.get("data", {}).get("on_failure", "block")

                if on_failure == "compensate":
                    await self._trigger_compensation(nodes)
                    raise ApplicationError("Eval failed, compensation triggered")
                elif on_failure == "retry":
                    raise ApplicationError("Eval failed, triggering retry")
                elif on_failure == "block":
                    raise ApplicationError(f"Eval failed: {result.get('reason', 'Unknown')}")

            return result

        elif node_type == "fork":
            return {"status": "forked"}


        elif node_type == "merge":
            return await workflow.execute_activity(
                execute_merge_node,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(seconds=30)
            )

        elif node_type == "event":
            return await workflow.execute_activity(
                execute_event_node,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(seconds=30)
            )

        elif node_type == "meta":
            return await workflow.execute_activity(
                execute_meta_node,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(seconds=30)
            )

        elif node_type == "trigger":
            return {"triggered": True, "timestamp": workflow.now().isoformat()}

        else:
            raise ApplicationError(
                f"Unknown node type: {node_type}",
                non_retryable=True
            )

    async def _execute_branch(
        self, 
        branch_node_ids: List[str], 
        all_nodes: List[Dict], 
        edges: List[Dict]
    ) -> Any:
        """Execute a branch (sequence of nodes) with isolated state"""
        
        branch_state = dict(self.current_state)
        result = None

        for node_id in branch_node_ids:
            node = self._find_node(all_nodes, node_id)
            if node:
                # Execute node with branch-specific state
                result = await self._execute_node(node, all_nodes, edges)
                branch_state["previous_output"] = result

        return result

    async def _handle_agent_failure(self, failed_node: Dict[str, Any], nodes: List[Dict], edges: List[Dict]) -> bool:
            """Attempt to self-heal by finding a fallback agent."""
            workflow.logger.info(f"Attempting self-healing for agent node: {failed_node.get('id')}")
            node_data = failed_node.get("data", {})
            provider = node_data.get("config", {}).get("provider")
            failed_agent_id = node_data.get("config", {}).get("agent_id")

            # Get all agent IDs for the same provider from the workflow definition
            all_agent_ids = [
                n.get("data", {}).get("config", {}).get("agent_id")
                for n in nodes
                if n.get("type") == "agent" and n.get("data", {}).get("config", {}).get("provider") == provider
            ]

            fallback_agent_id = await workflow.execute_activity(
                get_fallback_agent,
                args=[provider, failed_agent_id, all_agent_ids],
                start_to_close_timeout=timedelta(seconds=30),
            )

            if fallback_agent_id:
                workflow.logger.info(f"Found fallback agent: {fallback_agent_id}. Rerouting.")
                # Create a new, temporary node definition for the fallback agent
                fallback_node = failed_node.copy()
                fallback_node["data"]["config"]["agent_id"] = fallback_agent_id

                # Re-execute with the fallback
                try:
                    result = await self._execute_node(fallback_node, nodes, edges)
                    self.execution_history.append({
                        "node_id": failed_node.get("id"),
                        "type": "agent",
                        "result": result,
                        "status": "success",
                        "is_fallback": True,
                        "original_agent": failed_agent_id,
                        "fallback_agent": fallback_agent_id
                    })
                    self.current_state["previous_output"] = result
                    node_id = failed_node.get("id") or ""
                    self.current_state[node_id] = result
                    self.current_state["next_node_id"] = await self._get_next_node(failed_node, edges, result)
                    return True
                except Exception as e:
                    workflow.logger.error(f"Fallback agent {fallback_agent_id} also failed: {e}")
                    return False
            else:
                workflow.logger.warning("No fallback agent found.")
                return False

    async def _trigger_compensation(self, nodes: List[Dict]) -> None:
        """
        Trigger SAGA compensation pattern - rollback executed nodes in reverse order
        """

        workflow.logger.info("🔄 Triggering compensation (rollback)")

        # Get successfully executed nodes in reverse order
        successful_nodes = [
            h for h in self.execution_history
            if h.get("status") == "success"
        ]
        successful_nodes.reverse()

        for history_entry in successful_nodes:
            node_id = history_entry.get("node_id", "")
            node = self._find_node(nodes, node_id)

            if node:
                try:
                    workflow.logger.info(f"⏪ Compensating node: {node_id}")
                    await workflow.execute_activity(
                        compensate_node,
                        args=[node, self.current_state],
                        start_to_close_timeout=timedelta(seconds=60)
                    )

                except Exception as e:
                    workflow.logger.error(f"Compensation failed for {node_id}: {e}")

    async def _get_next_node(
        self,
        current_node: Dict[str, Any],
        edges: List[Dict],
        result: Any
    ) -> Optional[str]:
        """Determine next node based on edges and conditions"""

        current_id = current_node.get("id", "")
        node_type = current_node.get("type")

        if node_type == "conditional":
            condition_str = current_node.get("data", {}).get("config", {}).get("condition", "False")
            condition_eval = self._evaluate_condition(condition_str, result)
            handle_id = 'true' if condition_eval else 'false'
            edge = next((e for e in edges if e.get("source") == current_id and e.get("sourceHandle") == handle_id), None)
            return edge.get("target") if edge else None

        if node_type == "approval":
            action = result.get("action", "reject")
            handle_id = 'approve' if action == "approve" else 'reject'
            edge = next((e for e in edges if e.get("source") == current_id and e.get("sourceHandle") == handle_id), None)
            return edge.get("target") if edge else None

        if node_type == "fork":
            outgoing_edges = [e.get("target") for e in edges if e.get("source") == current_id]
            return outgoing_edges[0] if outgoing_edges else None

        outgoing_edges = [e for e in edges if e.get("source") == current_id]

        if not outgoing_edges:
            return None
        return outgoing_edges[0].get("target")

    def _evaluate_condition(self, condition: str, data: Any) -> bool:
        """Safely evaluate edge condition"""
        try:
            context = {
                "output": data,
                "state": self.current_state,
                "__builtins__": {"True": True, "False": False, "None": None, "len": len}
            }
            return bool(eval(condition, context, {}))
        except:
            return False

    def _find_node(self, nodes: List[Dict], node_id: str) -> Optional[Dict]:
        """Find node by ID"""
        return next((n for n in nodes if n.get("id") == node_id), None)

    def _find_start_node(self, nodes: List[Dict]) -> Optional[str]:
        """Find the trigger/start node"""
        for node in nodes:
            if node.get("type") == "trigger":
                return node.get("id")
        return nodes[0].get("id") if nodes else None

    @workflow.signal
    async def approve(self, approval_data: Dict[str, Any]) -> None:
        """Signal to approve HITL checkpoint"""
        self.approval_data = approval_data
        self.approval_received = True
        workflow.logger.info("✅ Approval received")

    @workflow.signal
    async def reject(self, rejection_reason: str) -> None:
        """Signal to reject HITL checkpoint"""
        self.approval_data = {"approved": False, "reason": rejection_reason}
        self.approval_received = True
        workflow.logger.info(f"❌ Approval rejected: {rejection_reason}")

    @workflow.signal
    async def pause(self) -> None:
        """Pause workflow execution"""
        self.paused = True
        workflow.logger.info("⏸️ Workflow paused")

    @workflow.signal
    async def resume(self) -> None:
        """Resume workflow execution"""
        self.paused = False
        workflow.logger.info("▶️ Workflow resumed")

    @workflow.query
    def get_state(self) -> Dict[str, Any]:
        """Query current workflow state"""
        return {
            "current_state": self.current_state,
            "execution_history": self.execution_history,
            "paused": self.paused,
            "approval_pending": not self.approval_received if self.approval_data else False
        }

    @workflow.query
    def get_execution_history(self) -> List[Dict[str, Any]]:
        """Query execution history"""
        return self.execution_history

    @workflow.query
    def is_paused(self) -> bool:
        """Check if workflow is paused"""
        return self.paused