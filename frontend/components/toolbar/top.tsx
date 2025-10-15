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

  const handleStop = () => {
    setMode("design");
    clearEvents();
  };

  const handleReset = () => {
    if (confirm("Reset workflow to default state?")) {
      resetWorkflow();
      if (layoutType === "dag") {
        setNodes(mockNodes);
        setEdges(mockEdges);
      } else {
        setNodes(mockEventHubNodes);
        setEdges(mockEventHubEdges);
      }
    }
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

  const executeMutation = useMutation({
    mutationFn: (inputData: any) => {
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input_data: inputData }),
        }
      ).then((res) => res.json());
    },
    onSuccess: (data) => {
      toast.success("Workflow execution started!");
      setMode("executing");
      clearEvents();
    },
    onError: (error) => toast.error(`Execution failed: ${error.message}`),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
        }
      );
    },
    onSuccess: () => {
      toast.success("Workflow saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
    },
    onError: (error) => toast.error(`Save failed: ${error.message}`),
  });

  const handleExecute = () => {
    if (!workflowId) return;
    executeMutation.mutate({});
  };

  const handleSave = () => {
    if (!workflowId) return;
    saveMutation.mutate();
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
          disabled={mode === "executing"}
          className="bg-green-600 hover:bg-green-700"
        >
          <Play className="w-4 h-4 mr-2" />
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

        <Separator orientation="vertical" className="h-8" />

        {/* Execution Stats */}
        {mode !== "design" && (
          <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-md text-sm">
            <div>
              <span className="text-gray-600">Duration:</span>{" "}
              <span className="font-mono font-semibold">{executionTime}</span>
            </div>
            <div>
              <span className="text-gray-600">Nodes:</span>{" "}
              <span className="font-semibold">{completedNodes}/10</span>
            </div>
            <div>
              <span className="text-gray-600">Cost:</span>{" "}
              <span className="font-semibold text-green-600">
                ${totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleLoadTemplate}>
          <Upload className="w-4 h-4 mr-2" />
          Load Template
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={saveMutation.status === "pending" || !workflowId}
        >
          {saveMutation.status === "pending" ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save
            </>
          )}
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

        <Button
          variant={bottomPanelOpen ? "default" : "outline"}
          size="sm"
          onClick={toggleBottomPanel}
        >
          <Layout className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
