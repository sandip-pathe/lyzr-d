"""Self-documenting workflow narration"""
from typing import List, Dict, Any
from datetime import datetime, timezone
from app.core.database import SessionLocal
from app.models.event_log import EventLog

class NarrationService:
    def generate_narration(self, workflow_id: str, execution_id: str) -> str:
        """Generate human-readable narration from execution history"""
        db = SessionLocal()
        
        events = db.query(EventLog).filter(
            EventLog.workflow_id == workflow_id,
            EventLog.execution_id == execution_id
        ).order_by(EventLog.timestamp).all()
        
        db.close()
        
        narration = []
        narration.append(f"# Workflow Execution Report\n")
        narration.append(f"**Workflow ID:** {workflow_id}")
        narration.append(f"**Execution ID:** {execution_id}")
        narration.append(f"**Generated:** {datetime.now(timezone.utc).isoformat()}\n")
        narration.append("## Execution Timeline\n")
        
        for event in events:
            timestamp = event.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
            event_type = event.event_type
            node_id = event.event_data.get("node_id", "N/A")
            
            if event_type == "workflow.started":
                narration.append(f"**{timestamp}** - Workflow execution started")
            
            elif event_type == "node.started":
                node_type = event.event_data.get("node_type", "unknown")
                narration.append(f"**{timestamp}** - Started executing {node_type} node `{node_id}`")
            
            elif event_type == "node.completed":
                narration.append(f"**{timestamp}** - Completed node `{node_id}` successfully")
            
            elif event_type == "node.failed":
                error = event.event_data.get("error", "Unknown error")
                narration.append(f"**{timestamp}** - ⚠️ Node `{node_id}` failed: {error}")
            
            elif event_type == "approval.requested":
                narration.append(f"**{timestamp}** - 🔔 Approval requested for node `{node_id}`")
            
            elif event_type == "approval.granted":
                narration.append(f"**{timestamp}** - ✅ Approval granted for node `{node_id}`")
            
            elif event_type == "approval.denied":
                narration.append(f"**{timestamp}** - ❌ Approval denied for node `{node_id}`")
            
            elif event_type == "eval.completed":
                passed = event.event_data.get("passed", False)
                score = event.event_data.get("score", 0)
                status = "✅ Passed" if passed else "❌ Failed"
                narration.append(f"**{timestamp}** - Evaluation {status} (score: {score:.2f})")
            
            elif event_type == "compensation.started":
                narration.append(f"**{timestamp}** - 🔄 Started compensation for node `{node_id}`")
            
            elif event_type == "workflow.completed":
                narration.append(f"\n**{timestamp}** - ✅ Workflow completed successfully")
            
            elif event_type == "workflow.failed":
                error = event.event_data.get("error", "Unknown")
                narration.append(f"\n**{timestamp}** - ❌ Workflow failed: {error}")
        
        return "\n".join(narration)
    
    def generate_audit_report(self, workflow_id: str) -> Dict[str, Any]:
        """Generate compliance audit report"""
        db = SessionLocal()
        
        events = db.query(EventLog).filter(
            EventLog.workflow_id == workflow_id
        ).all()
        
        db.close()
        
        # Aggregate statistics
        total_executions = len(set(e.execution_id for e in events))
        node_executions = {}
        approvals = []
        failures = []
        
        for event in events:
            if event.event_type == "node.completed":
                node_id = event.event_data.get("node_id")
                node_executions[node_id] = node_executions.get(node_id, 0) + 1
            
            elif event.event_type == "approval.granted":
                approvals.append(event.event_data)
            
            elif event.event_type in ["node.failed", "workflow.failed"]:
                failures.append({
                    "timestamp": event.timestamp.isoformat(),
                    "event_type": event.event_type,
                    "error": event.event_data.get("error")
                })
        
        return {
            "workflow_id": workflow_id,
            "total_executions": total_executions,
            "node_execution_counts": node_executions,
            "total_approvals": len(approvals),
            "approval_details": approvals,
            "total_failures": len(failures),
            "failure_details": failures,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
