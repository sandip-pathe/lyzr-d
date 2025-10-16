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
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function WorkflowEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const {
    mode,
    leftSidebarOpen,
    rightSidebarOpen,
    setWorkflowId,
    executionId,
    currentApproval,
    setCurrentApproval,
  } = useWorkflowStore();
  const [isNarrationModalOpen, setIsNarrationModalOpen] = useState(false);

  useEffect(() => {
    setWorkflowId(params.id);
  }, [params.id, setWorkflowId]);

  const { isLoading: isWorkflowLoading, error } = useWorkflow(params.id);
  useWorkflowWebSocket(executionId, mode === "executing" || mode === "paused");

  const respondToApprovalMutation = useMutation({
    mutationFn: ({
      action,
      comment,
    }: {
      action: "approve" | "reject";
      comment: string;
    }) => {
      if (!currentApproval) throw new Error("No approval request active.");
      return fetch(
        `http://localhost:8000/approvals/${currentApproval.executionId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, approver: "demo@user.com", comment }),
        }
      ).then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error("Failed to respond to approval."))
      );
    },
    onSuccess: (data) => {
      toast.success(`Request ${data.status}!`);
      setCurrentApproval(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const {
    data: narrationData,
    isLoading: isNarrationLoading,
    refetch: fetchNarration,
  } = useQuery({
    queryKey: ["narration", executionId],
    queryFn: () =>
      executionId
        ? fetch(`http://localhost:8000/executions/${executionId}/narrate`).then(
            (res) => res.json()
          )
        : null,
    enabled: false,
  });

  if (isWorkflowLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50 text-red-700">
        {error.message}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      <WorkflowCanvas />
      <ExecutionToolbar />

      <AnimatePresence>
        {leftSidebarOpen && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-20 left-4 bottom-4 w-80 bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl border flex flex-col"
          >
            {mode.startsWith("execut") ||
            mode.startsWith("complet") ||
            mode.startsWith("fail") ? (
              <EventLogStream
                onViewReport={() => {
                  fetchNarration();
                  setIsNarrationModalOpen(true);
                }}
              />
            ) : (
              <NodePalette />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rightSidebarOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-20 right-4 bottom-4 w-96 bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl border flex flex-col"
          >
            <PropertiesPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <ApprovalModal
        open={!!currentApproval}
        onClose={() => setCurrentApproval(null)}
        onApprove={(c) =>
          respondToApprovalMutation.mutate({ action: "approve", comment: c })
        }
        onReject={(c) =>
          respondToApprovalMutation.mutate({ action: "reject", comment: c })
        }
        approval={currentApproval}
      />
      {/* You would need to create this NarrationModal component */}
      {/* <NarrationModal
        open={isNarrationModalOpen}
        onClose={() => setIsNarrationModalOpen(false)}
        narration={narrationData?.narration}
        isLoading={isNarrationLoading}
      /> */}
    </div>
  );
}
