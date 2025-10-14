"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { WorkflowNode } from "@/types/workflow";
import {
  Zap,
  Bot,
  Globe,
  UserCheck,
  Target,
  GitFork,
  GitMerge,
  Clock,
  Radio,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pause,
} from "lucide-react";

const iconMap = {
  trigger: Zap,
  agent: Bot,
  action: Globe,
  approval: UserCheck,
  eval: Target,
  fork: GitFork,
  merge: GitMerge,
  timer: Clock,
  event: Radio,
  meta: Eye,
};

const colorMap = {
  trigger: "bg-green-500",
  agent: "bg-purple-500",
  action: "bg-blue-500",
  approval: "bg-orange-500",
  eval: "bg-yellow-500",
  fork: "bg-pink-500",
  merge: "bg-indigo-500",
  timer: "bg-cyan-500",
  event: "bg-red-500",
  meta: "bg-gray-500",
};

const statusConfig = {
  idle: { color: "bg-gray-100 border-gray-300", icon: null, pulse: false },
  running: { color: "bg-blue-50 border-blue-400", icon: Loader2, pulse: true },
  completed: {
    color: "bg-green-50 border-green-400",
    icon: CheckCircle2,
    pulse: false,
  },
  failed: {
    color: "bg-red-50 border-red-400",
    icon: AlertCircle,
    pulse: false,
  },
  waiting_approval: {
    color: "bg-orange-50 border-orange-400",
    icon: Pause,
    pulse: true,
  },
  paused: { color: "bg-gray-100 border-gray-400", icon: Pause, pulse: false },
};

export const CustomNode = memo(
  ({ data, selected }: NodeProps<WorkflowNode>) => {
    const Icon = iconMap[data.type];
    const statusInfo = statusConfig[data.status];
    const StatusIcon = statusInfo.icon;

    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        {/* Input Handle */}
        {data.type !== "trigger" && (
          <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-gray-400 border-2 border-white"
          />
        )}

        {/* Node Card */}
        <div
          className={cn(
            "relative min-w-[180px] rounded-lg border-2 shadow-md transition-all",
            statusInfo.color,
            selected && "ring-2 ring-blue-500 ring-offset-2",
            statusInfo.pulse && "animate-pulse"
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-t-md",
              colorMap[data.type]
            )}
          >
            <Icon className="w-4 h-4 text-white" />
            <span className="text-xs font-semibold text-white uppercase tracking-wide">
              {data.type}
            </span>
            {StatusIcon && (
              <StatusIcon
                className={cn(
                  "w-3 h-3 ml-auto",
                  data.status === "running" && "animate-spin",
                  data.status === "completed" && "text-green-600",
                  data.status === "failed" && "text-red-600",
                  data.status === "waiting_approval" && "text-orange-600"
                )}
              />
            )}
          </div>

          {/* Body */}
          <div className="px-3 py-3 bg-white rounded-b-md">
            <div className="text-sm font-medium text-gray-900 mb-1">
              {data.label}
            </div>

            {/* Metadata */}
            {(data.executionTime || data.cost || data.reliability) && (
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600">
                {data.executionTime && (
                  <span className="px-2 py-0.5 bg-gray-100 rounded">
                    {data.executionTime}s
                  </span>
                )}
                {data.cost && (
                  <span className="px-2 py-0.5 bg-green-100 rounded text-green-700">
                    ${data.cost.toFixed(3)}
                  </span>
                )}
                {data.reliability && (
                  <span className="px-2 py-0.5 bg-blue-100 rounded text-blue-700">
                    {(data.reliability * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            )}

            {/* Error Message */}
            {data.error && (
              <div className="mt-2 text-xs text-red-600 flex items-start gap-1">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{data.error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Output Handle */}
        {data.type !== "action" && data.type !== "merge" && (
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-gray-400 border-2 border-white"
          />
        )}

        {/* Fork/Merge multiple handles */}
        {data.type === "fork" && (
          <>
            <Handle
              type="source"
              position={Position.Bottom}
              id="out-1"
              style={{ left: "30%" }}
              className="w-3 h-3 !bg-pink-500"
            />
            <Handle
              type="source"
              position={Position.Bottom}
              id="out-2"
              style={{ left: "50%" }}
              className="w-3 h-3 !bg-pink-500"
            />
            <Handle
              type="source"
              position={Position.Bottom}
              id="out-3"
              style={{ left: "70%" }}
              className="w-3 h-3 !bg-pink-500"
            />
          </>
        )}

        {data.type === "merge" && (
          <>
            <Handle
              type="target"
              position={Position.Top}
              id="in-1"
              style={{ left: "30%" }}
              className="w-3 h-3 !bg-indigo-500"
            />
            <Handle
              type="target"
              position={Position.Top}
              id="in-2"
              style={{ left: "50%" }}
              className="w-3 h-3 !bg-indigo-500"
            />
            <Handle
              type="target"
              position={Position.Top}
              id="in-3"
              style={{ left: "70%" }}
              className="w-3 h-3 !bg-indigo-500"
            />
          </>
        )}
      </motion.div>
    );
  }
);

CustomNode.displayName = "CustomNode";
