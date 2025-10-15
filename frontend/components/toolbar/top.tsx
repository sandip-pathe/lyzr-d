"use client";

import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/lib/store";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Save,
  Download,
  Upload,
  Layout,
  Sidebar,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  mockNodes,
  mockEdges,
  mockEventHubNodes,
  mockEventHubEdges,
  mockEvents,
} from "@/lib/mock-data";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function ExecutionToolbar() {
  const {
    mode,
    setMode,
    workflowName,
    toggleLeftSidebar,
    toggleRightSidebar,
    toggleBottomPanel,
    leftSidebarOpen,
    rightSidebarOpen,
    bottomPanelOpen,
    setNodes,
    setEdges,
    layoutType,
    addEvent,
    clearEvents,
    resetWorkflow,
    nodes,
    edges,
    workflowId,
  } = useWorkflowStore();

  const [executionTime, setExecutionTime] = useState("00:00:00");
  const [completedNodes, setCompletedNodes] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const handlePause = () => {
    setMode("paused");
  };

  const handleLoadTemplate = () => {
    if (layoutType === "dag") {
      setNodes(mockNodes);
      setEdges(mockEdges);
    } else {
      setNodes(mockEventHubNodes);
      setEdges(mockEventHubEdges);
    }
  };

  const queryClient = useQueryClient();

  // --- MUTATION FOR EXECUTING THE WORKFLOW ---
  const executeMutation = useMutation({
    mutationFn: (inputData: any) => {
      if (!workflowId) {
        throw new Error("No workflow ID is set.");
      }
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input_data: inputData }),
        }
      ).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to start workflow execution.");
        }
        return res.json();
      });
    },
    onSuccess: (data) => {
      toast.success("Workflow execution started!", {
        description: `Execution ID: ${data.execution_id}`,
      });
      setMode("executing");
      clearEvents();
    },
    onError: (error) => toast.error(`Execution failed: ${error.message}`),
  });

  // --- MUTATION FOR SAVING THE WORKFLOW ---
  const saveMutation = useMutation({
    mutationFn: () => {
      if (!workflowId) {
        throw new Error("No workflow ID is set.");
      }
      const payload = {
        name: workflowName,
        description: "Updated from the UI",
        nodes: nodes.map(({ id, type, position, data }) => ({
          id,
          type,
          position,
          data,
        })),
        edges: edges.map(({ id, source, target }) => ({ id, source, target })),
      };
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      ).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to save the workflow.");
        }
        return res.json();
      });
    },
    onSuccess: () => {
      toast.success("Workflow saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
    },
    onError: (error) => toast.error(`Save failed: ${error.message}`),
  });

  const handleExecute = () => {
    executeMutation.mutate({});
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleStop = () => {
    setMode("design");
    clearEvents();
  };

  const handleReset = () => {
    if (confirm("Reset workflow to default state?")) {
      resetWorkflow();
      setNodes(mockNodes);
      setEdges(mockEdges);
    }
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      {/* Left Section - Workflow Info */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {workflowName}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span
              className={cn(
                "px-2 py-0.5 rounded-full font-medium",
                mode === "design" && "bg-gray-100 text-gray-700",
                mode === "executing" &&
                  "bg-blue-100 text-blue-700 animate-pulse",
                mode === "completed" && "bg-green-100 text-green-700",
                mode === "failed" && "bg-red-100 text-red-700"
              )}
            >
              {mode.toUpperCase()}
            </span>
            <span>{layoutType === "dag" ? "DAG Mode" : "Event Hub Mode"}</span>
          </div>
        </div>
      </div>

      {/* Center Section - Execution Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleExecute}
          disabled={mode === "executing" || executeMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {executeMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Run
        </Button>

        <Button
          variant="outline"
          onClick={handlePause}
          disabled={mode !== "executing"}
        >
          <Pause className="w-4 h-4 mr-2" />
          Pause
        </Button>

        <Button
          variant="outline"
          onClick={handleStop}
          disabled={mode === "design"}
        >
          <Square className="w-4 h-4 mr-2" />
          Stop
        </Button>

        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={saveMutation.isPending || !workflowId}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save
        </Button>

        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* View Controls */}
        <Button
          variant={leftSidebarOpen ? "default" : "outline"}
          size="sm"
          onClick={toggleLeftSidebar}
        >
          <Sidebar className="w-4 h-4" />
        </Button>

        <Button
          variant={rightSidebarOpen ? "default" : "outline"}
          size="sm"
          onClick={toggleRightSidebar}
        >
          <Sidebar className="w-4 h-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
}
