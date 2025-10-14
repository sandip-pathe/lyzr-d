"""Node type definitions and JSON schemas"""
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class NodeType(str, Enum):
    TRIGGER = "trigger"
    AGENT = "agent"
    ACTION = "action"
    APPROVAL = "approval"
    EVAL = "eval"
    FORK = "fork"
    MERGE = "merge"
    TIMER = "timer"
    EVENT = "event"
    META = "meta"

class TriggerConfig(BaseModel):
    trigger_type: str = Field(..., description="time|event|api")
    cron: Optional[str] = Field(None, description="Cron expression for scheduled triggers")
    event_channel: Optional[str] = Field(None, description="Redis channel to listen to")

class AgentConfig(BaseModel):
    provider: str = Field(..., description="openai|lyzr|custom")
    agent_id: str
    input_mapping: Dict[str, Any] = {}
    timeout: int = 300
    retry_max_attempts: int = 3
    temperature: Optional[float] = None
    enable_auto_tuning: bool = False

class ActionConfig(BaseModel):
    action_type: str = Field(..., description="http|email|db")
    method: Optional[str] = "POST"
    url: Optional[str] = None
    headers: Dict[str, str] = {}
    body: Dict[str, Any] = {}
    timeout: int = 30
    idempotency_key: Optional[str] = None

class ApprovalConfig(BaseModel):
    approvers: List[str]
    approval_type: str = Field("any", description="any|all|majority")
    channels: List[str] = ["slack", "email"]
    timeout_hours: int = 24
    escalation_approvers: Optional[List[str]] = None

class EvalConfig(BaseModel):
    eval_type: str = Field(..., description="schema|llm_judge|policy|custom")
    schema_def: Optional[Dict[str, Any]] = None
    confidence_threshold: Optional[float] = 0.8
    policy_rules: Optional[List[Dict[str, Any]]] = None
    llm_judge_prompt: Optional[str] = None
    on_failure: str = Field("block", description="block|warn|retry|compensate")

class ForkConfig(BaseModel):
    branches: List[List[str]] = Field(..., description="List of node ID lists for each branch")
    wait_for: str = Field("all", description="all|any|first")

class MergeConfig(BaseModel):
    merge_strategy: str = Field("combine", description="combine|first|vote")
    required_branches: Optional[int] = None

class TimerConfig(BaseModel):
    duration_seconds: int
    timer_type: str = Field("delay", description="delay|timeout|schedule")

class EventConfig(BaseModel):
    operation: str = Field(..., description="publish|subscribe")
    channel: str
    wait_for_response: bool = False
    timeout_seconds: Optional[int] = 30

class MetaConfig(BaseModel):
    operation: str = Field(..., description="observe|enforce|intervene")
    metrics: List[str] = ["latency", "cost", "success_rate"]
    policy_checks: Optional[List[str]] = None

# Master node type registry
NODE_TYPE_SCHEMAS = {
    NodeType.TRIGGER: TriggerConfig,
    NodeType.AGENT: AgentConfig,
    NodeType.ACTION: ActionConfig,
    NodeType.APPROVAL: ApprovalConfig,
    NodeType.EVAL: EvalConfig,
    NodeType.FORK: ForkConfig,
    NodeType.MERGE: MergeConfig,
    NodeType.TIMER: TimerConfig,
    NodeType.EVENT: EventConfig,
    NodeType.META: MetaConfig,
}

def get_node_type_info(node_type: str) -> Dict[str, Any]:
    """Get JSON schema for node type"""
    try:
        node_type_enum = NodeType(node_type)  # Convert str to NodeType
    except ValueError:
        return {}
    
    schema_class = NODE_TYPE_SCHEMAS[node_type_enum]
    return {
        "type": node_type,
        "name": node_type.capitalize(),
        "schema": schema_class.model_json_schema(),
        "description": schema_class.__doc__ or f"{node_type} node"
    }

def get_all_node_types() -> List[Dict[str, Any]]:
    """Get all node types with schemas"""
    return [get_node_type_info(nt.value) for nt in NodeType]
