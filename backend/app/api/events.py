"""WebSocket events API"""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional, Set, Dict
import asyncio
from app.core.events import event_bus

router = APIRouter(prefix="/events", tags=["events"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)
    
    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)
    
    async def broadcast(self, channel: str, message: dict):
        if channel in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            self.active_connections[channel] -= disconnected

manager = ConnectionManager()

@router.websocket("/ws/workflows/{workflow_id}")
async def websocket_workflow_events(websocket: WebSocket, workflow_id: str):
    await manager.connect(websocket, f"workflow:{workflow_id}")
    try:
        while True:
            await asyncio.sleep(60) # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"workflow:{workflow_id}")

@router.websocket("/ws/executions/{execution_id}")
async def websocket_execution_events(websocket: WebSocket, execution_id: str):
    await manager.connect(websocket, f"execution:{execution_id}")
    try:
        while True:
            await asyncio.sleep(60)
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"execution:{execution_id}")

@router.get("/replay/workflow/{workflow_id}")
async def replay_workflow_events(workflow_id: str, from_timestamp: Optional[float] = Query(None)):
    # FIX: Added await here
    events = await event_bus.replay_workflow_events(workflow_id, from_timestamp)
    return {"workflow_id": workflow_id, "events": events, "count": len(events)}

@router.get("/replay/execution/{execution_id}")
async def replay_execution_events(execution_id: str, from_timestamp: Optional[float] = Query(None)):
    # FIX: Added await here
    events = await event_bus.replay_execution_events(execution_id, from_timestamp)
    return {"execution_id": execution_id, "events": events, "count": len(events)}

async def push_to_websocket_clients(event_data: dict):
    workflow_id = event_data.get("data", {}).get("workflow_id")
    execution_id = event_data.get("data", {}).get("execution_id")

    # Parse the inner 'data' string into an object before broadcasting
    try:
        if isinstance(event_data.get("data"), str):
            event_data["data"] = json.loads(event_data["data"])
    except json.JSONDecodeError:
        pass # Or log an error if parsing fails

    if workflow_id:
        await manager.broadcast(f"workflow:{workflow_id}", event_data)
    if execution_id:
        await manager.broadcast(f"execution:{execution_id}", event_data)
