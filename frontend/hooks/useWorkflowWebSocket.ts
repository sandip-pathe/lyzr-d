"use client";

import { useEffect, useRef } from "react";
import { ExecutionEvent } from "@/types/workflow";
import { useWorkflowStore } from "@/lib/store";

interface WebSocketMessage {
  type: "event" | "status" | "error";
  data: any;
}

export function useWorkflowWebSocket(
  workflowId: string | null,
  enabled: boolean = true
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const { addEvent, updateNodeStatus, setWsConnected } = useWorkflowStore();

  useEffect(() => {
    if (!workflowId || !enabled) {
      return;
    }

    const connect = () => {
      try {
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/events/ws/workflows/${workflowId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("[WebSocket] Connected to workflow", workflowId);
          setWsConnected(true);
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);

            switch (message.type) {
              case "event":
                const executionEvent: ExecutionEvent = message.data;
                addEvent(executionEvent);

                // Update node status based on event
                if (executionEvent.eventType === "started") {
                  updateNodeStatus(executionEvent.nodeId, "running");
                } else if (executionEvent.eventType === "completed") {
                  updateNodeStatus(executionEvent.nodeId, "completed");
                } else if (executionEvent.eventType === "failed") {
                  updateNodeStatus(executionEvent.nodeId, "failed");
                } else if (executionEvent.eventType === "approval_requested") {
                  updateNodeStatus(executionEvent.nodeId, "waiting_approval");
                }
                break;

              case "status":
                // Handle workflow status updates
                console.log("[WebSocket] Workflow status:", message.data);
                break;

              case "error":
                console.error("[WebSocket] Error:", message.data);
                break;
            }
          } catch (error) {
            console.error("[WebSocket] Failed to parse message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("[WebSocket] Error:", error);
          setWsConnected(false);
        };

        ws.onclose = () => {
          console.log("[WebSocket] Connection closed");
          setWsConnected(false);

          // Attempt to reconnect
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttemptsRef.current),
              10000
            );
            console.log(`[WebSocket] Reconnecting in ${delay}ms...`);

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current += 1;
              connect();
            }, delay);
          } else {
            console.error("[WebSocket] Max reconnection attempts reached");
          }
        };

        wsRef.current = ws;
      } catch (error) {
        console.error("[WebSocket] Failed to connect:", error);
        setWsConnected(false);
      }
    };

    connect();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsConnected(false);
    };
  }, [workflowId, enabled, addEvent, updateNodeStatus, setWsConnected]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    send: (data: any) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(data));
      }
    },
  };
}
