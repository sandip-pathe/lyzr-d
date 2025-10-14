"use client";

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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Trash2, Copy } from "lucide-react";
import { useState } from "react";

export function PropertiesPanel() {
  const { nodes, selectedNodeId, updateNode, deleteNode } = useWorkflowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const [localConfig, setLocalConfig] = useState(
    selectedNode?.data.config || {}
  );

  if (!selectedNode) {
    return (
      <div className="h-full bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-400 p-8">
          <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm font-medium">No node selected</p>
          <p className="text-xs mt-2">Select a node to edit its properties</p>
        </div>
      </div>
    );
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
    }
  };

  const renderConfigFields = () => {
    switch (selectedNode.type) {
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
                  <SelectItem value="lyzr">Lyzr Agent Factory</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="custom">Custom API</SelectItem>
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

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-tune">Auto-Tuning</Label>
              <Switch
                id="auto-tune"
                checked={localConfig.autoTune || false}
                onCheckedChange={(checked) =>
                  handleConfigUpdate("autoTune", checked)
                }
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

            <div className="flex items-center justify-between">
              <Label htmlFor="compensation">Enable Compensation</Label>
              <Switch
                id="compensation"
                checked={localConfig.compensation || false}
                onCheckedChange={(checked) =>
                  handleConfigUpdate("compensation", checked)
                }
              />
            </div>
          </>
        );

      case "approval":
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any (first approval wins)</SelectItem>
                  <SelectItem value="all">All (unanimous)</SelectItem>
                  <SelectItem value="majority">Majority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timeout (hours)</Label>
              <Input
                type="number"
                value={localConfig.timeout || 24}
                onChange={(e) =>
                  handleConfigUpdate("timeout", parseInt(e.target.value))
                }
              />
            </div>
          </>
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

            <div className="space-y-2">
              <Label>Pass Threshold</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={localConfig.threshold || 0.8}
                onChange={(e) =>
                  handleConfigUpdate("threshold", parseFloat(e.target.value))
                }
              />
            </div>
          </>
        );

      case "timer":
        return (
          <>
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
          </>
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
    <div className="h-full bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-lg text-gray-900">Properties</h2>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Node Info */}
        <div className="space-y-2">
          <Label>Node ID</Label>
          <Input
            value={selectedNode.id}
            disabled
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label>Node Type</Label>
          <Input value={selectedNode.type.toUpperCase()} disabled />
        </div>

        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={selectedNode.data.label}
            onChange={(e) => handleLabelUpdate(e.target.value)}
            placeholder="Node label"
          />
        </div>

        <Separator />

        {/* Dynamic Configuration */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-gray-700">Configuration</h3>
          {renderConfigFields()}
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full" size="sm">
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
