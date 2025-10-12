from temporalio import workflow
from datetime import timedelta
from typing import Dict, Any


@workflow.defn
class OrchestrationWorkflow:
    def __init__(self):
        self.current_state: Dict[str, Any] = {}
        self.approval_received = False
        self.approval_data = None

        # Instance-level activity stubs (must be here, not at class level)
        self.execute_agent_node = workflow.activity_stub(
            name="execute_agent_node",
            start_to_close_timeout=timedelta(seconds=300),
        )
        self.execute_http_request = workflow.activity_stub(
            name="execute_http_request",
            start_to_close_timeout=timedelta(seconds=60),
        )
        self.send_approval_request = workflow.activity_stub(
            name="send_approval_request",
            start_to_close_timeout=timedelta(seconds=30),
        )

    @workflow.run
    async def run(self, workflow_id: str, workflow_def: dict, input_data: dict):
        self.current_state = {"input": input_data}
        nodes = workflow_def["nodes"]
        edges = workflow_def["edges"]
        current_node_id = self._find_start_node(nodes)

        while current_node_id:
            node = self._get_node(nodes, current_node_id)

            if node["type"] == "agent":
                result = await self.execute_agent_node(node, self.current_state)
                self.current_state[node["id"]] = result

            elif node["type"] == "approval":
                workflow.logger.info(f"⏸️  Waiting for approval: {node['id']}")
                await self.send_approval_request(workflow_id, node)
                await workflow.wait_condition(
                    lambda: self.approval_received, timeout=timedelta(hours=24)
                )
                self.current_state[node["id"]] = self.approval_data
                self.approval_received = False

            elif node["type"] == "http":
                result = await self.execute_http_request(node, self.current_state)
                self.current_state[node["id"]] = result

            current_node_id = self._get_next_node(edges, current_node_id, self.current_state)

        return self.current_state

    @workflow.signal
    async def approve(self, approval_data: dict):
        """Signal to resume workflow after approval"""
        self.approval_data = approval_data
        self.approval_received = True

    @workflow.query
    def get_state(self) -> dict:
        """Query current workflow state"""
        return self.current_state

    def _find_start_node(self, nodes):
        for node in nodes:
            if node["type"] == "trigger":
                return node["id"]
        return nodes[0]["id"] if nodes else None

    def _get_node(self, nodes, node_id):
        return next((n for n in nodes if n["id"] == node_id), None)

    def _get_next_node(self, edges, current_id, state):
        next_edges = [e for e in edges if e["source"] == current_id]
        if not next_edges:
            return None

        for edge in next_edges:
            if "condition" in edge:
                if self._evaluate_condition(edge["condition"], state):
                    return edge["target"]
            else:
                return edge["target"]

        return None

    def _evaluate_condition(self, condition, state):
        field_value = state.get(condition["field"])
        operator = condition["operator"]
        expected = condition["value"]

        if operator == "==":
            return field_value == expected
        elif operator == "!=":
            return field_value != expected

        return True
