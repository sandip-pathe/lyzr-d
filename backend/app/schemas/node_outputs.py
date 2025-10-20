"""
Node Output Schemas - Standardized output types for all node types
"""
from typing import Any, Dict, Optional, List, Union
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class NodeStatus(str, Enum):
    """Node execution status"""
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"


class BaseNodeOutput(BaseModel):
    """Base output schema all nodes must follow"""
    node_id: str
    node_type: str
    timestamp: datetime = Field(default_factory=datetime.now)
    status: NodeStatus = NodeStatus.SUCCESS
    raw_output: Any  # The actual output data
    error: Optional[str] = None
    
    @property
    def text_content(self) -> str:
        """Extract text content for downstream nodes. Override in subclasses for specific behavior."""
        # Default implementation: try to stringify raw_output
        if isinstance(self.raw_output, str):
            return self.raw_output
        elif isinstance(self.raw_output, dict):
            # Try common text fields
            for field in ["output", "text", "content", "message", "result"]:
                if field in self.raw_output:
                    return str(self.raw_output[field])
            return str(self.raw_output)
        return str(self.raw_output)
    
    class Config:
        use_enum_values = True


class TriggerOutput(BaseNodeOutput):
    """Output from trigger nodes"""
    node_type: str = "trigger"
    input_data: Dict[str, Any]
    trigger_type: str  # manual, scheduled, webhook, event
    
    @property
    def text_content(self) -> str:
        """Extract text for downstream nodes"""
        # Try common field names in order of preference
        for field in ["prompt", "input_text", "text", "message", "query", "content"]:
            if field in self.input_data:
                return str(self.input_data[field])
        
        # If input_data has only one key, return its value
        if len(self.input_data) == 1:
            return str(list(self.input_data.values())[0])
        
        # Fallback: stringify the whole dict
        return str(self.input_data)


class AgentOutput(BaseNodeOutput):
    """Output from AI agent nodes"""
    node_type: str = "agent"
    output: str  # The actual text/response
    model: str
    cost: float
    temperature_used: float
    usage: Dict[str, Any]  # Changed from Dict[str, int] to handle nested token details
    
    @property
    def text_content(self) -> str:
        return self.output
    
    @property
    def token_count(self) -> int:
        return self.usage.get("total_tokens", 0)


class TimerOutput(BaseNodeOutput):
    """Output from timer/scheduler nodes"""
    node_type: str = "timer"
    scheduled_time: datetime
    next_run: Optional[datetime] = None
    delay_seconds: Optional[int] = None
    recurring: bool = False
    
    @property
    def text_content(self) -> str:
        return f"Scheduled for {self.scheduled_time.isoformat()}"


class ConditionOutput(BaseNodeOutput):
    """Output from conditional branching nodes"""
    node_type: str = "condition"
    condition_met: bool
    branch: str  # "true" or "false"
    evaluation: Dict[str, Any]
    matched_condition: Optional[str] = None
    
    @property
    def text_content(self) -> str:
        return f"Condition: {self.matched_condition or 'evaluated'} → {self.branch}"


class LoopOutput(BaseNodeOutput):
    """Output from loop/iteration nodes"""
    node_type: str = "loop"
    iteration: int
    current_item: Any
    has_more: bool
    total_items: int
    items_processed: int = 0
    
    @property
    def text_content(self) -> str:
        return f"Iteration {self.iteration}/{self.total_items}: {self.current_item}"


class MergeOutput(BaseNodeOutput):
    """Output from merge nodes"""
    node_type: str = "merge"
    merged_data: Dict[str, Any]
    sources: List[str]  # Node IDs that were merged
    merge_strategy: str  # combine, override, concat
    
    @property
    def text_content(self) -> str:
        return f"Merged {len(self.sources)} sources"


class APICallOutput(BaseNodeOutput):
    """Output from API call nodes"""
    node_type: str = "api_call"
    status_code: int
    body: Any
    headers: Dict[str, str]
    response_time_ms: float
    url: str
    
    @property
    def text_content(self) -> str:
        if isinstance(self.body, dict):
            return str(self.body)
        return str(self.body)
    
    @property
    def is_success(self) -> bool:
        return 200 <= self.status_code < 300


class EvalOutput(BaseNodeOutput):
    """Output from evaluation nodes"""
    node_type: str = "eval"
    passed: bool
    score: float
    feedback: str
    criteria: Dict[str, Any]
    detailed_scores: Optional[Dict[str, float]] = None
    
    @property
    def text_content(self) -> str:
        return f"Score: {self.score:.2f} - {self.feedback}"


class ApprovalOutput(BaseNodeOutput):
    """Output from approval nodes"""
    node_type: str = "approval"
    approved: bool
    approver: Optional[str] = None
    comments: Optional[str] = None
    approval_time: Optional[datetime] = None
    
    @property
    def text_content(self) -> str:
        status = "Approved" if self.approved else "Rejected"
        by_whom = f" by {self.approver}" if self.approver else ""
        return f"{status}{by_whom}"


class EndOutput(BaseNodeOutput):
    """Output from end nodes"""
    node_type: str = "end"
    captured_output: Optional[Any] = None
    workflow_summary: Optional[Dict[str, Any]] = None
    
    @property
    def text_content(self) -> str:
        if self.captured_output:
            return str(self.captured_output)
        return "Workflow completed"


class EventOutput(BaseNodeOutput):
    """Output from event hub nodes"""
    node_type: str = "event"
    event_name: str
    event_data: Dict[str, Any]
    published_at: datetime = Field(default_factory=datetime.now)
    
    @property
    def text_content(self) -> str:
        return f"Event '{self.event_name}' published"


class MetaOutput(BaseNodeOutput):
    """Output from meta/orchestrator nodes"""
    node_type: str = "meta"
    sub_workflow_id: Optional[str] = None
    sub_workflow_result: Optional[Dict[str, Any]] = None
    
    @property
    def text_content(self) -> str:
        return f"Sub-workflow {self.sub_workflow_id} completed"


# Type alias for all possible outputs
NodeOutput = Union[
    TriggerOutput,
    AgentOutput,
    TimerOutput,
    ConditionOutput,
    LoopOutput,
    MergeOutput,
    APICallOutput,
    EvalOutput,
    ApprovalOutput,
    EndOutput,
    EventOutput,
    MetaOutput,
]
