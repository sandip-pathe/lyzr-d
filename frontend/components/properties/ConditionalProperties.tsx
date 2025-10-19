"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConditionalConfig } from "@/types/workflow";

interface ConditionalPropertiesProps {
  config: ConditionalConfig;
  onUpdate: (key: string, value: any) => void;
}

export function ConditionalProperties({
  config,
  onUpdate,
}: ConditionalPropertiesProps) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={config.name || ""}
          onChange={(e) => onUpdate("name", e.target.value)}
          placeholder="e.g., Check Status"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - Identifies this condition
        </p>
      </div>

      {/* Condition Expression */}
      <div className="space-y-2">
        <Label>Condition Expression</Label>
        <Textarea
          value={config.condition_expression || ""}
          onChange={(e) => onUpdate("condition_expression", e.target.value)}
          placeholder="output.get('status') == 'approved'"
          rows={4}
          className="font-mono text-xs bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - Python expression that evaluates to True/False
        </p>
      </div>

      {/* Help Section */}
      <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700 space-y-2">
        <p className="text-xs font-semibold text-white">Available Variables:</p>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>
            <code className="text-purple-400">output</code> - Previous nodes
            result
          </li>
          <li>
            <code className="text-purple-400">nodes</code> - All node outputs by
            ID
          </li>
          <li>
            <code className="text-purple-400">input</code> - Initial workflow
            input
          </li>
        </ul>
        <p className="text-xs text-gray-400 mt-2">
          Examples:
          <br />
          <code className="text-green-400">output.get(score) {">"} 0.8</code>
          <br />
          <code className="text-green-400">
            nodes[agent-1].get(status) == success
          </code>
        </p>
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 rounded border border-blue-700">
        <p className="text-xs text-blue-300">
          ⚡ Connect <strong>true</strong> and <strong>false</strong> handles to
          different nodes
        </p>
      </div>
    </div>
  );
}
