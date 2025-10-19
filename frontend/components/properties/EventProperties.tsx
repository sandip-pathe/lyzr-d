"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventConfig } from "@/types/workflow";
import { AlertCircle } from "lucide-react";

interface EventPropertiesProps {
  config: EventConfig;
  onUpdate: (key: string, value: any) => void;
}

export function EventProperties({ config, onUpdate }: EventPropertiesProps) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={config.name || ""}
          onChange={(e) => onUpdate("name", e.target.value)}
          placeholder="e.g., Publish Result"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - Identifies this event
        </p>
      </div>

      {/* Operation */}
      <div className="space-y-2">
        <Label>Operation</Label>
        <Select
          value={config.operation || "publish"}
          onValueChange={(v) => onUpdate("operation", v)}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="publish">Publish</SelectItem>
            <SelectItem value="subscribe" disabled>
              Subscribe (Not Implemented)
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400">
          Required - Publish or subscribe to events
        </p>
      </div>

      {/* Channel */}
      <div className="space-y-2">
        <Label>Channel</Label>
        <Input
          value={config.channel || ""}
          onChange={(e) => onUpdate("channel", e.target.value)}
          placeholder="e.g., workflow.completed"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - Event channel/topic name
        </p>
      </div>

      {/* Info */}
      {config.operation === "publish" && (
        <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
          <p className="text-xs text-gray-400">
            📤 Previous nodes output will be published as the event payload
          </p>
        </div>
      )}

      {config.operation === "subscribe" && (
        <div className="mt-4 p-3 bg-orange-900/20 rounded border border-orange-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-300">
              Subscribe operation is not fully implemented yet
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
