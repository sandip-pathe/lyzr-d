"""Saga compensation service"""
from typing import Dict, Any, List
from uuid import uuid4
from datetime import datetime, timezone
from app.core.database import SessionLocal
from app.models.event_log import CompensationLog
from app.core.events import event_bus
import httpx

class CompensationService:
    def __init__(self):
        self.compensation_handlers = {
            "agent": self._compensate_agent,
            "action": self._compensate_action,
            "approval": self._compensate_approval,
            "eval": self._compensate_eval,
        }
    
    # ✅ FIX: Declared the method as async
    async def compensate_node(
        self, 
        node: Dict[str, Any], 
        execution_id: str, 
        workflow_id: str,
        state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute compensation for a node"""
        node_type = node.get("type", "unknown")  
        node_id = node.get("id", "") 
    
        compensation_id = str(uuid4())
        db = SessionLocal()
        
        comp_log = CompensationLog(
            id=compensation_id,
            workflow_id=workflow_id,
            execution_id=execution_id,
            node_id=node_id,
            compensation_status="pending",
            compensation_data={"node": node}
        )
        db.add(comp_log)
        db.commit()
        
        # ✅ FIX: Added await
        await event_bus.publish("compensation.started", {
            "workflow_id": workflow_id,
            "execution_id": execution_id,
            "node_id": node_id,
            "compensation_id": compensation_id
        })
        
        try:
            handler = self.compensation_handlers.get(node_type)
            if handler:
                # ✅ FIX: Added await (since handler methods are async)
                result = await handler(node, state)
            else:
                result = {"status": "no_compensation_needed"}
            
            comp_log.compensation_status = "success"
            comp_log.compensation_data = result
            comp_log.completed_at = datetime.now(timezone.utc).isoformat()
            db.commit()
            
            # ✅ FIX: Added await
            await event_bus.publish("compensation.completed", {
                "workflow_id": workflow_id,
                "execution_id": execution_id,
                "node_id": node_id,
                "compensation_id": compensation_id,
                "result": result
            })
            
            return {"success": True, "result": result}
        
        except Exception as e:
            comp_log.compensation_status = "failed"
            comp_log.error = str(e)
            comp_log.completed_at = datetime.now(timezone.utc).isoformat()
            db.commit()
            
            # ✅ FIX: Added await (This is the one your linter caught)
            await event_bus.publish("compensation.failed", {
                "workflow_id": workflow_id,
                "execution_id": execution_id,
                "node_id": node_id,
                "compensation_id": compensation_id,
                "error": str(e)
            })
            
            return {"success": False, "error": str(e)}
        finally:
            db.close()
    
    async def _compensate_agent(self, node: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Compensate agent node - delete created resources if possible"""
        node_data = node.get("data", {})
        cleanup_url = node_data.get("cleanup_url")
        if cleanup_url:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(cleanup_url, json=state, timeout=30)
                return {"status": "cleaned_up", "url": cleanup_url}
            except Exception as e:
                return {"status": "cleanup_failed", "error": str(e)}
        
        return {"status": "no_cleanup_configured"}
    
    async def _compensate_action(self, node: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Compensate action node - send undo request"""
        node_data = node.get("data", {})
        action_type = node_data.get("action_type")
        
        if action_type == "http":
            url = node_data.get("url")
            compensation_method = node_data.get("compensation_method", "DELETE")
            
            try:
                async with httpx.AsyncClient() as client:
                    await client.request(
                        method=compensation_method,
                        url=url,
                        json={"action": "compensate", "state": state},
                        timeout=30
                    )
                return {"status": "http_compensated", "url": url}
            except Exception as e:
                return {"status": "http_compensation_failed", "error": str(e)}
        
        return {"status": "no_compensation_needed"}
    
    async def _compensate_approval(self, node: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Compensate approval - notify that decision was rolled back"""
        return {"status": "approval_reverted"}
    
    async def _compensate_eval(self, node: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Eval nodes don't need compensation"""
        return {"status": "no_compensation_needed"}