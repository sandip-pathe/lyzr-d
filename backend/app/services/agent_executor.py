"""Agent executor with parameter auto-tuning"""
from typing import Optional
import httpx
from openai import AsyncOpenAI
from app.core.config import settings
from app.services.self_healing import SelfHealingService
import time
import logging

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
            if isinstance(template, str) and "{{" in template and "}}" in template:
                # Basic string interpolation for now
                for state_key, state_value in state.items():
                    if isinstance(state_value, dict):
                        for sub_key, sub_value in state_value.items():
                            template = template.replace(f"{{{{{state_key}.{sub_key}}}}}", str(sub_value))
                    else:
                        template = template.replace(f"{{{{{state_key}}}}}", str(state_value))
                result[key] = template
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
            elif provider in ["anthropic", "custom"]:
                # Placeholder for other providers
                result = await self._execute_custom(provider, agent_id, input_data)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
            
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
        messages = input_data.get("messages")
        if not messages:
            prompt = input_data.get("prompt", "")
            messages = [{"role": "user", "content": prompt}]

        params = {
            "model": agent_id,
            "messages": messages
        }

        if temperature is not None:
            params["temperature"] = temperature

        response = await self.openai_client.chat.completions.create(**params)
        cost = 0
        if response.usage:
            cost = ((response.usage.prompt_tokens * 0.15) + (response.usage.completion_tokens * 0.6)) / 1_000_000

        return {
            "output": response.choices[0].message.content,
            "model": agent_id,
            "cost": cost,
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
        logging.getLogger(__name__).info(f"Executing custom agent '{agent_id}' from provider '{provider}'")
        return {"output": f"Mock execution for {agent_id}", "agent_id": agent_id, "cost": 0.0}