from sqlalchemy import Column, String, JSON, DateTime, Enum as SQLEnum, func
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class WorkflowStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(String(36), primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    definition = Column(JSON)  # Nodes, edges, config
    status = Column(SQLEnum(WorkflowStatus), default=WorkflowStatus.DRAFT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Execution(Base):
    __tablename__ = "executions"
    
    id = Column(String(36), primary_key=True, index=True)
    workflow_id = Column(String, index=True)
    status = Column(String)
    input_data = Column(JSON)
    output_data = Column(JSON, nullable=True)
    current_node = Column(String, nullable=True)
    error = Column(String, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"
    
    id = Column(String(36), primary_key=True, index=True)
    execution_id = Column(String, index=True)
    node_id = Column(String)
    status = Column(String, default="pending")  # pending, approved, rejected
    approver = Column(String)
    approval_data = Column(JSON, nullable=True)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)
