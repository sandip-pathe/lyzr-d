"use client";

import { memo, useState } from "react";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const iconMap: { [key: string]: React.ElementType } = {
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

const colorMap: { [key: string]: string } = {
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

const statusConfig: { [key: string]: any } = {
  idle: { color: "bg-white border-gray-300", icon: null, pulse: false },
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
    const [isCollapsed, setIsCollapsed] = useState(false);
    const Icon = iconMap[data.type] || Eye;
    const statusInfo = statusConfig[data.status] || statusConfig.idle;
    const StatusIcon = statusInfo.icon;

    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-[220px]"
      >
        {data.type !== "trigger" && (
          <Handle
            type="target"
            position={Position.Top}
            className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !-translate-y-1/2"
          />
        )}

        <div
          className={cn(
            "rounded-lg border-2 shadow-lg transition-all",
            statusInfo.color,
            selected && "ring-2 ring-offset-2 ring-blue-500",
            statusInfo.pulse && "animate-pulse"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-t-md text-white cursor-pointer",
              colorMap[data.type]
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider flex-1 truncate">
              {data.label}
            </span>
            {StatusIcon && (
              <StatusIcon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  statusInfo.pulse && "animate-spin"
                )}
              />
            )}
            <button className="opacity-70 hover:opacity-100">
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>

          <motion.div
            initial={false}
            animate={{ height: isCollapsed ? 0 : "auto" }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 bg-white rounded-b-md text-xs text-gray-600">
              <p className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-500 w-full truncate">
                {statusInfo.label || "Idle"}
              </p>
              {data.error && (
                <p className="mt-2 text-red-600 flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{data.error}</span>
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {data.type !== "action" && (
          <Handle
            type="source"
            position={Position.Bottom}
            className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !translate-y-1/2"
          />
        )}
      </motion.div>
    );
  }
);

CustomNode.displayName = "CustomNode";
