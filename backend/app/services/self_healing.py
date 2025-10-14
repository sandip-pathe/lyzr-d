"""Self-healing orchestration - auto-reroute on failure"""
from typing import Dict, Any, List, Optional
from app.core.database import SessionLocal
from app.models.event_log import AgentScore
from uuid import uuid4
import time

class SelfHealingService:
    def __init__(self):
        self.failure_threshold = 3
    
    def get_best_agent(self, provider: str, agent_ids: List[str]) -> str:
        """Get agent with highest reliability score"""
        db = SessionLocal()
        
        scores = db.query(AgentScore).filter(
            AgentScore.provider == provider,
            AgentScore.agent_id.in_(agent_ids)
        ).all()
        
        db.close()
        
        if not scores:
            # No history, return first
            return agent_ids[0]
        
        # Sort by reliability score
        scores.sort(key=lambda s: s.reliability_score, reverse=True)
        return scores[0].agent_id
    
    def record_agent_execution(
        self,
        provider: str,
        agent_id: str,
        success: bool,
        latency_ms: float,
        cost: float = 0.0
    ):
        """Record agent execution for scoring"""
        db = SessionLocal()
        
        score = db.query(AgentScore).filter(
            AgentScore.provider == provider,
            AgentScore.agent_id == agent_id
        ).first()
        
        if not score:
            score = AgentScore(
                id=str(uuid4()),
                provider=provider,
                agent_id=agent_id,
                execution_count=0,
                success_count=0,
                failure_count=0,
                avg_latency_ms=0.0,
                total_cost=0.0,
                reliability_score=1.0
            )
            db.add(score)
        
        # Update counts
        score.execution_count += 1
        if success:
            score.success_count += 1
        else:
            score.failure_count += 1
        
        # Update average latency
        score.avg_latency_ms = (
            (score.avg_latency_ms * (score.execution_count - 1) + latency_ms) /
            score.execution_count
        )
        
        # Update total cost
        score.total_cost += cost
        
        # Recalculate reliability score (success rate)
        score.reliability_score = score.success_count / score.execution_count if score.execution_count > 0 else 1.0
        
        db.commit()
        db.close()
    
    def should_reroute(self, provider: str, agent_id: str) -> bool:
        """Check if agent should be replaced due to failures"""
        db = SessionLocal()
        
        score = db.query(AgentScore).filter(
            AgentScore.provider == provider,
            AgentScore.agent_id == agent_id
        ).first()
        
        db.close()
        
        if not score:
            return False
        
        # Reroute if reliability drops below 0.5 and has enough attempts
        return score.reliability_score < 0.5 and score.execution_count >= 3
    
    def get_alternate_agent(self, provider: str, failed_agent_id: str, all_agent_ids: List[str]) -> Optional[str]:
        """Get alternate agent excluding the failed one"""
        candidates = [aid for aid in all_agent_ids if aid != failed_agent_id]
        if not candidates:
            return None
        
        return self.get_best_agent(provider, candidates)
