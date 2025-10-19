"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TriggerConfig } from "@/types/workflow";

interface TriggerPropertiesProps {
  config: TriggerConfig;
  onUpdate: (key: string, value: any) => void;
}

export function TriggerProperties({
  config,
  onUpdate,
}: TriggerPropertiesProps) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={config.name || ""}
          onChange={(e) => onUpdate("name", e.target.value)}
          placeholder="e.g., Start Workflow"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - Identifies this trigger
        </p>
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label>Trigger Type</Label>
        <Select
          value={config.type || "manual"}
          onValueChange={(v) => onUpdate("type", v)}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="event">Event</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Input Text */}
      <div className="space-y-2">
        <Label>Input Text (Optional)</Label>
        <Input
          value={config.input_text || ""}
          onChange={(e) => onUpdate("input_text", e.target.value)}
          placeholder="Simple text input"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">For simple string inputs</p>
      </div>

      {/* Input JSON */}
      <div className="space-y-2">
        <Label>Input JSON (Optional)</Label>
        <Textarea
          value={JSON.stringify(config.input_json || {}, null, 2)}
          onChange={(e) => {
            try {
              onUpdate("input_json", JSON.parse(e.target.value));
            } catch {
              // Ignore parse errors while typing
            }
          }}
          placeholder='{"key": "value"}'
          rows={4}
          className="font-mono text-xs bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Structured data for LLMs or API calls
        </p>
      </div>
    </div>
  );
}
