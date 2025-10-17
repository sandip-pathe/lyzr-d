"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useWorkflowStore } from "@/lib/store";

interface NodeData {
  label: string;
  status?: "running" | "completed" | "failed" | "idle";
}

interface BaseNodeProps extends Omit<NodeProps, "data"> {
  data: NodeData;
  icon: React.ReactNode;
  color: string;
  children?: React.ReactNode;
}

export const BaseNode = memo(
  ({ id, data, selected, icon, color, children }: BaseNodeProps) => {
    const { selectedNodeId, setSelectedNode } = useWorkflowStore();
    const isSelected = selected || selectedNodeId === id;

    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "relative min-w-[280px] rounded-xl border-2 bg-white shadow-lg transition-all",
          isSelected
            ? `border-${color}-500 shadow-lg shadow-${color}-200/50`
            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
        )}
        onClick={() => setSelectedNode(id)}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />

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
                    data.status === "completed" && "bg-green-500",
                    data.status === "failed" && "bg-red-500",
                    data.status === "idle" && "bg-gray-300"
                  )}
                />
                <span className="text-xs text-gray-500 capitalize">
                  {data.status.replace("_", " ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {children && <div className="p-4">{children}</div>}

        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />
      </motion.div>
    );
  }
);

BaseNode.displayName = "BaseNode";
