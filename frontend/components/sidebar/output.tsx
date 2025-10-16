"use client";

import { useWorkflowStore } from "@/lib/store";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export function OutputPanel() {
  const { output } = useWorkflowStore();

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
        </div>
      </div>

      {/* Output Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {output ? (
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
                {output.status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900">
                  {output.status.toUpperCase()}
                </span>
                <div className="mt-2 p-2 bg-gray-900 text-white rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(output.result, null, 2)}</pre>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Terminal className="w-12 h-12 mb-2" />
            <p className="text-sm">No output yet</p>
            <p className="text-xs mt-1">
              Run a workflow to see the final result.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
