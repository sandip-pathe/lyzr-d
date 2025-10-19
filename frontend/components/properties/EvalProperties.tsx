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
import { EvalConfig } from "@/types/workflow";

interface EvalPropertiesProps {
  config: EvalConfig;
  onUpdate: (key: string, value: any) => void;
}

export function EvalProperties({ config, onUpdate }: EvalPropertiesProps) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={config.name || ""}
          onChange={(e) => onUpdate("name", e.target.value)}
          placeholder="e.g., Validate Output"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">Required - Identifies this eval</p>
      </div>

      {/* Eval Type */}
      <div className="space-y-2">
        <Label>Evaluation Type</Label>
        <Select
          value={config.eval_type || "schema"}
          onValueChange={(v) => onUpdate("eval_type", v)}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="schema">JSON Schema Validation</SelectItem>
            <SelectItem value="llm_judge">LLM Judge</SelectItem>
            <SelectItem value="policy">Policy Rules</SelectItem>
            <SelectItem value="custom">Custom Validator</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400">Required - Validation strategy</p>
      </div>

      {/* Eval Config */}
      <div className="space-y-2">
        <Label>Evaluation Config (JSON)</Label>
        <Textarea
          value={JSON.stringify(config.config || {}, null, 2)}
          onChange={(e) => {
            try {
              onUpdate("config", JSON.parse(e.target.value));
            } catch {
              // Ignore parse errors while typing
            }
          }}
          placeholder={getConfigPlaceholder(config.eval_type)}
          rows={6}
          className="font-mono text-xs bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Specific configuration for {config.eval_type || "evaluation"}
        </p>
      </div>

      {/* On Failure */}
      <div className="space-y-2">
        <Label>On Failure Action</Label>
        <Select
          value={config.on_failure || "block"}
          onValueChange={(v) => onUpdate("on_failure", v)}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="block">Block Execution</SelectItem>
            <SelectItem value="warn">Warn & Continue</SelectItem>
            <SelectItem value="retry">Retry Previous Node</SelectItem>
            <SelectItem value="compensate">Trigger Compensation</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400">
          Required - What happens if validation fails
        </p>
      </div>

      <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
        <p className="text-xs text-gray-400">
          🔍 Evaluates the output from the previous node
        </p>
      </div>
    </div>
  );
}

function getConfigPlaceholder(evalType?: string): string {
  switch (evalType) {
    case "schema":
      return '{\n  "required_fields": ["name", "date"],\n  "field_types": {"score": "number"}\n}';
    case "llm_judge":
      return '{\n  "criteria": "Output must be professional",\n  "min_score": 0.8\n}';
    case "policy":
      return '{\n  "rules": ["no_pii", "valid_format"],\n  "strict": true\n}';
    default:
      return '{\n  "key": "value"\n}';
  }
}
