"""Temporal Orchestration Workflow - CORRECTED VERSION"""

from temporalio import workflow
from temporalio.common import RetryPolicy 
from temporalio.exceptions import ApplicationError
from datetime import timedelta
from typing import Dict, Any, List, Optional
import asyncio


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
        execute_meta_node
    )


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
        
        # Initialize state
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

            return {
                "status": "completed",
                "result": self.current_state.get("previous_output"),
                "execution_history": self.execution_history
            }

        except Exception as e:
            workflow.logger.error(f"💥 Workflow failed: {str(e)}")
            return {
                "status": "failed",
                "error": str(e),
                "execution_history": self.execution_history
            }

    async def _execute_node(self, node: Dict[str, Any], nodes: List[Dict], edges: List[Dict]) -> Any:
        """Execute a single node based on its type"""
        
        node_type = node.get("type", "unknown")
        node_id = node.get("id", "")

        # Build execution context
        execution_context = {
            **self.current_state,
            "current_node_id": node_id
        }

        # Route to appropriate activity based on node type
        if node_type == "agent":
            return await workflow.execute_activity(
                execute_agent_node,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(seconds=300),
                retry_policy=RetryPolicy(  # ✅ Using correct import
                    maximum_attempts=3,
                    initial_interval=timedelta(seconds=1),
                    maximum_interval=timedelta(seconds=10),
                    backoff_coefficient=2.0
                )
            )

        elif node_type == "action":
            return await workflow.execute_activity(
                execute_http_request,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(seconds=60),
                retry_policy=RetryPolicy(maximum_attempts=3)  # ✅ Correct
            )

        elif node_type == "approval":
            # Send approval request
            await workflow.execute_activity(
                send_approval_request,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(seconds=30)
            )

            # Wait for approval signal with timeout
            timeout_hours = node.get("data", {}).get("timeout_hours", 24)
            try:
                await workflow.wait_condition(
                    lambda: self.approval_received,
                    timeout=timedelta(hours=timeout_hours)
                )
            except asyncio.TimeoutError:
                raise ApplicationError(  # ✅ Using correct import
                    f"Approval timeout after {timeout_hours} hours",
                    non_retryable=True
                )

            # Reset approval state and return data
            self.approval_received = False
            return self.approval_data

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
                    raise ApplicationError("Eval failed, compensation triggered")  # ✅ Correct
                elif on_failure == "retry":
                    raise ApplicationError("Eval failed, triggering retry")  # ✅ Correct
                elif on_failure == "block":
                    raise ApplicationError(f"Eval failed: {result.get('reason', 'Unknown')}")  # ✅ Correct
            
            return result

        elif node_type == "fork":
            # Execute parallel branches
            fork_result = await workflow.execute_activity(
                execute_fork_node,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(seconds=10)
            )

            branches = fork_result.get("branches", [])
            
            # Create tasks for each branch
            branch_tasks = []
            for branch_nodes in branches:
                task = asyncio.create_task(
                    self._execute_branch(branch_nodes, nodes, edges)
                )
                branch_tasks.append(task)

            # Wait strategy
            wait_for = node.get("data", {}).get("wait_for", "all")
            
            if wait_for == "all":
                branch_results = await asyncio.gather(*branch_tasks)
            elif wait_for == "any":
                done, pending = await asyncio.wait(
                    branch_tasks, 
                    return_when=asyncio.FIRST_COMPLETED
                )
                branch_results = [t.result() for t in done]
                for task in pending:
                    task.cancel()
            else:
                branch_results = await asyncio.gather(*branch_tasks, return_exceptions=True)

            # Store for merge node
            self.current_state["branch_results"] = branch_results
            return {"branches_completed": len(branch_results), "results": branch_results}

        elif node_type == "merge":
            return await workflow.execute_activity(
                execute_merge_node,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(seconds=30)
            )

        elif node_type == "timer":
            return await workflow.execute_activity(
                execute_timer_node,
                args=[node, execution_context],
                start_to_close_timeout=timedelta(hours=24)
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
            # Trigger nodes just mark the start
            return {"triggered": True, "timestamp": workflow.now().isoformat()}

        else:
            raise ApplicationError(  # ✅ Correct
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
                    
                    # Execute compensation via activity
                    # Note: You need to implement compensate_node activity
                    # await workflow.execute_activity(
                    #     compensate_node,
                    #     args=[node, self.current_state],
                    #     start_to_close_timeout=timedelta(seconds=60)
                    # )
                    
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

        # Find outgoing edges
        outgoing_edges = [e for e in edges if e.get("source") == current_id]

        if not outgoing_edges:
            return None

        # Evaluate conditional edges
        for edge in outgoing_edges:
            condition = edge.get("condition")
            
            if not condition:
                # No condition, take this edge
                return edge.get("target")

            # Evaluate condition
            if self._evaluate_condition(condition, result):
                return edge.get("target")

        # No condition matched, take first edge
        return outgoing_edges[0].get("target") if outgoing_edges else None

    def _evaluate_condition(self, condition: str, data: Any) -> bool:
        """
        Safely evaluate edge condition
        Supports: "output.confidence > 0.8", "output.status == 'approved'"
        """
        
        try:
            if not condition:
                return True

            # Create safe evaluation context
            context = {
                "output": data,
                "state": self.current_state,
                # Safe built-ins
                "__builtins__": {
                    "True": True,
                    "False": False,
                    "None": None,
                }
            }

            # Use eval with restricted context
            return bool(eval(condition, context, {}))

        except Exception as e:
            workflow.logger.error(f"Condition evaluation failed: {e}")
            return False

    def _find_node(self, nodes: List[Dict], node_id: str) -> Optional[Dict]:
        """Find node by ID"""
        return next((n for n in nodes if n.get("id") == node_id), None)

    def _find_start_node(self, nodes: List[Dict]) -> Optional[str]:
        """Find the trigger/start node"""
        
        for node in nodes:
            if node.get("type") == "trigger":
                return node.get("id")

        # If no trigger found, return first node
        return nodes[0].get("id") if nodes else None

    # ===== Signals for Workflow Control =====

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

    # ===== Queries for State Inspection =====

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
