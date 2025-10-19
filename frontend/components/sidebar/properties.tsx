// frontend/components/sidebar/properties.tsx
// --- SIMPLIFIED VERSION ---

"use client";

import { useState } from "react"; // Removed useEffect and related state for mappings
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
import { Settings, Trash2, Copy, AlertTriangle } from "lucide-react";
import {
  WorkflowNode,
  BaseNodeConfig, // Still useful for type checking
  TriggerConfig,
  AgentConfig,
  ApiCallConfig,
  ApprovalConfig,
  ConditionalConfig,
  EvalConfig,
  TimerConfig,
  EventConfig,
  MetaConfig,
  SpecificNodeConfig,
} from "@/types/workflow";
// Removed toast import as it was only used for mapping JSON errors

// Type guard functions remain the same as the previous correct version
function isTriggerConfig(
  config: SpecificNodeConfig | {}
): config is TriggerConfig {
  return (
    typeof config === "object" &&
    config !== null &&
    "type" in config &&
    (config as any).type in ["manual", "schedule", "webhook"]
  );
}
function isAgentConfig(config: SpecificNodeConfig | {}): config is AgentConfig {
  return (
    typeof config === "object" &&
    config !== null &&
    "provider" in config &&
    "agent_id" in config
  );
}
function isApiCallConfig(
  config: SpecificNodeConfig | {}
): config is ApiCallConfig {
  return (
    typeof config === "object" &&
    config !== null &&
    "url" in config &&
    "method" in config
  );
}
function isApprovalConfig(
  config: SpecificNodeConfig | {}
): config is ApprovalConfig {
  return (
    typeof config === "object" &&
    config !== null &&
    "description" in config &&
    "approvers" in config
  );
}
function isConditionalConfig(
  config: SpecificNodeConfig | {}
): config is ConditionalConfig {
  return (
    typeof config === "object" &&
    config !== null &&
    "condition_expression" in config
  );
}
function isEvalConfig(config: SpecificNodeConfig | {}): config is EvalConfig {
  return (
    typeof config === "object" &&
    config !== null &&
    "eval_type" in config &&
    "config" in config
  );
}
function isTimerConfig(config: SpecificNodeConfig | {}): config is TimerConfig {
  return (
    typeof config === "object" &&
    config !== null &&
    "duration_seconds" in config
  );
}
function isEventConfig(config: SpecificNodeConfig | {}): config is EventConfig {
  return (
    typeof config === "object" &&
    config !== null &&
    "operation" in config &&
    "channel" in config
  );
}
function isMetaConfig(config: SpecificNodeConfig | {}): config is MetaConfig {
  return typeof config === "object" && config !== null && "operation" in config;
}

