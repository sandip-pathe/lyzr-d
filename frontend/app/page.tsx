"use client";

import { useEffect } from "react";
import { useWorkflowWebSocket } from "@/hooks/useWorkflowWebSocket";
import { mockNodes, mockEdges, mockApprovalRequest } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ApprovalModal } from "@/components/modals/approval";
import { TimelinePanel } from "@/components/panel/timeline";
import { EventLogStream } from "@/components/sidebar/event-log";
import { NodePalette } from "@/components/sidebar/node-pallete";
import { PropertiesPanel } from "@/components/sidebar/properties";
import { WorkflowCanvas } from "@/components/ui/canvas/canvas";
import { useWorkflowStore } from "@/lib/store";
import { ExecutionToolbar } from "@/components/toolbar/top";

export default function WorkflowPage() {
  const {
    mode,
    leftSidebarOpen,
    rightSidebarOpen,
    setNodes,
    setEdges,
    workflowId,
  } = useWorkflowStore();

  const [approvalOpen, setApprovalOpen] = useState(false);

  // Initialize with mock data
  useEffect(() => {
    setNodes(mockNodes);
    setEdges(mockEdges);
  }, [setNodes, setEdges]);

  // Connect to WebSocket when executing
  useWorkflowWebSocket(workflowId, mode === "executing");

  // Simulate approval request after 5 seconds of execution
  useEffect(() => {
    if (mode === "executing") {
      const timeout = setTimeout(() => {
        setApprovalOpen(true);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [mode]);

  const handleApprove = async (comment: string) => {
    console.log("Approved with comment:", comment);
    // In production: POST /approvals/${approval.id}/approve
  };

  const handleReject = async (comment: string) => {
    console.log("Rejected with comment:", comment);
    // In production: POST /approvals/${approval.id}/reject
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <ExecutionToolbar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <AnimatePresence>
          {leftSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 overflow-hidden"
            >
              {mode === "design" ? <NodePalette /> : <EventLogStream />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
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

      {/* Bottom Timeline Panel */}
      <TimelinePanel />

      {/* Approval Modal */}
      <ApprovalModal
        approval={mockApprovalRequest}
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
