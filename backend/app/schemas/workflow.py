from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class NodeSchema(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]

class EdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    condition: Optional[Dict[str, Any]] = None

class WorkflowCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    nodes: List[NodeSchema]
    edges: List[EdgeSchema]

class WorkflowExecuteSchema(BaseModel):
    input_data: Dict[str, Any]

class ApprovalResponseSchema(BaseModel):
    action: str  # approve / reject
    data: Optional[Dict[str, Any]] = None
