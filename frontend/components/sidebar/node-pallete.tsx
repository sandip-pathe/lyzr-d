"use client";

import { motion } from "framer-motion";
import { nodeTemplates } from "@/lib/mock-data";
import { NodeType } from "@/types/workflow";
import {
  Bot,
  Globe,
  Target,
  CheckCheck,
  Clock,
  Radio,
  Eye,
  Merge,
  Split,
  UserRoundCheck,
  Play,
  GitBranchPlus,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconComponents = {
  trigger: Zap,
  agent: Bot,
  action: Globe,
  approval: CheckCheck,
  hitl: UserRoundCheck,
  conditional: GitBranchPlus,
  eval: Target,
  fork: Split,
  merge: Merge,
  timer: Clock,
  event: Radio,
  meta: Eye,
};

export function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className="h-full border-r bg-transparent overflow-y-auto"
      style={{
        scrollbarWidth: "none",
      }}
    >
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-lg text-white">Components</h2>
        <p className="text-xs text-gray-400 mt-1">Drag and drop to canvas</p>
      </div>

      <div className="px-8 py-2 space-y-2">
        {nodeTemplates.map((template, index) => {
          const IconComponent = iconComponents[template.type as NodeType];

          return (
            <motion.div
              key={template.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              draggable
              onDragStart={(e) => onDragStart(e as any, template.type)}
              className={cn(
                "p-2 bg-transparent",
                "cursor-grab active:cursor-grabbing",
                "hover:border-gray-300 hover:bg-white hover:shadow-md",
                "transition-all duration-200",
                "group"
              )}
            >
              <div className="flex items-start justify-center gap-3">
                <div
                  className={cn(
                    "p-1 rounded-md",
                    template.color,
                    "group-hover:scale-110 transition-transform"
                  )}
                >
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-500">
                    {template.label}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Templates */}
      <div className="p-4 border-t border-gray-200 mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Quick Templates
        </h3>
        <div className="space-y-2">
          {[
            { name: "Simple Chain", nodes: 3 },
            { name: "HITL Approval", nodes: 5 },
            { name: "Parallel Flow", nodes: 7 },
            { name: "Event-Driven", nodes: 6 },
          ].map((template) => (
            <button
              key={template.name}
              className="w-full text-left px-3 py-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
            >
              <div className="font-medium text-gray-900">{template.name}</div>
              <div className="text-xs text-gray-600">
                {template.nodes} nodes
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
