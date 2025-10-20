"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AgentConfig } from "@/types/workflow";

interface AgentPropertiesProps {
  config: AgentConfig;
  onUpdate: (key: string, value: any) => void;
}

export function AgentProperties({ config, onUpdate }: AgentPropertiesProps) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={config.name || ""}
          onChange={(e) => onUpdate("name", e.target.value)}
          placeholder="e.g., Extract Data"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - Identifies this agent
        </p>
      </div>

      {/* System Instructions */}
      <div className="space-y-2">
        <Label>System Instructions</Label>
        <Textarea
          value={config.system_instructions || ""}
          onChange={(e) => onUpdate("system_instructions", e.target.value)}
          placeholder="You are a helpful assistant that extracts key information..."
          rows={4}
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - Defines the agents behavior
        </p>
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <Label>Temperature</Label>
        <Input
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={config.temperature ?? 0.7}
          onChange={(e) =>
            onUpdate("temperature", parseFloat(e.target.value) || 0.7)
          }
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Controls creativity (0.0 = deterministic, 1.0+ = creative)
        </p>
      </div>

      {/* Expected Output Format */}
      <div className="space-y-2">
        <Label>Expected Output Format (Optional)</Label>
        <Textarea
          value={config.expected_output_format || ""}
          onChange={(e) => onUpdate("expected_output_format", e.target.value)}
          placeholder="JSON with fields: name, date, amount"
          rows={2}
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Helps ensure predictable output for downstream nodes
        </p>
      </div>

      {/* Provider */}
      <div className="space-y-2">
        <Label>Provider</Label>
        <Input
          value={config.provider || "openai"}
          onChange={(e) => onUpdate("provider", e.target.value)}
          placeholder="openai"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">Default: openai</p>
      </div>

      {/* Agent ID / Model */}
      <div className="space-y-2">
        <Label>Model ID</Label>
        <Input
          value={config.agent_id || "gpt-4o-mini"}
          onChange={(e) => onUpdate("agent_id", e.target.value)}
          placeholder="gpt-4o-mini"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">Default: gpt-4o-mini</p>
      </div>

      <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
        <p className="text-xs text-gray-400">
          💡 Input is automatically taken from the previous nodes output
        </p>
      </div>
    </div>
  );
}
