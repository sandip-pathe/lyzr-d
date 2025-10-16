"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Radio, Activity } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";

export const EventHubNode = memo(
  ({ data, selected }: NodeProps<WorkflowNode>) => {
    const throughput = data.config?.throughput || 0;
    const topics = data.config?.topics || [];

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="relative"
      >
        <div
          className={`
            relative w-48 h-48 rounded-full
            bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500
            shadow-2xl border-4 border-white
            ${selected ? "ring-4 ring-blue-500" : ""}
            ${data.status === "running" ? "animate-pulse" : ""}
          `}
        >
          {data.status === "running" && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping" />
              <div
                className="absolute inset-0 rounded-full bg-orange-400 opacity-20 animate-ping"
                style={{ animationDelay: "0.5s" }}
              />
            </>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Radio className="w-12 h-12 mb-2" />
            <div className="text-sm font-bold uppercase tracking-wider">
              Event Bus
            </div>
            <div className="text-xs opacity-90">{data.label}</div>

            {throughput > 0 && (
              <div className="mt-3 px-3 py-1 bg-white/20 backdrop-blur rounded-full flex items-center gap-2">
                <Activity className="w-3 h-3" />
                <span className="text-xs font-semibold">
                  {throughput} evt/s
                </span>
              </div>
            )}
          </div>

          {topics.map((topic: string, idx: number) => {
            const angle = (idx / topics.length) * 360;
            const x = Math.cos((angle * Math.PI) / 180) * 120;
            const y = Math.sin((angle * Math.PI) / 180) * 120;

            return (
              <motion.div
                key={topic}
                className="absolute top-1/2 left-1/2 px-2 py-1 bg-white text-xs font-medium text-gray-700 rounded shadow-md whitespace-nowrap"
                initial={{ x: 0, y: 0 }}
                animate={{ x, y }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                style={{ transform: "translate(-50%, -50%)" }}
              >
                {topic}
              </motion.div>
            );
          })}
        </div>

        {/* Handles for subscribers */}
        {[...Array(8)].map((_, i) => {
          const positionMap = [
            Position.Top,
            Position.Right,
            Position.Bottom,
            Position.Left,
          ];
          const position = positionMap[Math.floor(i / 2)];
          let style = {};
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
              className={i === 0 ? "!bg-red-500" : "!bg-orange-500"}
              style={style}
            />
          );
        })}
      </motion.div>
    );
  }
);

EventHubNode.displayName = "EventHubNode";
