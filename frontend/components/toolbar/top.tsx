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
  Download,
  Sidebar,
  Loader2,
  Square,
  RotateCcw,
  Wrench,
  Pause,
  PlayCircle,
  RefreshCw,
  Upload,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mockNodes, mockEdges } from "@/lib/mock-data";
import { api, apiUrl } from "@/lib/api";
import Link from "next/link";

export function ExecutionToolbar() {
  const {
    mode,
    setMode,
    workflowName,
    toggleLeftSidebar,
    leftSidebarOpen,
    addEvent,
    setNodes,
    setEdges,
    nodes,
    edges,
    workflowId,
    setExecutionId,
    executionId,
    clearEvents,
  } = useWorkflowStore();
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Migration function to fix old nodes
  const fixNodeConfigs = () => {
    const updatedNodes = nodes.map((node) => {
      const config = (node.data.config || {}) as any;

      // Check if config has name field, if not add it based on node type
      if (!config.name) {
        const label = node.data.label || "Unnamed";
        let updatedConfig: any = {};

        // Add other required fields based on node type
        switch (node.type) {
          case "trigger":
            updatedConfig = {
              ...config,
              name: label,
              type: config.type || "manual",
              input_text: config.input_text || "",
            };
            break;
          case "agent":
            updatedConfig = {
              ...config,
              name: label,
              system_instructions: config.system_instructions || "",
              temperature: config.temperature ?? 0.7,
              expected_output_format: config.expected_output_format || "text",
            };
            break;
          case "api_call":
            updatedConfig = {
              ...config,
              name: label,
              url: config.url || "",
              method: config.method || "POST",
              headers: config.headers || {},
              body: config.body || {},
            };
            break;
          case "approval":
            updatedConfig = {
              ...config,
              name: label,
              description: config.description || "Please review and approve",
            };
            break;
          case "conditional":
            updatedConfig = {
              ...config,
              name: label,
              condition_expression: config.condition_expression || "",
            };
            break;
          case "eval":
            updatedConfig = {
              ...config,
              name: label,
              eval_type: config.eval_type || "schema",
              config: config.config || {},
              on_failure: config.on_failure || "block",
            };
            break;
          case "timer":
            updatedConfig = {
              ...config,
              name: label,
              duration_seconds: config.duration_seconds ?? 30,
            };
            break;
          case "event":
            updatedConfig = {
              ...config,
              name: label,
              operation: config.operation || "publish",
              channel: config.channel || "",
            };
            break;
          case "merge":
            updatedConfig = {
              ...config,
              name: label,
              merge_strategy: config.merge_strategy || "combine",
            };
            break;
          case "end":
            updatedConfig = {
              ...config,
              name: label,
              capture_output: config.capture_output ?? true,
              show_output: config.show_output ?? true,
            };
            break;
          default:
            updatedConfig = { ...config, name: label };
        }

        return {
          ...node,
          data: {
            ...node.data,
            config: updatedConfig,
          },
        };
      }

      return node;
    });

    setNodes(updatedNodes);
    toast.success("Fixed node configurations!", {
      description: "All nodes now have required fields.",
    });
  };
  const executeMutation = useMutation({
    mutationFn: async (inputData: any) => {
      if (!workflowId) throw new Error("No workflow ID.");

      // First, fetch what's actually stored in the database
      const storedWorkflow = await api.workflows.get(workflowId);

      console.log("🗄️ Workflow stored in DB:", storedWorkflow);
      console.log("🗄️ DB nodes:", storedWorkflow.definition?.nodes);

      // Debug: Log current nodes
      console.log("🔍 Current nodes in store:", nodes);
      console.log(
        "🔍 Node types:",
        nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.data.label,
          config: n.data.config,
          hasNameInConfig: !!(n.data.config as any)?.name,
        }))
      );
      console.log("🔍 Full JSON:", JSON.stringify(nodes, null, 2));

      return fetch(apiUrl(`api/workflows/${workflowId}/execute`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_data: inputData }),
      }).then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          console.error("❌ Execution error:", errorData);

          if (errorData.detail?.errors) {
            // Open left sidebar to show errors
            if (!leftSidebarOpen) toggleLeftSidebar();

            // Show validation errors in event log
            addEvent({
              id: `validation-error-${Date.now()}`,
              workflowId: workflowId || "",
              executionId: "",
              nodeId: "",
              eventType: "workflow.failed",
              timestamp: new Date().toISOString(),
              data: {
                error: "Workflow validation failed",
                errors: errorData.detail.errors,
                message:
                  errorData.detail.message ||
                  "Please fix the issues and try again",
              },
            });

            // Show user-friendly error toast
            toast.error("⚠️ Workflow Validation Failed", {
              description: `Found ${errorData.detail.errors.length} issue(s). Check the event log for details.`,
              duration: 5000,
            });

            // Also show first few errors
            errorData.detail.errors
              .slice(0, 3)
              .forEach((error: string, idx: number) => {
                setTimeout(() => {
                  toast.error(`Issue ${idx + 1}`, {
                    description: error,
                    duration: 7000,
                  });
                }, (idx + 1) * 500);
              });

            return Promise.reject(
              new Error(
                errorData.detail.message || "Workflow validation failed"
              )
            );
          }

          // Generic error
          toast.error("❌ Execution Failed", {
            description:
              errorData.message ||
              "An unexpected error occurred. Please try again.",
          });

          return Promise.reject(new Error("Failed to start execution."));
        }
        return res.json();
      });
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

  const pauseMutation = useMutation({
    mutationFn: async () => {
      if (!workflowId || !executionId) throw new Error("No active execution");
      return fetch(
        apiUrl(`api/workflows/${workflowId}/pause?execution_id=${executionId}`),
        {
          method: "POST",
        }
      ).then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Failed to pause"))
      );
    },
    onSuccess: () => {
      toast.success("Workflow paused");
      setMode("paused");
    },
    onError: (e: Error) => toast.error(`Pause failed: ${e.message}`),
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      if (!workflowId || !executionId) throw new Error("No paused execution");
      return fetch(
        apiUrl(
          `api/workflows/${workflowId}/resume?execution_id=${executionId}`
        ),
        {
          method: "POST",
        }
      ).then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Failed to resume"))
      );
    },
    onSuccess: () => {
      toast.success("Workflow resumed");
      setMode("executing");
    },
    onError: (e: Error) => toast.error(`Resume failed: ${e.message}`),
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      if (!workflowId) throw new Error("No workflow ID");
      // Re-execute with same input
      const triggerNode = nodes.find((n) => n.type === "trigger");
      const triggerConfig = triggerNode?.data?.config as any;
      const inputVars = triggerConfig?.input_text
        ? { input_text: triggerConfig.input_text }
        : triggerConfig?.input_variables || {};

      return fetch(apiUrl(`api/workflows/${workflowId}/execute`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_data: inputVars }),
      }).then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Retry failed"))
      );
    },
    onSuccess: (data) => {
      toast.success("Workflow restarted!", {
        description: `New execution: ${data.execution_id}`,
      });
      setExecutionId(data.execution_id);
      setMode("executing");
      clearEvents();
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
      return fetch(apiUrl(`api/workflows/${workflowId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Failed to save."))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
    },
    onError: (e: Error) => console.error("Auto-save failed:", e.message),
  });

  // Auto-save when nodes or edges change
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (!workflowId || nodes.length === 0) return;

    // Debounce saves by 2 seconds
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges, workflowName, workflowId, saveMutation]);

  // Export workflow as JSON
  const handleExport = () => {
    const workflowData = {
      name: workflowName,
      version: "1.0.0",
      exported_at: new Date().toISOString(),
      nodes: nodes.map(({ id, type, position, data }) => ({
        id,
        type,
        position,
        data,
      })),
      edges: edges.map(
        ({ id, source, target, sourceHandle, targetHandle }) => ({
          id,
          source,
          target,
          sourceHandle,
          targetHandle,
        })
      ),
    };

    const blob = new Blob([JSON.stringify(workflowData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${workflowName
      .replace(/\s+/g, "-")
      .toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Workflow exported!", {
      description: "Downloaded as JSON file",
    });
  };

  // Import workflow from JSON
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);

        if (!importedData.nodes || !importedData.edges) {
          throw new Error("Invalid workflow file format");
        }

        setNodes(importedData.nodes);
        setEdges(importedData.edges);

        toast.success("Workflow imported!", {
          description: `Loaded ${importedData.nodes.length} nodes`,
        });

        setIsImportModalOpen(false);
      } catch (error) {
        toast.error("Import failed", {
          description:
            error instanceof Error ? error.message : "Invalid file format",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-10 bg-black p-2 rounded-xl flex items-center gap-2 text-white">
        <TooltipProvider>
          {/* Home/Logo Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-800"
                >
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Back to Dashboard</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-6" />
          <div className="px-3">
            <h1 className="text-sm font-semibold">{workflowName}</h1>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Button
            onClick={() => {
              // Get input from trigger node config
              const triggerNode = nodes.find((n) => n.type === "trigger");
              const triggerConfig = triggerNode?.data?.config as any;
              // Use input_text if available, otherwise fall back to input_variables
              const inputVars = triggerConfig?.input_text
                ? { input_text: triggerConfig.input_text }
                : triggerConfig?.input_variables || {};
              console.log("🎬 Executing with input:", inputVars);
              executeMutation.mutate(inputVars);
            }}
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

          {/* Pause Button */}
          {mode === "executing" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  size="icon"
                  onClick={() => pauseMutation.mutate()}
                  disabled={pauseMutation.isPending}
                >
                  {pauseMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pause Execution</TooltipContent>
            </Tooltip>
          )}

          {/* Resume Button */}
          {mode === "paused" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-green-500 hover:bg-green-600 text-white"
                  size="icon"
                  onClick={() => resumeMutation.mutate()}
                  disabled={resumeMutation.isPending}
                >
                  {resumeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlayCircle className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Resume Execution</TooltipContent>
            </Tooltip>
          )}

          {/* Retry Button */}
          {mode === "failed" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  size="icon"
                  onClick={() => retryMutation.mutate()}
                  disabled={retryMutation.isPending}
                >
                  {retryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Retry Workflow</TooltipContent>
            </Tooltip>
          )}

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
              <Button variant="ghost" size="icon" onClick={handleExport}>
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Workflow</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => document.getElementById("import-file")?.click()}
              >
                <Upload className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import Workflow</TooltipContent>
          </Tooltip>
          <input
            id="import-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={fixNodeConfigs}
                className="text-yellow-400 hover:text-yellow-300"
              >
                <Wrench className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Fix Node Configs (Add Missing Fields)
            </TooltipContent>
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
        </TooltipProvider>
      </div>
    </>
  );
}
