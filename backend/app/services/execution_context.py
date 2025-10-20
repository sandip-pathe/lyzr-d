"""
Execution Context - Global state tracker for workflow executions
"""
from typing import Any, Dict, List, Optional
from datetime import datetime
from enum import Enum


class OutputSignificance(str, Enum):
    """How important is this output to the end user?"""
    PRIMARY = "primary"      # Main user-facing result (Agent, Eval, API)
    UTILITY = "utility"      # Control flow (Timer, Condition, Loop)
    META = "meta"            # Workflow metadata (Trigger, End, Event)


class NodeOutputContext:
    """Rich context for a single node's output"""
    
    def __init__(
        self,
        node_id: str,
        node_type: str,
        output: Any,
        significance: OutputSignificance,
        timestamp: datetime,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.node_id = node_id
        self.node_type = node_type
        self.output = output
        self.significance = significance
        self.timestamp = timestamp
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "node_type": self.node_type,
            "output": self.output,
            "significance": self.significance,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata
        }


class ExecutionContext:
    """
    Global execution context - the source of truth for workflow state.
    Tracks all node executions and maintains workflow metadata.
    """
    
    def __init__(self, execution_id: str, workflow_id: str, started_at: Optional[datetime] = None):
        self.execution_id = execution_id
        self.workflow_id = workflow_id
        
        # Execution flow - ordered list of nodes executed
        self.flow: List[Dict[str, Any]] = []
        
        # Node outputs - keyed by node_id
        self.data: Dict[str, NodeOutputContext] = {}
        
        # Global metadata
        self.globals = {
            "primary_output_node": None,  # Will be set intelligently
            "user_inputs": {},
            "started_at": started_at if started_at else datetime.now(),  # Use provided timestamp or fallback
            "completed_at": None,
        }
        
        # Workflow metadata
        self.metadata = {
            "summary": None,
            "total_cost": 0.0,
            "total_tokens": 0,
            "nodes_executed": 0,
            "nodes_by_type": {},
        }
    
    def add_node_execution(
        self,
        node_id: str,
        node_type: str,
        output: Any,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None
    ):
        """Add a node's output to the context"""
        
        # Determine significance based on node type
        significance = self._determine_significance(node_type, output)
        
        # Create rich context
        node_context = NodeOutputContext(
            node_id=node_id,
            node_type=node_type,
            output=output,
            significance=significance,
            timestamp=timestamp if timestamp else datetime.now(),  # Use provided or fallback
            metadata=metadata
        )
        
        # Store in data dict
        self.data[node_id] = node_context
        
        # Add to execution flow
        self.flow.append({
            "node_id": node_id,
            "node_type": node_type,
            "timestamp": node_context.timestamp.isoformat(),
            "significance": significance
        })
        
        # Update primary output if this is significant
        if significance == OutputSignificance.PRIMARY:
            self.globals["primary_output_node"] = node_id
        
        # Update metadata
        self.metadata["nodes_executed"] += 1
        
        # Track nodes by type
        if node_type not in self.metadata["nodes_by_type"]:
            self.metadata["nodes_by_type"][node_type] = 0
        self.metadata["nodes_by_type"][node_type] += 1
        
        # Aggregate costs and tokens for agent nodes
        if node_type == "agent" and isinstance(output, dict):
            self.metadata["total_cost"] += output.get("cost", 0)
            usage = output.get("usage", {})
            self.metadata["total_tokens"] += usage.get("total_tokens", 0)
    
    def _determine_significance(self, node_type: str, output: Any) -> OutputSignificance:
        """Intelligently determine output significance"""
        
        # PRIMARY: User-facing content generators
        if node_type in ["agent", "eval", "api_call"]:
            return OutputSignificance.PRIMARY
        
        # UTILITY: Control flow nodes
        if node_type in ["conditional", "timer", "loop", "merge"]:
            return OutputSignificance.UTILITY
        
        # META: Workflow structure
        if node_type in ["trigger", "end", "event", "meta"]:
            return OutputSignificance.META
        
        # Default to utility
        return OutputSignificance.UTILITY
    
    def get_primary_output(self, fallback_to_last: bool = True) -> Optional[Any]:
        """
        Get the semantically meaningful output.
        This intelligently finds what the user actually cares about.
        """
        
        # 1. Check if explicitly set
        primary_node_id = self.globals.get("primary_output_node")
        if primary_node_id and primary_node_id in self.data:
            return self.data[primary_node_id].output
        
        # 2. Find the last PRIMARY significance node
        primary_nodes = [
            ctx for ctx in self.data.values()
            if ctx.significance == OutputSignificance.PRIMARY
        ]
        
        if primary_nodes:
            # Get the most recent one
            latest = max(primary_nodes, key=lambda x: x.timestamp)
            return latest.output
        
        # 3. Fallback: return last executed node's output
        if fallback_to_last and self.flow:
            last_node_id = self.flow[-1]["node_id"]
            if last_node_id in self.data:
                return self.data[last_node_id].output
        
        return None
    
    def get_summary(self) -> Dict[str, Any]:
        """Generate a human-readable summary"""
        primary_output = self.get_primary_output()
        
        # Try to create a smart summary
        if isinstance(primary_output, dict) and "output" in primary_output:
            summary_text = str(primary_output["output"])[:100]
            if len(str(primary_output["output"])) > 100:
                summary_text += "..."
        elif isinstance(primary_output, str):
            summary_text = primary_output[:100]
            if len(primary_output) > 100:
                summary_text += "..."
        else:
            summary_text = f"Workflow completed with {self.metadata['nodes_executed']} nodes"
        
        self.metadata["summary"] = summary_text
        return self.metadata
    
    def get_node_output(self, node_id: str) -> Optional[Any]:
        """Get output for a specific node"""
        if node_id in self.data:
            return self.data[node_id].output
        return None
    
    def get_last_node_output(self) -> Optional[Any]:
        """Get the last executed node's output"""
        if self.flow:
            last_node_id = self.flow[-1]["node_id"]
            return self.get_node_output(last_node_id)
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize entire context"""
        # Serialize globals with datetime conversion
        serialized_globals = {}
        for k, v in self.globals.items():
            if isinstance(v, datetime):
                serialized_globals[k] = v.isoformat()
            else:
                serialized_globals[k] = v
        
        # Get primary output and serialize it
        primary_output = self.get_primary_output()
        primary_output_dict = None
        if primary_output is not None:
            if hasattr(primary_output, 'model_dump'):
                # It's a Pydantic model (BaseNodeOutput) - use mode='json' for datetime serialization
                primary_output_dict = primary_output.model_dump(mode='json')
            elif hasattr(primary_output, 'dict'):
                primary_output_dict = primary_output.dict()
            else:
                primary_output_dict = primary_output
        
        return {
            "execution_id": self.execution_id,
            "workflow_id": self.workflow_id,
            "flow": self.flow,
            "data": {k: v.to_dict() for k, v in self.data.items()},
            "globals": serialized_globals,
            "metadata": self.metadata,
            "primary_output": primary_output_dict,
            "summary": self.get_summary()
        }
