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
  GitBranch,
} from "lucide-react";

const iconMap: { [key: string]: React.ElementType } = {
  trigger: Zap,
  agent: Bot,
  api_call: Globe,
  approval: UserCheck,
  eval: Target,
  fork: GitFork,
  merge: GitMerge,
  timer: Clock,
  event: Radio,
  meta: Eye,
  conditional: GitBranch,
  end: CheckCircle2,
};

const colorMap: { [key: string]: string } = {
  trigger: "bg-green-500",
  agent: "bg-purple-500",
  api_call: "bg-blue-500",
  approval: "bg-orange-500",
  eval: "bg-yellow-500",
  fork: "bg-pink-500",
  merge: "bg-indigo-500",
  timer: "bg-cyan-500",
  event: "bg-red-500",
  meta: "bg-gray-500",
  conditional: "bg-gray-500",
  end: "bg-gray-800",
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

    const renderHandles = () => {
      switch (data.type) {
        case "trigger":
          return (
            <Handle type="source" position={Position.Bottom} id="output" />
          );
        case "agent":
        case "api_call":
          return (
            <>
              <Handle type="target" position={Position.Top} id="input" />
              <Handle type="source" position={Position.Bottom} id="output" />
            </>
          );
        case "conditional":
          return (
            <>
              <Handle type="target" position={Position.Top} id="input" />
              <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                style={{ left: "25%" }}
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                style={{ left: "75%" }}
              />
            </>
          );
        case "approval":
          return (
            <>
              <Handle type="target" position={Position.Top} id="input" />
              <Handle
                type="source"
                position={Position.Bottom}
                id="approve"
                style={{ left: "25%" }}
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="reject"
                style={{ left: "75%" }}
              />
            </>
          );
        case "fork":
          return (
            <>
              <Handle type="target" position={Position.Top} id="input" />
              <Handle
                type="source"
                position={Position.Bottom}
                id="output1"
                style={{ left: "25%" }}
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="output2"
                style={{ left: "75%" }}
              />
            </>
          );
        case "merge":
          return (
            <>
              <Handle
                type="target"
                position={Position.Top}
                id="input1"
                style={{ left: "25%" }}
              />
              <Handle
                type="target"
                position={Position.Top}
                id="input2"
                style={{ left: "75%" }}
              />
              <Handle type="source" position={Position.Bottom} id="output" />
            </>
          );
        case "event":
          return (
            <>
              <Handle type="target" position={Position.Top} id="input" />
              <Handle
                type="source"
                position={Position.Bottom}
                id="sub1"
                style={{ left: "20%" }}
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="sub2"
                style={{ left: "40%" }}
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="sub3"
                style={{ left: "60%" }}
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="sub4"
                style={{ left: "80%" }}
              />
            </>
          );
        case "end":
          return (
            <>
              <Handle type="target" position={Position.Top} id="input" />
            </>
          );
        default:
          return (
            <>
              <Handle type="target" position={Position.Top} />
              <Handle type="source" position={Position.Bottom} />
            </>
          );
      }
    };

    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-[220px]"
      >
        {renderHandles()}
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
              "flex items-center gap-2 px-3 py-2 rounded-md text-white cursor-pointer",
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
      </motion.div>
    );
  }
);

CustomNode.displayName = "CustomNode";
