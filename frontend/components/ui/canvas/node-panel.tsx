"use client";

import { Bot, UserCheck, Zap, Globe, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const nodeTemplates = [
  {
    type: "trigger",
    label: "Trigger",
    icon: Zap,
    color: "bg-green-500",
    description: "Start workflow",
  },
  {
    type: "agent",
    label: "AI Agent",
    icon: Bot,
    color: "bg-purple-500",
    description: "Call AI model",
  },
  {
    type: "approval",
    label: "Approval",
    icon: UserCheck,
    color: "bg-orange-500",
    description: "Human-in-loop",
  },
  {
    type: "http",
    label: "HTTP Request",
    icon: Globe,
    color: "bg-blue-500",
    description: "API call",
  },
  {
    type: "transform",
    label: "Transform",
    icon: Workflow,
    color: "bg-pink-500",
    description: "Process data",
  },
];

export function NodePanel() {
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-72 border-r border-gray-200 bg-white p-4 overflow-y-auto">
      <div className="mb-6">
        <h3 className="font-semibold text-sm text-gray-900">Components</h3>
        <p className="text-xs text-gray-500 mt-1">Drag and drop to canvas</p>
      </div>

      <div className="space-y-2">
        {nodeTemplates.map((template, index) => (
          <motion.div
            key={template.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            draggable
            onDragStart={(e) =>
              onDragStart(
                e as unknown as React.DragEvent<HTMLDivElement>,
                template.type
              )
            }
            className={cn(
              "p-3 rounded-lg border-2 border-gray-200 bg-white",
              "cursor-grab active:cursor-grabbing",
              "hover:border-gray-300 hover:shadow-sm",
              "transition-all duration-200"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg",
                  template.color
                )}
              >
                <template.icon className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">
                  {template.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {template.description}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
