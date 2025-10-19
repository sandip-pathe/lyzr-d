"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Radio, Activity } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";

export const EventHubNode = memo(
  ({ data, selected }: NodeProps<WorkflowNode>) => {
    const throughput = ((data as any)?.config?.throughput as number) || 0;
    const topics = ((data as any)?.config?.topics as string[]) || [];

    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <div
          className={`
            relative w-36 h-36 rounded-full overflow-hidden
            bg-cyan-600 border-[2px] border-white shadow-[0_0_25px_rgba(0,0,0,0.25)]
            ${
              selected
                ? "ring-4 ring-blue-400 ring-offset-2 ring-offset-slate-900"
                : ""
            }
            ${data.status === "running" ? "animate-pulse" : ""}
            transition-all duration-300
          `}
        >
          {/* Running glow layers */}
          {data.status === "running" && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping" />
              <div
                className="absolute inset-0 rounded-full bg-orange-400 opacity-20 animate-ping"
                style={{ animationDelay: "0.5s" }}
              />
            </>
          )}

          {/* Inner content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white select-none">
            <div className="flex items-center justify-center mb-1">
              <Radio className="w-10 h-10 drop-shadow-md" strokeWidth={1.6} />
            </div>
            <div className="text-base font-semibold tracking-wide">
              Event Hub
            </div>
            <div className="text-xs opacity-90 font-medium">
              {data.label || "No label"}
            </div>

            {throughput > 0 && (
              <div className="mt-3 px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full flex items-center gap-2 shadow-sm">
                <Activity className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">
                  {throughput} evt/s
                </span>
              </div>
            )}
          </div>

          {/* Topic orbit labels */}
          {topics.map((topic: string, idx: number) => {
            const angle = (idx / topics.length) * 360;
            const radius = 95;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <motion.div
                key={topic}
                className="absolute top-1/2 left-1/2 px-2 py-1 bg-white text-[10px] font-semibold text-gray-700 rounded-md shadow-md border border-gray-200 whitespace-nowrap"
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x, y, opacity: 1 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                style={{ transform: "translate(-50%, -50%)" }}
              >
                {topic}
              </motion.div>
            );
          })}
        </div>

        {/* Connection handles */}
        {[...Array(8)].map((_, i) => {
          const positionMap = [
            Position.Top,
            Position.Right,
            Position.Bottom,
            Position.Left,
          ];
          const position = positionMap[Math.floor(i / 2)];
          let style: Record<string, string> = {};
          if (i === 1) style = { left: "75%" };
          if (i === 2) style = { top: "25%" };
          if (i === 3) style = { top: "75%" };
          if (i === 5) style = { left: "25%" };
          if (i === 6) style = { top: "75%" };
          if (i === 7) style = { top: "25%" };

          return (
            <Handle
              key={i}
              type={i === 0 ? "target" : "source"}
              position={position}
              id={`handle-${i}`}
              className={`!border-1 ${
                i === 0
                  ? "!bg-red-500 !border-white"
                  : "!bg-black !border-white"
              }`}
              style={style}
            />
          );
        })}
      </motion.div>
    );
  }
);

EventHubNode.displayName = "EventHubNode";
