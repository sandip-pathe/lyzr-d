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
import { MergeConfig } from "@/types/workflow";
import { AlertCircle } from "lucide-react";

interface MergePropertiesProps {
  config: MergeConfig;
  onUpdate: (key: string, value: any) => void;
}

export function MergeProperties({ config, onUpdate }: MergePropertiesProps) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={config.name || ""}
          onChange={(e) => onUpdate("name", e.target.value)}
          placeholder="e.g., Combine Results"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - Identifies this merge
        </p>
      </div>

      {/* Merge Strategy */}
      <div className="space-y-2">
        <Label>Merge Strategy</Label>
        <Select
          value={config.merge_strategy || "combine"}
          onValueChange={(v) => onUpdate("merge_strategy", v)}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="combine">Combine All</SelectItem>
            <SelectItem value="first">First Completed</SelectItem>
            <SelectItem value="vote">Vote (Most Common)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400">
          Required - How to merge branches
        </p>
      </div>

      {/* Strategy Explanation */}
      <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700 space-y-2">
        <p className="text-xs font-semibold text-white">Strategy Details:</p>
        {config.merge_strategy === "combine" && (
          <p className="text-xs text-gray-400">
            Merges all branch results into a single array
          </p>
        )}
        {config.merge_strategy === "first" && (
          <p className="text-xs text-gray-400">
            Uses the result from the first completed branch
          </p>
        )}
        {config.merge_strategy === "vote" && (
          <p className="text-xs text-gray-400">
            Selects the most common result across all branches
          </p>
        )}
      </div>

      <div className="mt-4 p-3 bg-orange-900/20 rounded border border-orange-700">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-orange-300">
            Note: Parallel execution is currently sequential. True parallel
            execution coming soon.
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
        <p className="text-xs text-gray-400">
          💡 Connect multiple incoming nodes to merge their outputs
        </p>
      </div>
    </div>
  );
}
