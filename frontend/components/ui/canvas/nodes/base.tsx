"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useWorkflowStore } from "@/lib/store";

interface BaseNodeProps extends NodeProps {
  icon: React.ReactNode;
  color: string;
  children?: React.ReactNode;
}

export const BaseNode = memo(
  ({ id, data, selected, icon, color, children }: BaseNodeProps) => {
    const { selectedNode, setSelectedNode } = useWorkflowStore();

    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "relative min-w-[280px] rounded-xl border-2 bg-white shadow-lg transition-all",
          selected || selectedNode === id
            ? `border-${color}-500 shadow-${color}-200`
            : "border-gray-200 hover:border-gray-300"
        )}
        onClick={() => setSelectedNode(id)}
      >
        {/* Top handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />

        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-t-xl",
            `bg-${color}-50 border-b border-${color}-100`
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg",
              `bg-${color}-100`
            )}
          >
            <div className={`text-${color}-600`}>{icon}</div>
          </div>

          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900">
              {data.label}
            </div>
            {data.status && (
              <div className="flex items-center gap-1.5 mt-1">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    data.status === "running" && "bg-blue-500 animate-pulse",
                    data.status === "success" && "bg-green-500",
                    data.status === "error" && "bg-red-500",
                    data.status === "idle" && "bg-gray-300"
                  )}
                />
                <span className="text-xs text-gray-500 capitalize">
                  {data.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {children && <div className="p-4">{children}</div>}

        {/* Bottom handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />

        {/* Status indicator */}
        {data.status === "running" && (
          <div className="absolute -top-1 -right-1">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>
        )}
      </motion.div>
    );
  }
);

BaseNode.displayName = "BaseNode";