export function PropertiesPanel() {
  const { nodes, selectedNodeId, updateNode, deleteNode, setSelectedNode } =
    useWorkflowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Removed state related to input/output mapping JSON strings

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
    // Ensure we don't accidentally save empty mapping fields if they were removed
    const baseConfig: Partial<BaseNodeConfig> = {};
    if ("input_mapping" in currentConfig)
      baseConfig.input_mapping = (
        currentConfig as BaseNodeConfig
      ).input_mapping;
    if ("output_mapping" in currentConfig)
      baseConfig.output_mapping = (
        currentConfig as BaseNodeConfig
      ).output_mapping;

    const newSpecificConfig = { ...currentConfig, [key]: value };
    // Merge base and specific, ensuring key update takes precedence
    const finalConfig = { ...baseConfig, ...newSpecificConfig };

    updateNode(selectedNode.id, {
      data: { ...selectedNode.data, config: finalConfig as SpecificNodeConfig },
    });
  };

  // Removed handleMappingUpdate function

  const handleLabelUpdate = (label: string) => {
    if (!selectedNode) return;
    updateNode(selectedNode.id, {
      data: { ...selectedNode.data, label },
    });
  };

  const handleDelete = () => {
    // ... (implementation as before) ...
    if (!selectedNodeId) return;
    if (confirm("Are you sure you want to delete this node?")) {
      deleteNode(selectedNodeId);
      setSelectedNode(null);
    }
  };

  // --- Render specific fields based on node type ---
  const renderConfigFields = (node: WorkflowNode) => {
    const config = node.data.config || {};

    // --- Type guards and rendering logic remain the same as previous correct version ---
    // (No changes needed inside this function, just removed mapping fields below)
    switch (node.type) {
      case "trigger":
        if (isTriggerConfig(config)) {
          return (
            <>
              {/* Access config.type safely */}
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select
                  value={config.type || "manual"} // Now safe to access .type
                  onValueChange={(v) => handleConfigUpdate("type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {config.type === "schedule" && ( // Now safe to access .type
                <div className="space-y-2">
                  <Label>Schedule (Cron)</Label>
                  <Input
                    value={config.schedule || ""} // Now safe to access .schedule
                    onChange={(e) =>
                      handleConfigUpdate("schedule", e.target.value)
                    }
                    placeholder="* * * * *"
                  />
                </div>
              )}
              {config.type === "webhook" && ( // Now safe to access .type
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    value={config.webhook_url || "Will be generated on save"} // Now safe
                    readOnly
                    className="italic text-gray-400"
                  />
                </div>
              )}
            </>
          );
        }
        break;

      case "agent":
        if (isAgentConfig(config)) {
          return (
            <>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Input
                  value={config.provider} // Safe
                  onChange={(e) =>
                    handleConfigUpdate("provider", e.target.value)
                  }
                  placeholder="e.g., openai, lyzr"
                />
              </div>
              <div className="space-y-2">
                <Label>Agent/Model ID</Label>
                <Input
                  value={config.agent_id} // Safe
                  onChange={(e) =>
                    handleConfigUpdate("agent_id", e.target.value)
                  }
                  placeholder="e.g., gpt-4o-mini"
                />
              </div>
              <div className="space-y-2">
                <Label>Temperature (Optional)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={config.temperature ?? ""} // Safe
                  onChange={(e) =>
                    handleConfigUpdate(
                      "temperature",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="Default (e.g., 0.7)"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Input will be taken from the previous node&asop;s output.
              </p>
            </>
          );
        }
        break;

      case "api_call":
        if (isApiCallConfig(config)) {
          return (
            <>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={config.url} // Safe
                  onChange={(e) => handleConfigUpdate("url", e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
              <div className="space-y-2">
                <Label>HTTP Method</Label>
                <Select
                  value={config.method || "POST"} // Safe
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
                  value={JSON.stringify(config.headers || {}, null, 2)} // Safe
                  onChange={(e) => {
                    try {
                      handleConfigUpdate("headers", JSON.parse(e.target.value));
                    } catch {
                      /* Ignore parse error during typing */
                    }
                  }}
                  placeholder='{"Authorization": "Bearer token"}'
                  rows={3}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Body Template (JSON)</Label>
                <Textarea
                  value={JSON.stringify(config.body_template || {}, null, 2)} // Safe
                  onChange={(e) => {
                    try {
                      handleConfigUpdate(
                        "body_template",
                        JSON.parse(e.target.value)
                      );
                    } catch {
                      /* Ignore parse error during typing */
                    }
                  }}
                  placeholder='{"key": "{{input.value}}", "static": "data"}'
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-gray-400">
                  Use {"{{input.*}}"} or {"{{nodes.node_id.*}}"} for dynamic
                  values from previous outputs.
                </p>
              </div>
            </>
          );
        }
        break;

      case "approval":
        if (isApprovalConfig(config)) {
          return (
            <>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={config.title || "Approval Required"} // Safe
                  onChange={(e) => handleConfigUpdate("title", e.target.value)}
                  placeholder="Title for the approval request"
                />
              </div>
              <div className="space-y-2">
                <Label>Description / Instructions</Label>
                <Textarea
                  value={config.description} // Safe
                  onChange={(e) =>
                    handleConfigUpdate("description", e.target.value)
                  }
                  placeholder="Enter instructions for the approver..."
                  rows={3}
                />
                <p className="text-xs text-gray-400">
                  Context from the previous node will be shown to the approver.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Approvers (comma-separated)</Label>
                <Input
                  value={(config.approvers || []).join(", ")} // Safe
                  onChange={(e) =>
                    handleConfigUpdate(
                      "approvers",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Channels (comma-separated)</Label>
                <Input
                  value={(config.channels || []).join(", ")} // Safe
                  onChange={(e) =>
                    handleConfigUpdate(
                      "channels",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="ui, slack, email"
                />
              </div>
            </>
          );
        }
        break;

      case "conditional":
        if (isConditionalConfig(config)) {
          return (
            <div className="space-y-2">
              <Label>Condition Expression</Label>
              <Textarea
                value={config.condition_expression} // Safe
                onChange={(e) =>
                  handleConfigUpdate("condition_expression", e.target.value)
                }
                placeholder='output.status == "success" or nodes.some_node.value > 10'
                rows={3}
                className="font-mono text-xs"
              />
              <p className="text-xs text-gray-400">
                Evaluates against &aspo;output&aspo; (previous result),
                &aspo;nodes&aspo; (all results), &aspo;input&aspo; (workflow
                start). Connect &aspo;true&aspo;/&aspo;false&aspo; handles.
              </p>
            </div>
          );
        }
        break;

      case "timer":
        if (isTimerConfig(config)) {
          return (
            <div className="space-y-2">
              <Label>Duration (seconds)</Label>
              <Input
                type="number"
                min="0"
                value={config.duration_seconds ?? 0} // Safe, provide default
                onChange={(e) =>
                  handleConfigUpdate(
                    "duration_seconds",
                    parseInt(e.target.value, 10) || 0
                  )
                }
              />
            </div>
          );
        }
        break;

      case "eval":
        if (isEvalConfig(config)) {
          // Simplified view - showing the nested config as JSON
          // TODO: Build specific UIs based on eval_type
          return (
            <>
              <div className="space-y-2">
                <Label>Evaluation Type</Label>
                <Select
                  value={config.eval_type} // Safe
                  onValueChange={(v) => handleConfigUpdate("eval_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schema">JSON Schema</SelectItem>
                    <SelectItem value="llm_judge">LLM Judge</SelectItem>
                    <SelectItem value="policy">Policy Rules</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Evaluation Config (JSON)</Label>
                <Textarea
                  value={JSON.stringify(config.config || {}, null, 2)} // Safe
                  onChange={(e) => {
                    try {
                      handleConfigUpdate("config", JSON.parse(e.target.value));
                    } catch {
                      /* Ignore parse error */
                    }
                  }}
                  rows={6}
                  className="font-mono text-xs"
                  placeholder={`Specific config for ${config.eval_type}...`} // Safe
                />
                <p className="text-xs text-gray-400">
                  Evaluates the output of the previous node.
                </p>
              </div>
              <div className="space-y-2">
                <Label>On Failure Action</Label>
                <Select
                  value={config.on_failure || "block"} // Safe
                  onValueChange={(v) => handleConfigUpdate("on_failure", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block Execution</SelectItem>
                    <SelectItem value="warn">Warn & Continue</SelectItem>
                    <SelectItem value="retry">
                      Retry Node (if possible)
                    </SelectItem>
                    <SelectItem value="compensate">
                      Trigger Compensation
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          );
        }
        break;

      case "fork":
      case "merge":
      case "end":
        return (
          <div className="text-sm text-gray-500">
            No specific configuration options for this node type. Behavior is
            defined by connections.
          </div>
        );
      case "event":
        if (isEventConfig(config)) {
          return (
            <>
              <div className="space-y-2">
                <Label>Operation</Label>
                <Select
                  value={config.operation || "publish"} // Safe
                  onValueChange={(v) => handleConfigUpdate("operation", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publish">Publish</SelectItem>
                    <SelectItem value="subscribe" disabled>
                      Subscribe (Not Implemented)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Channel / Topic</Label>
                <Input
                  value={config.channel} // Safe
                  onChange={(e) =>
                    handleConfigUpdate("channel", e.target.value)
                  }
                  placeholder="e.g., workflow.updates"
                />
                <p className="text-xs text-gray-400">
                  If publishing, the previous node&aspo;s output will be the
                  event payload.
                </p>
              </div>
            </>
          );
        }
        break;
      case "meta":
        if (isMetaConfig(config)) {
          return (
            <>
              <div className="space-y-2">
                <Label>Operation</Label>
                <Input
                  value={config.operation} // Safe
                  onChange={(e) =>
                    handleConfigUpdate("operation", e.target.value)
                  }
                  placeholder="e.g., observe"
                />
              </div>
              <div className="space-y-2">
                <Label>Metrics to Capture (comma-sep)</Label>
                <Input
                  value={(config.metrics_to_capture || []).join(", ")} // Safe
                  onChange={(e) =>
                    handleConfigUpdate(
                      "metrics_to_capture",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="latency, status"
                />
              </div>
            </>
          );
        }
        break;

      default:
        const _exhaustiveCheck: never = node.type;
        console.warn(
          "Unhandled node type in properties panel:",
          _exhaustiveCheck
        );
        return (
          <div className="text-sm text-red-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Configuration UI not implemented for node type: {node.type}
          </div>
        );
    }
    // Fallback if type guard fails
    console.warn(
      "Node config did not match expected type for:",
      node.type,
      config
    );
    return (
      <div className="text-sm text-red-400">
        Invalid or incomplete configuration data.
      </div>
    );
  };

  // REMOVED showMappingFields logic

  // --- RETURN JSX ---
  return (
    <div
      className="h-full bg-black text-white overflow-y-auto"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold text-lg text-white">
            {selectedNode.type.replace(/_/g, " ").toUpperCase()} Node
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
            value={selectedNode.data.label}
            onChange={(e) => handleLabelUpdate(e.target.value)}
            placeholder="Node label"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        <Separator className="bg-gray-600" />

        {/* Configuration Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base text-gray-300">
            Configuration
          </h3>
          {renderConfigFields(selectedNode)}
        </div>

        {/* Mapping Section REMOVED */}

        <Separator className="bg-gray-600" />

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="destructive"
            className="w-full bg-red-800 hover:bg-red-700 text-white"
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
