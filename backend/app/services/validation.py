# backend/app/services/validation.py

from typing import List, Dict, Any

def validate_workflow(workflow_definition: Dict[str, Any]) -> List[str]:
    """
    Validates a workflow to ensure all nodes are correctly configured and connected,
    including checks for required source handles.
    """
    errors = []
    nodes = workflow_definition.get("nodes", [])
    edges = workflow_definition.get("edges", [])
    node_ids = {node.get("id") for node in nodes}
    node_map = {node.get("id"): node for node in nodes} # For easier lookup

    if not any(node.get("type") == "trigger" for node in nodes):
        errors.append("Workflow must have at least one 'trigger' node.")
    if not any(node.get("type") == "end" for node in nodes):
         errors.append("Workflow must have at least one 'end' node.")

    # Check for orphaned nodes (nodes with no connections unless trigger/end)
    connected_node_ids = set()
    for edge in edges:
        connected_node_ids.add(edge.get("source"))
        connected_node_ids.add(edge.get("target"))

    for node in nodes:
        node_id = node.get("id")
        node_type = node.get("type")
        label = node.get("data", {}).get("label", node_id)

        if node_type not in ["trigger", "end"] and node_id not in connected_node_ids:
             # Allow disconnected nodes if explicitly configured? For now, flag them.
             errors.append(f"Node '{label}' ({node_id}) is not connected to the workflow.")


    for node in nodes:
        node_id = node.get("id")
        node_type = node.get("type")
        node_data = node.get("data", {})
        config = node_data.get("config", {})
        label = node_data.get("label", node_id)

        if not node_id or not node_type:
            errors.append(f"A node is missing an ID or type: {node}")
            continue

        outgoing_edges = [edge for edge in edges if edge.get("source") == node_id]
        incoming_edges = [edge for edge in edges if edge.get("target") == node_id]

        # Connectivity checks
        if node_type != "trigger" and not incoming_edges:
            errors.append(f"Node '{label}' ({node_id}) has no incoming connections.")

        # Only require outgoing connections if node is not an end node AND it's not intentionally terminal
        # Allow nodes to terminate workflow if they don't have outgoing edges
        # if node_type != "end" and not outgoing_edges:
        #     errors.append(f"Node '{label}' ({node_id}) has no outgoing connections.")

        # Type-specific validation
        if node_type == "api_call":
            if not config.get("url"):
                errors.append(f"API Call node '{label}' ({node_id}) is missing a URL.")
            if not config.get("method"):
                 errors.append(f"API Call node '{label}' ({node_id}) is missing an HTTP method.")

        elif node_type == "approval":
            if not config.get("description"):
                errors.append(f"Approval node '{label}' ({node_id}) has no description configured.")
            if not config.get("approvers"):
                 errors.append(f"Approval node '{label}' ({node_id}) has no approvers configured.")
            # Check for required outgoing handles
            handles = {edge.get("sourceHandle") for edge in outgoing_edges}
            if "approve" not in handles:
                errors.append(f"Approval node '{label}' ({node_id}) is missing an outgoing connection for the 'approve' case.")
            if "reject" not in handles:
                errors.append(f"Approval node '{label}' ({node_id}) is missing an outgoing connection for the 'reject' case.")

        elif node_type == "conditional":
            if not config.get("condition_expression"):
                 errors.append(f"Conditional node '{label}' ({node_id}) is missing a condition expression.")
            # Check for required outgoing handles
            handles = {edge.get("sourceHandle") for edge in outgoing_edges}
            if "true" not in handles:
                errors.append(f"Conditional node '{label}' ({node_id}) is missing an outgoing connection for the 'true' case.")
            if "false" not in handles:
                errors.append(f"Conditional node '{label}' ({node_id}) is missing an outgoing connection for the 'false' case.")

        elif node_type == "eval":
            if not config.get("eval_type"):
                errors.append(f"Eval node '{label}' ({node_id}) is missing an evaluation type.")
            if not config.get("config"):
                 errors.append(f"Eval node '{label}' ({node_id}) is missing the specific 'config' block for its type.")

        elif node_type == "merge":
             if not incoming_edges or len(incoming_edges) < 2:
                  errors.append(f"Merge node '{label}' ({node_id}) must have at least two incoming connections.")

        elif node_type == "fork":
            if not outgoing_edges or len(outgoing_edges) < 2:
                  errors.append(f"Fork node '{label}' ({node_id}) must have at least two outgoing connections.")

    # Edge validation
    for edge in edges:
        source_id = edge.get("source")
        target_id = edge.get("target")
        source_handle = edge.get("sourceHandle")

        if source_id not in node_ids:
            errors.append(f"Edge '{edge.get('id')}' references a non-existent source node '{source_id}'.")
        if target_id not in node_ids:
            errors.append(f"Edge '{edge.get('id')}' references a non-existent target node '{target_id}'.")

        # Validate handle usage
        source_node = node_map.get(source_id)
        if source_node:
            source_type = source_node.get("type")
            if source_type in ["conditional", "approval"] and not source_handle:
                 errors.append(f"Edge '{edge.get('id')}' from a {source_type} node must specify a sourceHandle ('true'/'false' or 'approve'/'reject').")
            elif source_type not in ["conditional", "approval", "fork", "event"] and source_handle: # Allow for multi-handle fork/event if designed that way
                 errors.append(f"Edge '{edge.get('id')}' from a {source_type} node should not specify a sourceHandle unless it's conditional, approval, fork, or event.")


    return errors