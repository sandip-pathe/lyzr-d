"use client";

import { useWorkflowStore } from "@/lib/store";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Terminal,
  DollarSign,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WorkflowOutput,
  AgentOutput,
  APICallOutput,
  NodeOutput,
} from "@/types/node-outputs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function OutputPanel() {
  const { output, mode } = useWorkflowStore();

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-gray-900">
              Workflow Output
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              Final result of the execution
            </p>
          </div>
          {output && (
            <Badge
              variant={
                output.status === "completed" ? "default" : "destructive"
              }
            >
              {output.status === "completed" ? (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              {output.status?.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Output Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {output ? (
            <>
              {/* Final Output */}
              {output.result && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-lg border",
                    output.status === "completed"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "p-1.5 rounded-md",
                        output.status === "completed"
                          ? "text-green-600 bg-green-100"
                          : "text-red-600 bg-red-100"
                      )}
                    >
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 mb-2 block">
                        Final Result
                      </span>
                      <OutputRenderer output={output.result} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Node Outputs */}
              {output.result && Object.keys(output.result).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-600">
                    Node Execution Details
                  </h4>
                  {Object.entries(output.result).map(([nodeId, nodeOutput]) => (
                    <NodeOutputCard
                      key={nodeId}
                      output={nodeOutput as NodeOutput}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
              <Terminal className="w-12 h-12 mb-2" />
              <p className="text-sm">No output yet</p>
              <p className="text-xs mt-1">
                Run a workflow to see the final result.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function NodeOutputCard({ output }: { output: NodeOutput }) {
  const getIcon = () => {
    switch (output.node_type) {
      case "agent":
        return "🤖";
      case "timer":
        return "⏰";
      case "conditional":
        return "🔀";
      case "api_call":
        return "🌐";
      case "eval":
        return "📊";
      case "approval":
        return "✅";
      case "event":
        return "📡";
      case "merge":
        return "🔗";
      case "loop":
        return "🔄";
      default:
        return "📦";
    }
  };

  return (
    <Card className="p-3 bg-gray-50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getIcon()}</span>
          <div>
            <p className="font-medium capitalize text-sm">
              {output.node_type.replace("_", " ")}
            </p>
            <p className="text-xs text-gray-500 font-mono">{output.node_id}</p>
          </div>
        </div>
        <Badge
          variant={output.status === "success" ? "default" : "destructive"}
          className="text-xs"
        >
          {output.status}
        </Badge>
      </div>

      {/* Type-specific rendering */}
      {output.node_type === "agent" && (
        <AgentOutputDetails output={output as AgentOutput} />
      )}
      {output.node_type === "api_call" && (
        <APIOutputDetails output={output as APICallOutput} />
      )}

      {/* Generic output for other types */}
      {!["agent", "api_call"].includes(output.node_type) && (
        <div className="mt-2">
          <OutputRenderer output={output.raw_output} />
        </div>
      )}
    </Card>
  );
}

function AgentOutputDetails({ output }: { output: AgentOutput }) {
  return (
    <div className="space-y-2">
      <div className="bg-white p-3 rounded-md border border-gray-200">
        <p className="text-sm whitespace-pre-wrap text-gray-700">
          {output.output}
        </p>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center">
          <DollarSign className="w-3 h-3 mr-1" />${output.cost.toFixed(6)}
        </span>
        <span className="font-mono">{output.model}</span>
        <span>{output.usage.total_tokens} tokens</span>
      </div>
    </div>
  );
}

function APIOutputDetails({ output }: { output: APICallOutput }) {
  const isSuccess = output.status_code >= 200 && output.status_code < 300;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <Badge variant={isSuccess ? "default" : "destructive"}>
          {output.status_code}
        </Badge>
        <span className="text-gray-500 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {output.response_time_ms.toFixed(0)}ms
        </span>
      </div>
      <div className="bg-white p-2 rounded-md border border-gray-200 max-h-40 overflow-auto">
        <pre className="text-xs font-mono text-gray-700">
          {JSON.stringify(output.body, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function OutputRenderer({ output }: { output: any }) {
  if (output === null || output === undefined) {
    return <p className="text-sm text-gray-500 italic">No output</p>;
  }

  if (typeof output === "string") {
    return (
      <p className="text-sm whitespace-pre-wrap text-gray-700">{output}</p>
    );
  }

  if (typeof output === "boolean" || typeof output === "number") {
    return <p className="text-sm font-mono text-gray-700">{String(output)}</p>;
  }

  if (typeof output === "object") {
    return (
      <pre className="text-xs bg-white p-2 rounded-md border border-gray-200 overflow-auto max-h-60 font-mono text-gray-700">
        {JSON.stringify(output, null, 2)}
      </pre>
    );
  }

  return <p className="text-sm text-gray-700">{String(output)}</p>;
}
