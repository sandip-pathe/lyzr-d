# backend/app/services/validation_service.py
from typing import List, Dict, Any

def validate_workflow(workflow: Dict[str, Any]) -> List[str]:
    """
    Validates a workflow to ensure all nodes are correctly configured.
    """
    errors = []
    nodes = workflow.get("nodes", [])

    for node in nodes:
        node_type = node.get("type")
        node_data = node.get("data", {})

        if node_type == "agent" and not node_data.get("prompt"):
            errors.append(f"AgentNode '{node.get('id')}' is missing a prompt.")
        
        if node_type == "trigger" and node_data.get("trigger_type") == "schedule" and not node_data.get("schedule"):
            errors.append(f"TriggerNode '{node.get('id')}' is missing a schedule.")

        # Add more validation rules for other node types...

    return errors