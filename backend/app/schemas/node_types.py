"""Node type definitions and JSON schemas"""
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class NodeType(str, Enum):
    TRIGGER = "trigger"
    AGENT = "agent"
    API_CALL = "api_call"
    APPROVAL = "approval"
    CONDITIONAL = "conditional"
    FORK = "fork"
    MERGE = "merge"
    EVENT = "event"
    TIMER = "timer"
    EVAL = "eval"
    META = "meta"
    END = "end"

class BaseNodeConfig(BaseModel):
    """Base configuration shared by most nodes."""
    # Optional: Define how inputs are mapped from the workflow state
    input_mapping: Optional[Dict[str, Any]] = Field(None, description="Mapping of workflow state to node input")
    # Optional: Define how the node's output should update the workflow state
    output_mapping: Optional[Dict[str, str]] = Field(None, description="Mapping of node output to workflow state keys")

# --- Specific Node Configs Inheriting from Base ---

class TriggerConfig(BaseModel): # Trigger doesn't usually need input/output mapping
    type: str = Field("manual", description="Type of trigger (e.g., manual, schedule, webhook)")
    schedule: Optional[str] = Field(None, description="Cron string for scheduled triggers")
    webhook_url: Optional[str] = Field(None, description="URL for webhook triggers")

class AgentConfig(BaseNodeConfig):
    provider: str = Field(..., description="AI provider (e.g., openai, lyzr)")
    agent_id: str = Field(..., description="Specific agent/model ID (e.g., gpt-4o-mini)")
    # Input mapping is crucial here, inheriting from BaseNodeConfig
    # Example specific agent config if needed:
    temperature: Optional[float] = Field(None, description="Model temperature override")

class ApiCallConfig(BaseNodeConfig):
    url: str = Field(..., description="URL for the API call")
    method: str = Field("POST", description="HTTP method (GET, POST, PUT, DELETE, etc.)")
    headers: Optional[Dict[str, str]] = Field({}, description="Headers for the API call")
    body_template: Optional[Dict[str, Any]] = Field({}, description="JSON template for the request body, uses input_mapping")

class ApprovalConfig(BaseNodeConfig):
    title: str = Field("Approval Required", description="Title of the approval request")
    description: str = Field(..., description="Detailed description or instructions for the approver")
    approvers: List[str] = Field(..., description="List of approver emails or IDs")
    channels: List[str] = Field(["slack", "email"], description="Notification channels (slack, email)")
    # Implicit output: {"action": "approve"|"reject", "comment": "...", "approver": "..."}

class ConditionalConfig(BaseNodeConfig):
    condition_expression: str = Field(..., description="Python expression to evaluate against previous_output (e.g., 'output.status == \"success\"')")

class EvalConfig(BaseNodeConfig):
    eval_type: str = Field(..., description="Type of evaluation (e.g., schema, llm_judge, policy)")
    config: Dict[str, Any] = Field(..., description="Specific configuration for the chosen eval_type")
    on_failure: str = Field("block", description="Action on failure (block, warn, retry, compensate)")

class ForkConfig(BaseModel): 
    branch_count: Optional[int] = Field(None, description="Expected number of branches (for validation)")

class MergeConfig(BaseNodeConfig):
    merge_strategy: str = Field("combine", description="How to merge branch results (combine, first, vote)")
    # Input implicitly comes from completed branches

class TimerConfig(BaseModel): # Timer usually just pauses
    duration_seconds: int = Field(..., description="Wait duration in seconds")

class EventConfig(BaseNodeConfig):
    operation: str = Field("publish", description="publish or subscribe")
    channel: str = Field(..., description="Event channel/topic name")
    # Payload comes from input_mapping for publish

class MetaConfig(BaseNodeConfig):
    operation: str = Field("observe", description="observe, enforce, etc.")
    metrics_to_capture: List[str] = Field(["latency", "status"], description="Metrics to log")

class EndConfig(BaseModel):
    pass

# --- Update the Master Registry ---
NODE_TYPE_SCHEMAS = {
    NodeType.TRIGGER: TriggerConfig,
    NodeType.AGENT: AgentConfig,
    NodeType.API_CALL: ApiCallConfig, # Renamed class
    NodeType.APPROVAL: ApprovalConfig,
    NodeType.CONDITIONAL: ConditionalConfig,
    NodeType.FORK: ForkConfig,
    NodeType.MERGE: MergeConfig,
    NodeType.TIMER: TimerConfig, # Added
    NodeType.EVENT: EventConfig,
    NodeType.EVAL: EvalConfig,
    NodeType.META: MetaConfig,
    NodeType.END: EndConfig,
}

def get_node_type_info(node_type: str) -> Dict[str, Any]:
    """Get JSON schema for node type"""
    try:
        node_type_enum = NodeType(node_type)
    except ValueError:
        return {}

    schema_class = NODE_TYPE_SCHEMAS[node_type_enum]
    return {
        "type": node_type,
        "name": node_type.capitalize().replace("_", " "),
        "schema": schema_class.model_json_schema(),
        "description": schema_class.__doc__ or f"{node_type} node"
    }

def get_all_node_types() -> List[Dict[str, Any]]:
    """Get all node types with schemas"""
    return [get_node_type_info(nt.value) for nt in NodeType]