import redis
import json
import asyncio
from typing import Callable, Dict, Any
from app.core.config import settings

class EventBus:
    def __init__(self):
        self.redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True
        )
        self.pubsub = self.redis_client.pubsub()
        self.listeners: Dict[str, list[Callable]] = {}
    
    def publish(self, event_type: str, data: Dict[str, Any]):
        """Publish event to Redis"""
        message = {
            "event_type": event_type,
            "data": data,
            "timestamp": asyncio.get_event_loop().time()
        }
        self.redis_client.publish(event_type, json.dumps(message))
        print(f"📤 Event published: {event_type}")
    
    def subscribe(self, event_type: str, callback: Callable):
        """Subscribe to event type"""
        if event_type not in self.listeners:
            self.listeners[event_type] = []
            self.pubsub.subscribe(event_type)
        self.listeners[event_type].append(callback)
        print(f"📥 Subscribed to: {event_type}")
    
    async def listen(self):
        """Listen for events (run in background)"""
        for message in self.pubsub.listen():
            if message["type"] == "message":
                event_type = message["channel"]
                data = json.loads(message["data"])
                
                # Call all callbacks for this event
                if event_type in self.listeners:
                    for callback in self.listeners[event_type]:
                        await callback(data)

# Global event bus instance
event_bus = EventBus()
