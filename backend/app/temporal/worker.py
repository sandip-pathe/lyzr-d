"""Temporal worker - enhanced to register all activities"""
import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from app.core.config import settings
from app.temporal.workflows import OrchestrationWorkflow
from app.temporal.activities import (
    execute_agent_node,
    execute_http_request,
    send_approval_request,
    execute_eval_node,
    execute_fork_node,
    execute_merge_node,
    execute_timer_node,
    execute_event_node,
    execute_meta_node
)

async def main():
    """Start Temporal worker"""
    client = await Client.connect(
        settings.TEMPORAL_HOST,
        namespace=settings.TEMPORAL_NAMESPACE
    )
    
    worker = Worker(
        client,
        task_queue="orchestration-queue",
        workflows=[OrchestrationWorkflow],
        activities=[
            execute_agent_node,
            execute_http_request,
            send_approval_request,
            execute_eval_node,
            execute_fork_node,
            execute_merge_node,
            execute_timer_node,
            execute_event_node,
            execute_meta_node
        ]
    )
    
    activities_list = [
        execute_agent_node,
        execute_http_request,
        send_approval_request,
        execute_eval_node,
        execute_fork_node,
        execute_merge_node,
        execute_timer_node,
        execute_event_node,
        execute_meta_node
    ]
    print(f"Registered activities ⚡: {[a.__name__ for a in activities_list]}")
    
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
