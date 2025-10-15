"use client";

import { useEffect, useRef } from "react";
import { ExecutionEvent } from "@/types/workflow";
import { useWorkflowStore } from "@/lib/store";
import { toast } from "sonner";

interface WebSocketMessage {
  event_type: string;
  data: string; // The data from Redis is a JSON string
  timestamp: string;
}

export function useWorkflowWebSocket(
  executionId: string | null,
  enabled: boolean = true
) {
  const wsRef = useRef<WebSocket | null>(null);
  const { addEvent, updateNodeStatus, setWsConnected, setMode } =
    useWorkflowStore();

  useEffect(() => {
    if (!executionId || !enabled) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const wsUrl = `ws://localhost:8000/events/ws/executions/${executionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[WebSocket] Connected for execution", executionId);
      setWsConnected(true);
      toast.info("Real-time connection established.");
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const eventData = JSON.parse(message.data); // Parse the inner data string

        const executionEvent: ExecutionEvent = {
          id: `${eventData.node_id}-${message.timestamp}`,
          workflowId: eventData.workflow_id,
          executionId: eventData.execution_id,
          nodeId: eventData.node_id,
          eventType: message.event_type.split(".")[1] as any, // "node.completed" -> "completed"
          timestamp: new Date(
            parseFloat(message.timestamp) * 1000
          ).toISOString(),
          data: eventData.result || eventData.error,
        };

        addEvent(executionEvent);

        // Update node status based on event
        if (executionEvent.nodeId) {
          if (executionEvent.eventType === "started") {
            updateNodeStatus(executionEvent.nodeId, "running");
          } else if (executionEvent.eventType === "completed") {
            updateNodeStatus(executionEvent.nodeId, "completed");
          } else if (executionEvent.eventType === "failed") {
            updateNodeStatus(executionEvent.nodeId, "failed");
          }
        }

        // Handle workflow-level events
        if (message.event_type === "workflow.completed") {
          toast.success("Workflow Completed Successfully!");
          setMode("completed");
        }
        if (message.event_type === "workflow.failed") {
          toast.error("Workflow Failed", {
            description: eventData.error,
          });
          setMode("failed");
        }
      } catch (error) {
        console.error("[WebSocket] Failed to parse message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
      toast.error("WebSocket connection error.");
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log("[WebSocket] Connection closed");
      setWsConnected(false);
    };

    wsRef.current = ws;

    // Cleanup on component unmount or when executionId changes
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [
    executionId,
    enabled,
    addEvent,
    updateNodeStatus,
    setWsConnected,
    setMode,
  ]);
}
