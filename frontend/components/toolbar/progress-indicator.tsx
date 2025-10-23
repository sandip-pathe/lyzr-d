"use client";

import { useWorkflowStore } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useMemo } from "react";

export function WorkflowProgressIndicator() {
  const { nodes, events, mode } = useWorkflowStore();

  const stats = useMemo(() => {
    const totalNodes = nodes.length;
    const completedNodes = nodes.filter(
      (n) => n.data.status === "completed"
    ).length;
    const failedNodes = nodes.filter((n) => n.data.status === "failed").length;
    const runningNodes = nodes.filter(
      (n) => n.data.status === "running"
    ).length;
    const progress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

    return {
      total: totalNodes,
      completed: completedNodes,
      failed: failedNodes,
      running: runningNodes,
      progress: Math.round(progress),
    };
  }, [nodes]);

  if (mode !== "executing" && mode !== "paused") {
    return null;
  }

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[400px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
          <span className="text-sm font-semibold text-gray-700">
            Workflow Execution
          </span>
        </div>
        <span className="text-xs font-mono text-gray-500">
          {stats.completed}/{stats.total} nodes
        </span>
      </div>

      <Progress value={stats.progress} className="h-2 mb-3" />

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          {stats.running > 0 && (
            <div className="flex items-center gap-1 text-blue-600">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>{stats.running} running</span>
            </div>
          )}
          {stats.completed > 0 && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-3 h-3" />
              <span>{stats.completed} completed</span>
            </div>
          )}
          {stats.failed > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="w-3 h-3" />
              <span>{stats.failed} failed</span>
            </div>
          )}
        </div>
        {mode === "paused" && (
          <div className="flex items-center gap-1 text-orange-600">
            <Clock className="w-3 h-3" />
            <span>Paused</span>
          </div>
        )}
      </div>
    </div>
  );
}
