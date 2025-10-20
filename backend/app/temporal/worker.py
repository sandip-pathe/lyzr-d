# backend/app/temporal/worker.py

import asyncio
import os
from temporalio.client import Client
from temporalio.service import TLSConfig
from temporalio.worker import Worker
from app.core.config import settings
from app.temporal.workflows import OrchestrationWorkflow

# Import ALL necessary activities
from app.temporal.activities import (
    compensate_node,
    execute_agent_node,
    execute_api_call_node, # Use the new name
    execute_eval_node,
    execute_event_node,
    execute_merge_node,
    execute_meta_node,
    execute_timer_node,
    get_fallback_agent,
    publish_generic_event, # Add the new activity
    publish_workflow_status,
    request_ui_approval,
    send_approval_request # Keep if used for external, else maybe remove
)

async def main():
    """Start Temporal worker"""
    print("🔨 Starting Temporal Worker...")
    print(f"📡 Connecting to: {settings.TEMPORAL_HOST}")
    print(f"🔧 Namespace: {settings.TEMPORAL_NAMESPACE}")
    
    # Modern approach: API Key authentication (recommended)
    if settings.TEMPORAL_API_KEY:
        print("� Using API Key authentication for Temporal Cloud")
        client = await Client.connect(
            settings.TEMPORAL_HOST,
            namespace=settings.TEMPORAL_NAMESPACE,
            api_key=settings.TEMPORAL_API_KEY,
        )
    # Legacy approach: mTLS certificates
    elif settings.TEMPORAL_TLS_CERT and settings.TEMPORAL_TLS_KEY:
        print("🔐 Using mTLS certificate authentication")
        with open(settings.TEMPORAL_TLS_CERT, 'rb') as f:
            client_cert = f.read()
        with open(settings.TEMPORAL_TLS_KEY, 'rb') as f:
            client_key = f.read()
        tls_config = TLSConfig(
            client_cert=client_cert,
            client_private_key=client_key,
        )
        client = await Client.connect(
            settings.TEMPORAL_HOST,
            namespace=settings.TEMPORAL_NAMESPACE,
            tls=tls_config
        )
    # Local development: no authentication
    else:
        print("⚠️  Connecting without authentication (local development only)")
        client = await Client.connect(
            settings.TEMPORAL_HOST,
            namespace=settings.TEMPORAL_NAMESPACE
        )
    
    print("✅ Connected to Temporal!")

    # Define the list of all activities to register
    activities_list = [
        compensate_node,
        execute_agent_node,
        execute_api_call_node,
        execute_eval_node,
        execute_event_node,
        execute_merge_node,
        execute_meta_node,
        execute_timer_node,
        get_fallback_agent,
        publish_generic_event, # Register the new activity
        publish_workflow_status,
        request_ui_approval,
        send_approval_request # Keep if still needed
        # Remove execute_http_request, execute_fork_node
    ]

    worker = Worker(
        client,
        task_queue="orchestration-queue",
        workflows=[OrchestrationWorkflow],
        activities=activities_list # Pass the full list
    )

    print(f"⚡ Registered activities: {[a.__name__ for a in activities_list]}")
    print("🚀 Worker is now polling for tasks...")

    await worker.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Worker shutting down...")