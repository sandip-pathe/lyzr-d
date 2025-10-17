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
        errors.append("Workflow must have at least one 'trigger' node.")

    for node in nodes:
        node_id = node.get("id")
        node_type = node.get("type")
        node_data = node.get("data", {})
        config = node_data.get("config", {})
        label = node_data.get("label", node_id)

        if not node_id or not node_type:
            errors.append(f"A node is missing an ID or type: {node}")
            continue

        # Connectivity checks
        has_incoming = any(edge.get("target") == node_id for edge in edges)
        has_outgoing = any(edge.get("source") == node_id for edge in edges)

        if node_type != "trigger" and not has_incoming:
            errors.append(f"Node '{label}' has no incoming connections.")
        
        if node_type not in ["end", "api_call", "agent"] and not has_outgoing:
            errors.append(f"Node '{label}' has no outgoing connections.")

        # Type-specific validation
        if node_type == "agent":
            # This check seems to be handled on the frontend now, but left for safety
            pass
        
        elif node_type == "api_call":
            if not config.get("url"):
                errors.append(f"API Call node '{label}' is missing a URL.")

        elif node_type == "approval":
            if not config.get("prompt"):
                errors.append(f"Approval node '{label}' has no prompt configured.")

        elif node_type == "eval":
            if not config.get("eval_type"):
                errors.append(f"Eval node '{label}' is missing an evaluation type.")

    for edge in edges:
        if edge.get("source") not in node_ids:
            errors.append(f"Edge '{edge.get('id')}' references a non-existent source node '{edge.get('source')}'.")
        if edge.get("target") not in node_ids:
            errors.append(f"Edge '{edge.get('id')}' references a non-existent target node '{edge.get('target')}'.")

    return errors