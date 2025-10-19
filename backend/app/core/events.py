#core/events.py
import redis.asyncio as redis
import json
import asyncio
import time
from typing import Callable, Dict, Any, List, Optional, Union, cast
from datetime import datetime
from uuid import uuid4
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.event_log import EventLog

class EventBus:
    def __init__(self):
        self.redis_client = redis.from_url(
            settings.REDIS_URL, decode_responses=True
        )
        self.pubsub = self.redis_client.pubsub()
        self.listeners: Dict[str, List[Callable]] = {}

    async def publish(self, event_type: str, data: Dict[str, Any]):
        timestamp = time.time()
        # Ensure data is a JSON string
        data_str = json.dumps(data)
        timestamp_str = str(timestamp)

        # Explicitly type the message for xadd
        # Redis stream fields must be Dict[str | bytes, str | bytes]
        # Our redis client decodes responses, so we should provide strings.
        message_fields: Dict[str, str] = {
            "event_type": event_type,
            "data": data_str,
            "timestamp": timestamp_str,
        }
        await self.redis_client.publish(event_type, json.dumps(message_fields)) 
        workflow_id = data.get("workflow_id")
        execution_id = data.get("execution_id")

        if workflow_id:
            stream_key = f"workflow:{workflow_id}:events"
            # Pass the correctly typed dictionary to xadd (cast to Any to satisfy redis-py generics)
            await self.redis_client.xadd(stream_key, cast(Any, message_fields), maxlen=10000)

        if execution_id:
            stream_key = f"execution:{execution_id}:events"
            # Pass the correctly typed dictionary to xadd (cast to Any to satisfy redis-py generics)
            await self.redis_client.xadd(stream_key, cast(Any, message_fields), maxlen=5000)

        # Persist original data (not the double-stringified one)
        await asyncio.to_thread(self._persist_to_db, event_type, data, timestamp)
        print(f"📤 Event published: {event_type}")

    def _persist_to_db(self, event_type: str, data: Dict[str, Any], timestamp: float):
        try:
            db = SessionLocal()
            event_log = EventLog(id=str(uuid4()), workflow_id=data.get("workflow_id", ""), execution_id=data.get("execution_id", ""), node_id=data.get("node_id"), event_type=event_type, event_data=data, timestamp=datetime.fromtimestamp(timestamp))
            db.add(event_log)
            db.commit()
            db.close()
        except Exception as e:
            print(f"⚠️ Failed to persist event to DB: {e}")

    async def subscribe(self, event_type: str, callback: Callable):
        if event_type not in self.listeners:
            self.listeners[event_type] = []
            await self.pubsub.subscribe(event_type)
        self.listeners[event_type].append(callback)
        print(f"📥 Subscribed to: {event_type}")

    async def listen(self):
        # ... (implementation as before) ...
        async for message in self.pubsub.listen():
            if message["type"] == "message":
                try:
                    # Message data is the full structure published now
                    full_data = json.loads(message["data"])
                    event_type = full_data["event_type"]
                    if event_type in self.listeners:
                        for callback in self.listeners[event_type]:
                            if asyncio.iscoroutinefunction(callback):
                                # Pass the full data structure including timestamp etc.
                                await callback(full_data)
                except Exception as e:
                    print(f"❌ Event listener error: {e}")


    async def replay_from_stream(self, stream_key: str, start_id: str = "-", end_id: str = "+", count: Optional[int] = None) -> List[Dict[str, Any]]:
        # ... (implementation as before) ...
        try:
            events = await self.redis_client.xrange(stream_key, min=start_id, max=end_id, count=count)
            # Ensure data field is parsed correctly
            parsed_events = []
            for event_id, data in events:
                parsed_data = {}
                try:
                    if isinstance(data.get("data"), str):
                        parsed_data = json.loads(data.get("data", "{}"))
                    elif isinstance(data.get("data"), dict): # If already a dict (unlikely with decode_responses=True)
                        parsed_data = data.get("data", {})
                except json.JSONDecodeError:
                     parsed_data = {"error": "Failed to parse data field"}

                parsed_events.append({
                     "id": event_id,
                     "timestamp": float(data.get("timestamp", 0)),
                     "event_type": data.get("event_type"),
                     "data": parsed_data # Use the parsed data
                })
            return parsed_events
        except Exception as e:
            print(f"❌ Failed to replay stream {stream_key}: {e}")
            return []

    async def replay_workflow_events(self, workflow_id: str, from_timestamp: Optional[float] = None) -> List[Dict[str, Any]]:
        # ... (implementation as before) ...
        stream_key = f"workflow:{workflow_id}:events"
        start_id = f"{int(from_timestamp * 1000)}-0" if from_timestamp else "-"
        return await self.replay_from_stream(stream_key, start_id=start_id)

    async def replay_execution_events(self, execution_id: str, from_timestamp: Optional[float] = None) -> List[Dict[str, Any]]:
        # ... (implementation as before) ...
        stream_key = f"execution:{execution_id}:events"
        start_id = f"{int(from_timestamp * 1000)}-0" if from_timestamp else "-"
        return await self.replay_from_stream(stream_key, start_id=start_id)


event_bus = EventBus()