"use client";

import { useEffect, useState } from "react";
import { useWorkflowStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings, Trash2, Copy } from "lucide-react";
import { WorkflowNode } from "@/types/workflow";

export function PropertiesPanel() {
  const { nodes, selectedNodeId, updateNode, deleteNode, setSelectedNode } =
    useWorkflowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const [localConfig, setLocalConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setLocalConfig(selectedNode.data.config || {});
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return null;
  }

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    updateNode(selectedNode.id, {
      data: { ...selectedNode.data, config: newConfig },
    });
  };

  const handleLabelUpdate = (label: string) => {
    updateNode(selectedNode.id, {
      data: { ...selectedNode.data, label },
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this node?")) {
      deleteNode(selectedNode.id);
      setSelectedNode(null);
    }
  };

  const renderConfigFields = (node: WorkflowNode) => {
    switch (node.type) {
      case "trigger":
        return (
          <>
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select
                value={localConfig.trigger_type || "on_run"}
                onValueChange={(v) => handleConfigUpdate("trigger_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_run">On Run</SelectItem>
                  <SelectItem value="after_hours">After Hours</SelectItem>
                  <SelectItem value="select_date">Select Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {localConfig.trigger_type === "after_hours" && (
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input
                  type="number"
                  value={localConfig.hours || 1}
                  onChange={(e) =>
                    handleConfigUpdate("hours", parseInt(e.target.value))
                  }
                />
              </div>
            )}
            {localConfig.trigger_type === "select_date" && (
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={
                    localConfig.date || new Date().toISOString().split("T")[0]
                  }
                  onChange={(e) => handleConfigUpdate("date", e.target.value)}
                />
              </div>
            )}
          </>
        );
      case "agent":
        return (
          <>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={localConfig.provider || "openai"}
                onValueChange={(v) => handleConfigUpdate("provider", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                value={localConfig.model || "gpt-4"}
                onChange={(e) => handleConfigUpdate("model", e.target.value)}
                placeholder="gpt-4"
              />
            </div>
            <div className="space-y-2">
              <Label>Temperature</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={localConfig.temperature || 0.7}
                onChange={(e) =>
                  handleConfigUpdate("temperature", parseFloat(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={localConfig.prompt || ""}
                onChange={(e) => handleConfigUpdate("prompt", e.target.value)}
                placeholder="Enter system prompt..."
                rows={4}
              />
            </div>
          </>
        );
      case "action":
        return (
          <>
            <div className="space-y-2">
              <Label>HTTP Method</Label>
              <Select
                value={localConfig.method || "POST"}
                onValueChange={(v) => handleConfigUpdate("method", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={localConfig.url || ""}
                onChange={(e) => handleConfigUpdate("url", e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div className="space-y-2">
              <Label>Headers (JSON)</Label>
              <Textarea
                value={localConfig.headers || "{}"}
                onChange={(e) => handleConfigUpdate("headers", e.target.value)}
                placeholder='{"Authorization": "Bearer token"}'
                rows={3}
                className="font-mono text-xs"
              />
            </div>
          </>
        );

      case "approval":
        return (
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              value={localConfig.prompt || ""}
              onChange={(e) => handleConfigUpdate("prompt", e.target.value)}
              placeholder="Enter the approval question for the user..."
              rows={3}
            />
          </div>
        );

      // NEW: HITL Configuration (old approval logic)
      case "hitl":
        return (
          <>
            <div className="space-y-2">
              <Label>Approvers (comma-separated emails)</Label>
              <Textarea
                value={localConfig.approvers?.join(", ") || ""}
                onChange={(e) =>
                  handleConfigUpdate(
                    "approvers",
                    e.target.value.split(",").map((s) => s.trim())
                  )
                }
                placeholder="john@company.com, jane@company.com"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Approval Type</Label>
              <Select
                value={localConfig.approvalType || "any"}
                onValueChange={(v) => handleConfigUpdate("approvalType", v)}
              >
                {/* ... Select options */}
              </Select>
            </div>
            {/* ... other HITL config fields */}
          </>
        );

      // NEW: Conditional Node Configuration
      case "conditional":
        return (
          <div className="space-y-2">
            <Label>Conditions</Label>
            <Textarea
              value={
                localConfig.conditions
                  ? JSON.stringify(localConfig.conditions, null, 2)
                  : '[\n  {\n    "condition": "output.status == \\"success\\"",\n    "target_id": "node-id-if-true"\n  }\n]'
              }
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleConfigUpdate("conditions", parsed);
                } catch (err) {
                  // Handle invalid JSON
                }
              }}
              placeholder="Define conditions and target node IDs"
              rows={6}
              className="font-mono text-xs"
            />
            <p className="text-xs text-gray-500">
              Define a list of conditions. The first one that evaluates to true
              will be followed. Use &aspo;output to reference the previous nodes
              result.
            </p>
          </div>
        );
      case "eval":
        return (
          <>
            <div className="space-y-2">
              <Label>Evaluation Type</Label>
              <Select
                value={localConfig.evalType || "llm_judge"}
                onValueChange={(v) => handleConfigUpdate("evalType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schema">Schema Validation</SelectItem>
                  <SelectItem value="llm_judge">LLM Judge</SelectItem>
                  <SelectItem value="policy">Policy Check</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Criteria</Label>
              <Textarea
                value={localConfig.criteria || ""}
                onChange={(e) => handleConfigUpdate("criteria", e.target.value)}
                placeholder="Define evaluation criteria..."
                rows={4}
              />
            </div>
          </>
        );
      case "timer":
        return (
          <div className="space-y-2">
            <Label>Duration (seconds)</Label>
            <Input
              type="number"
              value={localConfig.duration || 60}
              onChange={(e) =>
                handleConfigUpdate("duration", parseInt(e.target.value))
              }
            />
          </div>
        );
      case "event":
        return (
          <>
            <div className="space-y-2">
              <Label>Topics (comma-separated)</Label>
              <Textarea
                value={localConfig.topics?.join(", ") || ""}
                onChange={(e) =>
                  handleConfigUpdate(
                    "topics",
                    e.target.value.split(",").map((s) => s.trim())
                  )
                }
                placeholder="workflow.started, node.completed"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={localConfig.action || "publish"}
                onValueChange={(v) => handleConfigUpdate("action", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="subscribe">Subscribe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      default:
        return (
          <div className="text-sm text-gray-500">
            No configuration options for this node type
          </div>
        );
    }
  };

  return (
    <div
      className="h-full text-white overflow-y-auto"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="p-4 border-b border-gray-600 bg-black">
        <div className="flex items-center bg-inherit gap-2">
          <Settings className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-lg text-white">
            {selectedNode.type.toUpperCase()}
          </h2>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={selectedNode.data.label}
            onChange={(e) => handleLabelUpdate(e.target.value)}
            placeholder="Node label"
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Configuration</h3>
          {renderConfigFields(selectedNode)}
        </div>

        <Separator />

        <div className="space-y-2">
          <Button variant="default" className="w-full bg-gray-500" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Duplicate Node
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Node
          </Button>
        </div>
      </div>
    </div>
  );
}
