"use client";

import { useEffect, useRef } from "react";
import {
  ApprovalRequest,
  ExecutionEvent,
  EventTypeName,
  NodeStatus,
} from "@/types/workflow";
import { useWorkflowStore } from "@/lib/store";
import { toast } from "sonner";

interface WebSocketMessageStructure {
  event_type: string;
  data: string;
  timestamp: string;
}

export function useWorkflowWebSocket(
  executionId: string | null,
  enabled: boolean = true
) {
  const wsRef = useRef<WebSocket | null>(null);
  const {
    addEvent,
    updateNodeStatus,
    setWsConnected,
    setMode,
    setCurrentApproval,
    setOutput,
  } = useWorkflowStore();

  useEffect(() => {
    if (!executionId || !enabled) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setWsConnected(false);
      }
      return;
    }

    const wsUrl = `ws://localhost:8000/events/ws/executions/${executionId}`;
    console.log("[WebSocket] Attempting to connect to:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[WebSocket] Connected for execution", executionId);
      setWsConnected(true);
      toast.info("Real-time connection established.");
    };

    ws.onmessage = (event) => {
      try {
        // 1. Parse the outer message structure
        const outerMessage: WebSocketMessageStructure = JSON.parse(event.data);
        const event_type = outerMessage.event_type;
        const timestampStr = outerMessage.timestamp; // String float timestamp
        const innerDataString = outerMessage.data; // Inner data payload as JSON string

        // 2. Parse the inner data payload
        const eventData = JSON.parse(innerDataString || "{}");

        // Derive event type suffix (e.g., 'started', 'completed')
        const eventTypeSuffix = event_type.includes(".")
          ? event_type.split(".").pop()
          : event_type;

        const executionEvent: ExecutionEvent = {
          // Generate a more robust unique ID
          id: `${eventData.execution_id}-${
            eventData.node_id || "workflow"
          }-${event_type}-${timestampStr}`,
          workflowId: eventData.workflow_id,
          executionId: eventData.execution_id,
          nodeId: eventData.node_id, // Can be undefined for workflow events
          eventType: event_type as EventTypeName, // Use the full event type string
          timestamp: new Date(parseFloat(timestampStr) * 1000).toISOString(),
          // Use result on completed, error on failed, otherwise keep the whole payload for context
          data: eventData.result ?? eventData.error ?? eventData,
          error: eventData.error, // Explicitly store error if present
        };

        addEvent(executionEvent);

        // Update node status based on event type
        if (executionEvent.nodeId && eventTypeSuffix) {
          // Mapping event suffixes to NodeStatus
          const statusMap: Record<string, NodeStatus> = {
            started: "running",
            completed: "completed",
            failed: "failed",
            requested: "waiting_approval", // For approval.requested
            // Add mappings for granted/denied if needed for UI
            granted: "completed", // Or a custom 'approved' status
            denied: "failed", // Or a custom 'rejected' status
          };
          const newStatus = statusMap[eventTypeSuffix];
          if (newStatus) {
            updateNodeStatus(executionEvent.nodeId, newStatus);
          }
        }

        // Handle workflow completion/failure
        if (event_type === "workflow.completed") {
          toast.success("Workflow Completed Successfully!");
          setMode("completed");
          // Use eventData.result from the inner payload
          setOutput({ status: "completed", result: eventData.result });
          ws.close(); // Close WS on completion
        } else if (event_type === "workflow.failed") {
          toast.error("Workflow Failed", {
            description: eventData.error || "Unknown error",
          });
          setMode("failed");
          // Use eventData.error from the inner payload
          setOutput({ status: "failed", result: eventData.error });
          ws.close(); // Close WS on failure
        }

        // Handle UI Approval Request
        // Use the specific event type from activities.py
        if (event_type === "ui.approval.requested") {
          const approvalRequest: ApprovalRequest = {
            id: eventData.approval_id, // Use the ID from the event data
            executionId: eventData.execution_id,
            nodeId: eventData.node_id,
            title: eventData.title || "Approval Required", // Use title from event
            description: eventData.description || "Please review.", // Use description
            context: eventData.context || {}, // Use context from event
            status: "pending",
            requestedAt: executionEvent.timestamp, // Use event timestamp
          };
          updateNodeStatus(eventData.node_id, "waiting_approval"); // Ensure node shows waiting status
          setCurrentApproval(approvalRequest);
        }
      } catch (error) {
        console.error(
          "[WebSocket] Failed to parse message:",
          error,
          "Raw data:",
          event.data
        );
        toast.error("Failed to process workflow event.");
      }
    };

    ws.onerror = (errorEvent) => {
      console.error("[WebSocket] Error:", errorEvent);
      toast.error("WebSocket connection error.");
      setWsConnected(false);
      setMode("failed"); // Consider the execution failed if WS disconnects unexpectedly
    };

    ws.onclose = (closeEvent) => {
      console.log(
        "[WebSocket] Connection closed",
        closeEvent.code,
        closeEvent.reason
      );
      setWsConnected(false);
      // Don't automatically set to failed/completed here unless the code indicates an error
      if (closeEvent.code !== 1000 && closeEvent.code !== 1005) {
        // 1000 = Normal closure, 1005 = No status received
        toast.warning("WebSocket connection closed unexpectedly.");
      }
    };

    wsRef.current = ws;

    // Cleanup function
    return () => {
      if (wsRef.current) {
        console.log(
          "[WebSocket] Cleaning up connection for execution",
          executionId
        );
        wsRef.current.close(1000, "Component unmounting"); // Normal closure
        wsRef.current = null;
        setWsConnected(false);
      }
    };
  }, [
    executionId,
    enabled,
    addEvent,
    updateNodeStatus,
    setWsConnected,
    setMode,
    setCurrentApproval,
    setOutput,
  ]);
}
