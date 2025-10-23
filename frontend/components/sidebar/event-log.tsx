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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExecutionEvent } from "@/types/workflow";

const eventIcons: Record<string, typeof Activity> = {
  started: Zap,
  completed: CheckCircle2,
  failed: XCircle,
  approval_requested: AlertCircle,
};

const eventColors: Record<string, string> = {
  started: "text-blue-400 bg-blue-900/50",
  completed: "text-green-400 bg-green-900/50",
  failed: "text-red-400 bg-red-900/50",
  approval_requested: "text-orange-400 bg-orange-900/50",
};

export function EventLogStream({
  onViewReport,
}: {
  onViewReport: (event: ExecutionEvent) => void;
}) {
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
    <div className="h-full bg-black border-r border-gray-700 flex flex-col rounded-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-white">Event Stream</h2>
            <p className="text-xs text-gray-400 mt-1">
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
            <span className="text-xs text-gray-400">
              {wsConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Event List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence initial={false}>
          {events.length === 0 && !wsConnected ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Activity className="w-12 h-12 mb-2" />
              <p className="text-sm">No events yet</p>
              <p className="text-xs mt-1">
                Events will appear here during execution
              </p>
            </div>
          ) : events.length === 0 && wsConnected ? (
            <div className="flex flex-col items-center justify-center h-full text-blue-400">
              <Loader2 className="w-8 h-8 mb-2 animate-spin" />
              <p className="text-sm">Workflow initializing...</p>
              <p className="text-xs mt-1 text-gray-400">
                Waiting for first event
              </p>
            </div>
          ) : (
            events.map((event, index) => {
              // Special handling for validation failures
              if (event.eventType === "workflow.failed" && event.data?.errors) {
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-950/50 border border-red-800 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-900/50 rounded-lg">
                        <XCircle className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-300 mb-1">
                          ⚠️ Workflow Validation Failed
                        </h3>
                        <p className="text-sm text-red-400 mb-3">
                          {event.data.message ||
                            "Please fix the following issues and try again:"}
                        </p>
                        <div className="space-y-2">
                          {event.data.errors.map(
                            (error: string, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-sm"
                              >
                                <span className="text-red-500 font-bold">
                                  •
                                </span>
                                <span className="text-red-200">{error}</span>
                              </div>
                            )
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-red-800">
                          <p className="text-xs text-red-400">
                            💡 Tip: Check node configurations and connections in
                            the canvas
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              const Icon = eventIcons[event.eventType] || Activity;
              const colorClass =
                eventColors[event.eventType] || "text-gray-400 bg-gray-800";

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "p-3 rounded-lg border border-gray-700 bg-gray-900/50",
                    "hover:bg-gray-800/50 transition-colors"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-1.5 rounded-md", colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-200">
                          {event.eventType.replace("_", " ").toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.timestamp)}
                        </span>
                      </div>

                      <div className="text-xs text-gray-400">
                        Node:{" "}
                        <span className="font-mono text-gray-300">
                          {event.nodeId}
                        </span>
                      </div>

                      {event.data && (
                        <div className="mt-2 p-2 bg-black rounded text-xs font-mono text-gray-300 overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </div>
                      )}

                      {event.error && (
                        <div className="mt-2 p-2 bg-red-900/50 rounded text-xs text-red-300">
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
      <div className="p-3 border-t border-gray-700 bg-black">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Total Events: {events.length}</span>
          <button
            onClick={() => onViewReport(events[0])}
            className="text-blue-400 hover:underline"
          >
            View Narration
          </button>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Live
          </span>
        </div>
      </div>
    </div>
  );
}
