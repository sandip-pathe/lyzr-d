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
                value={localConfig.type || "manual"}
                onValueChange={(v) => handleConfigUpdate("type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {localConfig.type === "date" && (
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
              <Label>User Input</Label>
              <Textarea
                value={localConfig.userInput || ""}
                onChange={(e) =>
                  handleConfigUpdate("userInput", e.target.value)
                }
                placeholder="Enter user input..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Attachments</Label>
              <Input
                value={localConfig.attachments || ""}
                onChange={(e) =>
                  handleConfigUpdate("attachments", e.target.value.split(","))
                }
                placeholder="URL1, URL2,..."
              />
            </div>
            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea
                value={localConfig.systemPrompt || ""}
                onChange={(e) =>
                  handleConfigUpdate("systemPrompt", e.target.value)
                }
                placeholder="Enter system prompt..."
                rows={4}
              />
            </div>
          </>
        );
      case "api_call":
        return (
          <>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={localConfig.url || ""}
                onChange={(e) => handleConfigUpdate("url", e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div className="space-y-2">
              <Label>HTTP Method</Label>
              <Select
                value={localConfig.method || "GET"}
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
              <Label>Headers (JSON)</Label>
              <Textarea
                value={
                  localConfig.headers
                    ? JSON.stringify(localConfig.headers, null, 2)
                    : "{}"
                }
                onChange={(e) =>
                  handleConfigUpdate("headers", JSON.parse(e.target.value))
                }
                placeholder='{"Authorization": "Bearer token"}'
                rows={3}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>Body (JSON)</Label>
              <Textarea
                value={
                  localConfig.body
                    ? JSON.stringify(localConfig.body, null, 2)
                    : "{}"
                }
                onChange={(e) =>
                  handleConfigUpdate("body", JSON.parse(e.target.value))
                }
                placeholder='{"key": "value"}'
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
      case "conditional":
        return (
          <div className="space-y-2">
            <Label>Condition</Label>
            <Textarea
              value={localConfig.condition || ""}
              onChange={(e) => handleConfigUpdate("condition", e.target.value)}
              placeholder='output.status == "success"'
              rows={3}
              className="font-mono text-xs"
            />
          </div>
        );
      case "event":
        return (
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input
              value={localConfig.topic || ""}
              onChange={(e) => handleConfigUpdate("topic", e.target.value)}
              placeholder="e.g., workflow.completed"
            />
          </div>
        );
      case "fork":
      case "merge":
      case "end":
        return (
          <div className="text-sm text-gray-500">
            No configuration options for this node type.
          </div>
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
            {selectedNode.type.toUpperCase().replace("_", " ")}
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
