"use client";

import { useEffect, useState } from "react";
import { useWorkflowWebSocket } from "@/hooks/useWorkflowWebSocket";
import { useWorkflow } from "@/hooks/useWorkflow";
import { motion, AnimatePresence } from "framer-motion";
import { ApprovalModal } from "@/components/modals/approval";
import { EventLogStream } from "@/components/sidebar/event-log";
import { NodePalette } from "@/components/sidebar/node-pallete";
import { PropertiesPanel } from "@/components/sidebar/properties";
import { WorkflowCanvas } from "@/components/ui/canvas/canvas";
import { useWorkflowStore } from "@/lib/store";
import { ExecutionToolbar } from "@/components/toolbar/top";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApprovalRequest } from "@/types/workflow";

// This is the main component for the workflow editor.
// It takes 'params' from the URL, which contains the workflow ID.
export default function WorkflowEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const queryClient = useQueryClient();
  const workflowId = params.id;

  const {
    mode,
    leftSidebarOpen,
    rightSidebarOpen,
    setWorkflowId,
    executionId,
    currentApproval,
    setCurrentApproval,
  } = useWorkflowStore();

  useEffect(() => {
    setWorkflowId(workflowId);
  }, [workflowId, setWorkflowId]);

  const { isLoading, error } = useWorkflow(workflowId);

  // --- Connect to the WebSocket for real-time events on the current execution ---
  useWorkflowWebSocket(executionId, mode === "executing" || mode === "paused");

  // --- Mutation for responding to an approval request ---
  const respondToApprovalMutation = useMutation({
    mutationFn: ({
      action,
      comment,
    }: {
      action: "approve" | "reject";
      comment: string;
    }) => {
      if (!currentApproval) throw new Error("No approval request is active.");
      return fetch(
        `http://localhost:8000/approvals/${currentApproval.executionId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            approver: "user@hackathon.dev",
            comment,
          }),
        }
      ).then((res) => {
        if (!res.ok) throw new Error("Failed to respond to approval.");
        return res.json();
      });
    },
    onSuccess: (data) => {
      toast.success(`Request ${data.status}!`);
      setCurrentApproval(null); // Close the modal
    },
    onError: (error) => toast.error(error.message),
  });

  const handleApprove = (comment: string) => {
    respondToApprovalMutation.mutate({ action: "approve", comment });
  };

  const handleReject = (comment: string) => {
    respondToApprovalMutation.mutate({ action: "reject", comment });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600 animate-pulse">
          Loading Workflow...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50 text-red-700">
        <p className="text-lg">Error loading workflow: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <ExecutionToolbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Switches between Palette and Event Log */}
        <AnimatePresence>
          {leftSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 overflow-hidden"
            >
              {mode === "executing" ||
              mode === "completed" ||
              mode === "failed" ? (
                <EventLogStream />
              ) : (
                <NodePalette />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Canvas */}
        <div className="flex-1 relative">
          <WorkflowCanvas />
        </div>

        {/* Right Sidebar */}
        <AnimatePresence>
          {rightSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <PropertiesPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Approval Modal: This is now driven by real data from the WebSocket */}
      <ApprovalModal
        approval={currentApproval}
        open={!!currentApproval}
        onClose={() => setCurrentApproval(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
