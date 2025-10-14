"""Metrics and observability API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.event_log import EventLog, AgentScore
from app.models.workflow import Execution
from typing import Dict, Any

router = APIRouter(prefix="/metrics", tags=["metrics"])

@router.get("/summary")
async def get_metrics_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get overall metrics summary"""
    total_executions = db.query(func.count(Execution.id)).scalar()
    
    completed = db.query(func.count(Execution.id)).filter(
        Execution.status == "completed"
    ).scalar()
    
    failed = db.query(func.count(Execution.id)).filter(
        Execution.status == "failed"
    ).scalar()
    
    running = db.query(func.count(Execution.id)).filter(
        Execution.status == "running"
    ).scalar()
    
    success_rate = (completed / total_executions * 100) if total_executions > 0 else 0
    
    return {
        "total_executions": total_executions,
        "completed": completed,
        "failed": failed,
        "running": running,
        "success_rate": round(success_rate, 2)
    }

@router.get("/agents")
async def get_agent_metrics(db: Session = Depends(get_db)):
    """Get agent performance metrics"""
    scores = db.query(AgentScore).all()
    
    return [
        {
            "provider": s.provider,
            "agent_id": s.agent_id,
            "executions": s.execution_count,
            "success_count": s.success_count,
            "failure_count": s.failure_count,
            "reliability_score": round(s.reliability_score, 3),
            "avg_latency_ms": round(s.avg_latency_ms, 2),
            "total_cost": round(s.total_cost, 2)
        }
        for s in scores
    ]

@router.get("/workflows/{workflow_id}")
async def get_workflow_metrics(workflow_id: str, db: Session = Depends(get_db)):
    """Get metrics for specific workflow"""
    executions = db.query(Execution).filter(
        Execution.workflow_id == workflow_id
    ).all()
    
    events = db.query(EventLog).filter(
        EventLog.workflow_id == workflow_id
    ).all()
    
    node_counts = {}
    for event in events:
        if event.event_type == "node.completed":
            node_id = event.event_data.get("node_id")
            node_counts[node_id] = node_counts.get(node_id, 0) + 1
    
    return {
        "workflow_id": workflow_id,
        "total_executions": len(executions),
        "completed": len([e for e in executions if e.status == "completed"]),
        "failed": len([e for e in executions if e.status == "failed"]),
        "node_execution_counts": node_counts,
        "total_events": len(events)
    }

@router.get("/cost")
async def get_cost_metrics(db: Session = Depends(get_db)):
    """Get cost breakdown"""
    agents = db.query(AgentScore).all()
    
    total_cost = sum(a.total_cost for a in agents)
    
    by_provider = {}
    for agent in agents:
        by_provider[agent.provider] = by_provider.get(agent.provider, 0) + agent.total_cost
    
    return {
        "total_cost": round(total_cost, 2),
        "by_provider": {k: round(v, 2) for k, v in by_provider.items()}
    }
