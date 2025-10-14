"""Enhanced workflow models"""
from typing import Optional, Dict, Any
from sqlalchemy import String, JSON, DateTime, Text, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    definition: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[Optional[str]] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[str]] = mapped_column(DateTime(timezone=True), onupdate=func.now())


class Execution(Base):
    __tablename__ = "executions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    workflow_id: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    input_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    output_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    current_node: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # NEW FIELDS
    compensation_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # pending|success|failed
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    started_at: Mapped[Optional[str]] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[str]] = mapped_column(DateTime(timezone=True), nullable=True)


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    execution_id: Mapped[str] = mapped_column(String, nullable=False)
    node_id: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    approval_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)  # For multi-approver data
    requested_at: Mapped[Optional[str]] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[Optional[str]] = mapped_column(DateTime(timezone=True), nullable=True)
