"use client";

import { useWorkflowStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings, Trash2, AlertTriangle } from "lucide-react";
import { WorkflowNode, SpecificNodeConfig } from "@/types/workflow";
import {
  TriggerProperties,
  AgentProperties,
  ApiCallProperties,
  ConditionalProperties,
  EndProperties,
  ApprovalProperties,
  EvalProperties,
  MergeProperties,
  EventProperties,
  TimerProperties,
} from "@/components/properties";

export function PropertiesPanel() {
  const { nodes, selectedNodeId, updateNode, deleteNode, setSelectedNode } =
    useWorkflowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="h-full bg-black text-gray-500 flex items-center justify-center p-4 text-center">
        Select a node to view its properties.
      </div>
    );
  }

  // Generic config update function
  const handleConfigUpdate = (key: string, value: any) => {
    if (!selectedNode) return;
    const currentConfig = selectedNode.data.config || {};
    const newConfig = { ...currentConfig, [key]: value };

    updateNode(selectedNode.id, {
      data: { ...selectedNode.data, config: newConfig as SpecificNodeConfig },
    });
  };

  const handleLabelUpdate = (label: string) => {
    if (!selectedNode) return;
    updateNode(selectedNode.id, {
      data: { ...selectedNode.data, label },
    });
  };

  const handleDelete = () => {
    if (!selectedNodeId) return;
    if (confirm("Are you sure you want to delete this node?")) {
      deleteNode(selectedNodeId);
      setSelectedNode(null);
    }
  };

  // Render specific property component based on node type
  const renderNodeProperties = (node: WorkflowNode) => {
    const config = node.data.config || {};

    switch (node.type) {
      case "trigger":
        return (
          <TriggerProperties
            config={config as any}
            onUpdate={handleConfigUpdate}
          />
        );
      case "agent":
        return (
          <AgentProperties
            config={config as any}
            onUpdate={handleConfigUpdate}
          />
        );
      case "api_call":
        return (
          <ApiCallProperties
            config={config as any}
            onUpdate={handleConfigUpdate}
          />
        );
      case "conditional":
        return (
          <ConditionalProperties
            config={config as any}
            onUpdate={handleConfigUpdate}
          />
        );
      case "end":
        return (
          <EndProperties config={config as any} onUpdate={handleConfigUpdate} />
        );
      case "approval":
        return (
          <ApprovalProperties
            config={config as any}
            onUpdate={handleConfigUpdate}
          />
        );
      case "eval":
        return (
          <EvalProperties
            config={config as any}
            onUpdate={handleConfigUpdate}
          />
        );
      case "merge":
        return (
          <MergeProperties
            config={config as any}
            onUpdate={handleConfigUpdate}
          />
        );
      case "event":
        return (
          <EventProperties
            config={config as any}
            onUpdate={handleConfigUpdate}
          />
        );
      case "timer":
        return (
          <TimerProperties
            config={config as any}
            onUpdate={handleConfigUpdate}
          />
        );
      default:
        const _exhaustiveCheck: never = node.type;
        console.warn(
          "Unhandled node type in properties panel:",
          _exhaustiveCheck as string
        );
        return (
          <div className="text-sm text-red-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Configuration UI not implemented for node type: {node.type}
          </div>
        );
    }
  };

  // Get node type display name
  const getNodeTypeDisplay = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div
      className="h-full bg-black text-white overflow-y-auto"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold text-lg text-white">
            {getNodeTypeDisplay(selectedNode.type)} Node
          </h2>
        </div>
      </div>

      {/* Panel Content */}
      <div className="p-4 space-y-4">
        {/* Label */}
        <div className="space-y-2">
          <Label htmlFor={`node-label-${selectedNodeId}`}>Node Label</Label>
          <Input
            id={`node-label-${selectedNodeId}`}
            value={selectedNode.data.label || ""}
            onChange={(e) => handleLabelUpdate(e.target.value)}
            placeholder="Node label"
            className="bg-gray-800 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400">Display name in the canvas</p>
        </div>

        <Separator className="bg-gray-700" />

        {/* Configuration Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base text-gray-300">
            Configuration
          </h3>
          {renderNodeProperties(selectedNode)}
        </div>

        <Separator className="bg-gray-700" />

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="destructive"
            className="w-full bg-red-900/80 hover:bg-red-900 text-white"
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
