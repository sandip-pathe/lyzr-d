"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimerConfig } from "@/types/workflow";
import { Clock } from "lucide-react";

interface TimerPropertiesProps {
  config: TimerConfig;
  onUpdate: (key: string, value: any) => void;
}

export function TimerProperties({ config, onUpdate }: TimerPropertiesProps) {
  const durationSeconds = config.duration_seconds || 0;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={config.name || ""}
          onChange={(e) => onUpdate("name", e.target.value)}
          placeholder="e.g., Wait 5 Minutes"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - Identifies this timer
        </p>
      </div>

      {/* Duration in Seconds */}
      <div className="space-y-2">
        <Label>Duration (seconds)</Label>
        <Input
          type="number"
          min="0"
          value={durationSeconds}
          onChange={(e) =>
            onUpdate("duration_seconds", parseInt(e.target.value, 10) || 0)
          }
          placeholder="300"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - How long to pause the workflow
        </p>
      </div>

      {/* Duration Display */}
      {durationSeconds > 0 && (
        <div className="p-3 bg-purple-900/20 rounded border border-purple-700">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <div className="text-sm text-purple-300">
              {minutes > 0 && `${minutes} minute${minutes !== 1 ? "s" : ""}`}
              {minutes > 0 && seconds > 0 && " and "}
              {seconds > 0 && `${seconds} second${seconds !== 1 ? "s" : ""}`}
            </div>
          </div>
        </div>
      )}

      {/* Quick Presets */}
      <div className="space-y-2">
        <Label className="text-gray-400">Quick Presets:</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onUpdate("duration_seconds", 60)}
            className="px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white transition-colors"
          >
            1 minute
          </button>
          <button
            onClick={() => onUpdate("duration_seconds", 300)}
            className="px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white transition-colors"
          >
            5 minutes
          </button>
          <button
            onClick={() => onUpdate("duration_seconds", 600)}
            className="px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white transition-colors"
          >
            10 minutes
          </button>
          <button
            onClick={() => onUpdate("duration_seconds", 3600)}
            className="px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white transition-colors"
          >
            1 hour
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
        <p className="text-xs text-gray-400">
          ⏳ Workflow will pause at this node for the specified duration
        </p>
      </div>
    </div>
  );
}
