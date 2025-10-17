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
    EVAL = "eval"
    META = "meta"
    END = "end"

class TriggerConfig(BaseModel):
    type: str = Field("manual", description="manual | date")
    date: Optional[str] = Field(None, description="Date to trigger the workflow")

class AgentConfig(BaseModel):
    userInput: str = Field("", description="User input text")
    attachments: List[str] = Field([], description="List of attachment URLs")
    systemPrompt: str = Field("", description="System prompt for the agent")

class API_CallConfig(BaseModel):
    url: str = Field("", description="URL for the API call")
    method: str = Field("GET", description="HTTP method")
    headers: Dict[str, str] = Field({}, description="Headers for the API call")
    body: Dict[str, Any] = Field({}, description="Body for the API call")

class ConditionalConfig(BaseModel):
    condition: str = Field("", description="The condition to evaluate")

class ApprovalConfig(BaseModel):
    prompt: str = Field("Do you approve this step?", description="The question to display in the UI pop-up.")

class ForkConfig(BaseModel):
    pass

class MergeConfig(BaseModel):
    pass

class EventConfig(BaseModel):
    topic: str = Field("", description="The event topic to publish to")

class EvalConfig(BaseModel):
    eval_type: str = Field(..., description="schema|llm_judge|policy|custom")
    schema_def: Optional[Dict[str, Any]] = None
    confidence_threshold: Optional[float] = 0.8
    policy_rules: Optional[List[Dict[str, Any]]] = None
    llm_judge_prompt: Optional[str] = None
    on_failure: str = Field("block", description="block|warn|retry|compensate")
    criteria: Optional[str] = None

class MetaConfig(BaseModel):
    operation: str = Field(..., description="observe|enforce|intervene")
    metrics: List[str] = ["latency", "cost", "success_rate"]
    policy_checks: Optional[List[str]] = None

class EndConfig(BaseModel):
    pass

# Master node type registry
NODE_TYPE_SCHEMAS = {
    NodeType.TRIGGER: TriggerConfig,
    NodeType.AGENT: AgentConfig,
    NodeType.API_CALL: API_CallConfig,
    NodeType.APPROVAL: ApprovalConfig,
    NodeType.CONDITIONAL: ConditionalConfig,
    NodeType.FORK: ForkConfig,
    NodeType.MERGE: MergeConfig,
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