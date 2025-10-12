import httpx
from openai import AsyncOpenAI
from app.core.config import settings

class AgentExecutor:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    def resolve_input(self, mapping: dict, state: dict) -> dict:
        """Resolve template variables in input mapping"""
        result = {}
        for key, template in mapping.items():
            # Simple template resolution: "{{node_id.field}}"
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
    
    async def execute(self, provider: str, agent_id: str, input_data: dict) -> dict:
        """Execute agent based on provider"""
        if provider == "openai":
            return await self._execute_openai(agent_id, input_data)
        elif provider == "lyzr":
            return await self._execute_lyzr(agent_id, input_data)
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    async def _execute_openai(self, assistant_id: str, input_data: dict) -> dict:
        thread = await self.openai_client.beta.threads.create()

        await self.openai_client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=input_data.get("text", str(input_data)) or "",
        )

        run = await self.openai_client.beta.threads.runs.create_and_poll(
            thread_id=thread.id,
            assistant_id=assistant_id,
        )

        if run.status == "requires_action":
            # If tools are enabled on the Assistant, handle tool outputs then poll again
            run = await self.openai_client.beta.threads.runs.submit_tool_outputs_and_poll(
                thread_id=thread.id,
                run_id=run.id,
                tool_outputs=[],
            )

        if run.status == "completed":
            messages = await self.openai_client.beta.threads.messages.list(thread_id=thread.id, order="desc", limit=1)
            content = messages.data[0].content[0].text.value if messages.data and messages.data[0].content else ""
            return {"output": content, "status": "success"}
        
        return {"output": None, "status": "failed", "error": run.status}   
    
    async def _execute_lyzr(self, agent_id: str, input_data: dict) -> dict:
        """Execute Lyzr Agent"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.lyzr.ai/v1/agents/{agent_id}/run",
                headers={"Authorization": f"Bearer {settings.LYZR_API_KEY}"},
                json={"input": input_data}
            )
            return response.json()
