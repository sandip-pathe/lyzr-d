"""Event chronicle model"""
from sqlalchemy import Column, String, JSON, DateTime, Index, Text, Float, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from typing import Optional, Dict, Any
from datetime import datetime as dt

class EventLog(Base):
    __tablename__ = "event_logs"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    workflow_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    execution_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    node_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    event_data: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    timestamp: Mapped[dt] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    __table_args__ = (
        Index('idx_workflow_timestamp', 'workflow_id', 'timestamp'),
        Index('idx_execution_timestamp', 'execution_id', 'timestamp'),
    )

class CompensationLog(Base):
    __tablename__ = "compensation_logs"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    workflow_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    execution_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    node_id: Mapped[str] = mapped_column(String, nullable=False)
    compensation_status: Mapped[str] = mapped_column(String, nullable=False)  # pending|success|failed
    compensation_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[str]] = mapped_column(DateTime(timezone=True), nullable=True)

class AgentScore(Base):
    __tablename__ = "agent_scores"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[str] = mapped_column(String, nullable=False)
    execution_count: Mapped[int] = mapped_column(Integer, default=0)
    success_count: Mapped[int] = mapped_column(Integer, default=0)
    failure_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    total_cost: Mapped[float] = mapped_column(Float, default=0.0)
    reliability_score: Mapped[float] = mapped_column(Float, default=1.0)
    last_updated: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_provider_agent', 'provider', 'agent_id', unique=True),
    )