"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkflowStore } from "@/lib/store";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Save,
  Download,
  Sidebar,
  Loader2,
  Square,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mockNodes, mockEdges } from "@/lib/mock-data";
import { RunWorkflowModal } from "./run-wf-modal";

export function ExecutionToolbar() {
  const {
    mode,
    setMode,
    workflowName,
    toggleLeftSidebar,
    toggleRightSidebar,
    leftSidebarOpen,
    rightSidebarOpen,
    setNodes,
    setEdges,
    nodes,
    edges,
    workflowId,
    setExecutionId,
    clearEvents,
  } = useWorkflowStore();
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const executeMutation = useMutation({
    mutationFn: (inputData: any) => {
      if (!workflowId) throw new Error("No workflow ID.");
      return fetch(`http://localhost:8000/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_data: inputData }),
      }).then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error("Failed to start execution."))
      );
    },
    onSuccess: (data) => {
      toast.success("Execution started!", {
        description: `ID: ${data.execution_id}`,
      });
      setExecutionId(data.execution_id);
      setMode("executing");
      clearEvents();
      setIsRunModalOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!workflowId) throw new Error("No workflow ID.");
      const payload = {
        name: workflowName,
        nodes: nodes.map(({ id, type, position, data }) => ({
          id,
          type,
          position,
          data,
        })),
        edges: edges.map(({ id, source, target }) => ({ id, source, target })),
      };
      return fetch(`http://localhost:8000/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Failed to save."))
      );
    },
    onSuccess: () => {
      toast.success("Workflow saved!");
      queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-10 bg-black p-2 rounded-xl flex items-center gap-2 text-white">
        <TooltipProvider>
          <div className="px-3">
            <h1 className="text-sm font-semibold">{workflowName}</h1>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Button
            onClick={() => setIsRunModalOpen(true)}
            disabled={mode === "executing" || executeMutation.isPending}
            className="bg-gray-50 hover:bg-gray-100 text-green-900"
          >
            {executeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span className="ml-1">Run</span>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="bg-gray-700 text-white hover:bg-gray-600"
                size="icon"
                onClick={() => setMode("design")}
                disabled={mode === "design"}
              >
                <Square className="w-4 h-4" color="white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Stop Execution</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-6" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("Reset canvas to default?")) {
                    setNodes(mockNodes);
                    setEdges(mockEdges);
                  }
                }}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset Canvas</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-6" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={leftSidebarOpen ? "secondary" : "ghost"}
                size="icon"
                onClick={toggleLeftSidebar}
              >
                <Sidebar className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Left Panel</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={rightSidebarOpen ? "secondary" : "ghost"}
                size="icon"
                onClick={toggleRightSidebar}
              >
                <Sidebar className="w-4 h-4 rotate-180" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Right Panel</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <RunWorkflowModal
        open={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onRun={(data) => executeMutation.mutate(data)}
        isExecuting={executeMutation.isPending}
      />
    </>
  );
}
