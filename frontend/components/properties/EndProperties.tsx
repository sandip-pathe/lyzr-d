"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EndConfig } from "@/types/workflow";

interface EndPropertiesProps {
  config: EndConfig;
  onUpdate: (key: string, value: any) => void;
}

export function EndProperties({ config, onUpdate }: EndPropertiesProps) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={config.name || ""}
          onChange={(e) => onUpdate("name", e.target.value)}
          placeholder="e.g., Workflow Complete"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - Identifies this end node
        </p>
      </div>

      {/* Capture Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="capture-output">Capture Output</Label>
          <Switch
            id="capture-output"
            checked={config.capture_output || false}
            onCheckedChange={(checked) => onUpdate("capture_output", checked)}
          />
        </div>
        <p className="text-xs text-gray-400">
          Save the workflow result for later retrieval
        </p>
      </div>

      {/* Show Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-output">Show Output</Label>
          <Switch
            id="show-output"
            checked={config.show_output !== false} // Default true
            onCheckedChange={(checked) => onUpdate("show_output", checked)}
          />
        </div>
        <p className="text-xs text-gray-400">
          Display the final result in the UI
        </p>
      </div>

      <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
        <p className="text-xs text-gray-400">
          🏁 This node marks the end of the workflow execution
        </p>
      </div>
    </div>
  );
}
