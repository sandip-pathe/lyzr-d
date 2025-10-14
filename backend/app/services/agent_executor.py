"""Agent executor with parameter auto-tuning"""
from typing import Optional
import httpx
from openai import AsyncOpenAI
from app.core.config import settings
from app.services.self_healing import SelfHealingService
import time

class AgentExecutor:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.self_healing = SelfHealingService()
        
        # Auto-tuning parameters
        self.temperature_ranges = {
            "low": 0.3,
            "medium": 0.7,
            "high": 1.0
        }
    
    def resolve_input(self, mapping: dict, state: dict) -> dict:
        """Resolve template variables in input mapping"""
        result = {}
        for key, template in mapping.items():
            if isinstance(template, str) and template.startswith("{{"):
                path = template.strip("{} ").split(".")
                value = state
                for p in path:
                    if isinstance(value, dict):
                        value = value.get(p)
                    else:
                        value = None
                        break
                result[key] = value
            else:
                result[key] = template
        return result
    
    async def execute(
        self, 
        provider: str, 
        agent_id: str, 
        input_data: dict,
        enable_auto_tuning: bool = False,
    previous_eval_score: "Optional[float]" = None
    ) -> dict:
        """Execute agent with auto-tuning support"""
        start_time = time.time()
        
        # Auto-tune temperature based on previous eval score
        temperature = None
        if enable_auto_tuning and previous_eval_score is not None:
            if previous_eval_score < 0.5:
                temperature = self.temperature_ranges["high"]  # More creative
            elif previous_eval_score > 0.9:
                temperature = self.temperature_ranges["low"]  # More deterministic
            else:
                temperature = self.temperature_ranges["medium"]
        
        try:
            if provider == "openai":
                result = await self._execute_openai(agent_id, input_data, temperature)
            elif provider == "lyzr":
                result = await self._execute_lyzr(agent_id, input_data)
            else:
                result = await self._execute_custom(provider, agent_id, input_data)
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Record success
            self.self_healing.record_agent_execution(
                provider=provider,
                agent_id=agent_id,
                success=True,
                latency_ms=latency_ms,
                cost=result.get("cost", 0.0)
            )
            
            return result
        
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            
            # Record failure
            self.self_healing.record_agent_execution(
                provider=provider,
                agent_id=agent_id,
                success=False,
                latency_ms=latency_ms
            )
            
            raise
    
    async def _execute_openai(self, agent_id: str, input_data: dict, temperature: Optional[float] = None) -> dict:
        """Execute OpenAI agent"""
        messages = input_data.get("messages", [{"role": "user", "content": str(input_data)}])
        
        params = {
            "model": agent_id,
            "messages": messages
        }
        
        if temperature is not None: 
            params["temperature"] = temperature
        
        response = await self.openai_client.chat.completions.create(**params)
        
        return {
            "output": response.choices[0].message.content,
            "model": agent_id,
            "usage": response.usage.model_dump() if response.usage else {},
            "temperature_used": temperature
        }
    
    async def _execute_lyzr(self, agent_id: str, input_data: dict) -> dict:
        """Execute Lyzr agent"""
        if not settings.LYZR_API_KEY:
            raise ValueError("LYZR_API_KEY not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.lyzr.ai/v1/agents/{agent_id}/execute",
                json=input_data,
                headers={"Authorization": f"Bearer {settings.LYZR_API_KEY}"},
                timeout=300
            )
            response.raise_for_status()
            return response.json()
    
    async def _execute_custom(self, provider: str, agent_id: str, input_data: dict) -> dict:
        """Execute custom agent via HTTP"""
        # Placeholder for custom agent execution
        return {"output": "Custom agent execution", "agent_id": agent_id}
