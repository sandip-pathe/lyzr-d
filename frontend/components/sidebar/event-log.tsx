"use client";

import { useEffect, useRef } from "react";
import { useWorkflowStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExecutionEvent } from "@/types/workflow";

const eventIcons = {
  started: Zap,
  completed: CheckCircle2,
  failed: XCircle,
  approval_requested: AlertCircle,
};

const eventColors = {
  started: "text-blue-600 bg-blue-50",
  completed: "text-green-600 bg-green-50",
  failed: "text-red-600 bg-red-50",
  approval_requested: "text-orange-600 bg-orange-50",
};

export function EventLogStream() {
  const { events, wsConnected } = useWorkflowStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-gray-900">
              Event Stream
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              Real-time execution log
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                wsConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
              )}
            />
            <span className="text-xs text-gray-600">
              {wsConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Event List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Activity className="w-12 h-12 mb-2" />
              <p className="text-sm">No events yet</p>
              <p className="text-xs mt-1">
                Events will appear here during execution
              </p>
            </div>
          ) : (
            events.map((event, index) => {
              const Icon = eventIcons[event.eventType];
              const colorClass = eventColors[event.eventType];

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "p-3 rounded-lg border border-gray-200",
                    "hover:shadow-md transition-shadow"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-1.5 rounded-md", colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {event.eventType.replace("_", " ").toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.timestamp)}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600">
                        Node: <span className="font-mono">{event.nodeId}</span>
                      </div>

                      {event.data && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </div>
                      )}

                      {event.error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                          {event.error}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Total Events: {events.length}</span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Live
          </span>
        </div>
      </div>
    </div>
  );
}
