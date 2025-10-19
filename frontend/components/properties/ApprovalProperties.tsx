"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApprovalConfig } from "@/types/workflow";
import { AlertCircle } from "lucide-react";

interface ApprovalPropertiesProps {
  config: ApprovalConfig;
  onUpdate: (key: string, value: any) => void;
}

export function ApprovalProperties({
  config,
  onUpdate,
}: ApprovalPropertiesProps) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={config.name || ""}
          onChange={(e) => onUpdate("name", e.target.value)}
          placeholder="e.g., Legal Review"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">Required - Approval step title</p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={config.description || ""}
          onChange={(e) => onUpdate("description", e.target.value)}
          placeholder="Please review the contract and approve to proceed..."
          rows={4}
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - Instructions for the approver
        </p>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-orange-900/20 rounded border border-orange-700">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-orange-300 space-y-1">
            <p className="font-semibold">Approval Flow:</p>
            <p>
              Workflow pauses at this node until a user approves or rejects via
              the UI or API
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 rounded border border-blue-700">
        <p className="text-xs text-blue-300">
          ⚡ Connect <strong>approve</strong> and <strong>reject</strong>{" "}
          handles to different nodes
        </p>
      </div>

      <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
        <p className="text-xs text-gray-400">
          💡 Previous nodes output will be shown as context to the approver
        </p>
      </div>
    </div>
  );
}
