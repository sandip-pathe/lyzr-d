import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from app.temporal.activities import (
    execute_agent_node,
    execute_http_request,
    send_approval_request
)
from app.core.config import settings
from app.temporal.workflows import OrchestrationWorkflow

async def run_worker():
    """Run Temporal worker to execute workflows"""
    client = await Client.connect(settings.TEMPORAL_HOST, namespace=settings.TEMPORAL_NAMESPACE,)
    
    worker = Worker(
        client,
        task_queue="orchestrator-tasks",
        workflows=[OrchestrationWorkflow],
        activities=[
            execute_agent_node,
            execute_http_request,
            send_approval_request,
        ],
        activity_executor=None,  # keep default
    )
    # Ensure registration names match function.__name__ or set names param if custom
    
    print("🏃 Temporal worker started")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(run_worker())



