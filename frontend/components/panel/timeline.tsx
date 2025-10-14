"use client";

import { useWorkflowStore } from "@/lib/store";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExecutionEvent } from "@/types/workflow";

export function TimelinePanel() {
  const { events, bottomPanelOpen, toggleBottomPanel } = useWorkflowStore();

  return (
    <motion.div
      initial={false}
      animate={{ height: bottomPanelOpen ? 240 : 40 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-t border-gray-200 shadow-lg"
    >
      {/* Header */}
      <div className="h-10 px-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Execution Timeline
          </h3>
          <span className="text-xs text-gray-600">
            ({events.length} events)
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleBottomPanel}>
          {bottomPanelOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Timeline Content */}
      {bottomPanelOpen && (
        <ScrollArea className="h-[200px] px-4 py-3">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Events */}
            <div className="space-y-4">
              {events.map((event, index) => (
                <TimelineEvent key={event.id} event={event} index={index} />
              ))}
            </div>
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
}

function TimelineEvent({
  event,
  index,
}: {
  event: ExecutionEvent;
  index: number;
}) {
  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "started":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "approval_requested":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative flex items-start gap-4 pl-2"
    >
      {/* Timeline Dot */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={`w-3 h-3 rounded-full ${getEventColor(
            event.eventType
          )} ring-4 ring-white`}
        />
      </div>

      {/* Event Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900">
            {event.eventType.replace("_", " ").toUpperCase()}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(event.timestamp)}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          <span className="font-mono">{event.nodeId}</span>
        </div>
        {event.data && (
          <div className="mt-1 text-xs text-gray-500">
            {JSON.stringify(event.data)}
          </div>
        )}
      </div>
    </motion.div>
  );
}
