from typing import List, Dict, Any

def validate_workflow(workflow_definition: Dict[str, Any]) -> List[str]:
    """
    Validates a workflow to ensure all nodes are correctly configured and connected.
    """
    errors = []
    nodes = workflow_definition.get("nodes", [])
    edges = workflow_definition.get("edges", [])
    node_ids = {node.get("id") for node in nodes}

    if not any(node.get("type") == "trigger" for node in nodes):
        errors.append("Workflow must have at least one trigger node.")

    for node in nodes:
        node_id = node.get("id")
        node_type = node.get("type")
        node_data = node.get("data", {})
        config = node_data.get("config", {})

        if not node_id or not node_type:
            errors.append(f"Node is missing an ID or type: {node}")
            continue

        # Basic connectivity check
        if node_type != "trigger" and not any(edge.get("target") == node_id for edge in edges):
             errors.append(f"Node '{node_id}' has no incoming connections.")
        if not any(edge.get("source") == node_id for edge in edges) and node_type != 'action':
             errors.append(f"Node '{node_id}' has no outgoing connections.")

        # Type-specific validation
        if node_type == "agent":
            if not config.get("provider") or not config.get("agent_id"):
                errors.append(f"AgentNode '{node_id}' is missing a provider or agent_id.")
        
        elif node_type == "action":
            if not config.get("url"):
                errors.append(f"ActionNode '{node_id}' is missing a URL.")

        elif node_type == "approval":
            if not config.get("approvers"):
                errors.append(f"ApprovalNode '{node_id}' has no approvers configured.")

        elif node_type == "eval":
            if not config.get("eval_type"):
                errors.append(f"EvalNode '{node_id}' is missing an evaluation type.")

    for edge in edges:
        if edge.get("source") not in node_ids:
            errors.append(f"Edge '{edge.get('id')}' references a non-existent source node '{edge.get('source')}'.")
        if edge.get("target") not in node_ids:
            errors.append(f"Edge '{edge.get('id')}' references a non-existent target node '{edge.get('target')}'.")

    return errors