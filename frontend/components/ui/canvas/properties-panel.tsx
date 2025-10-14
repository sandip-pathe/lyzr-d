"use client";

import { useWorkflowStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "../textarea";

export function PropertiesPanel() {
  const { selectedNodeId, nodes, updateNode, setSelectedNode } =
    useWorkflowStore();

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNodeId || !node) {
    return (
      <div className="w-80 border-l border-gray-200 bg-white p-6">
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
          <Settings className="w-12 h-12 mb-3" />
          <p className="text-sm">Select a node to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Node Properties</h3>
        <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={node.data.label}
            onChange={(e) =>
              updateNode(node.id, {
                data: { ...node.data, label: e.target.value },
              })
            }
          />
        </div>

        <Separator />

        {/* Node-specific config */}
        {node.type === "agent" && (
          <>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={node.data.config?.provider || "openai"}
                onValueChange={(value) =>
                  updateNode(node.id, {
                    data: {
                      ...node.data,
                      config: { ...node.data.config, provider: value },
                    },
                  })
                }
              >
                {/* Select options */}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={node.data.config?.prompt || ""}
                onChange={(e) =>
                  updateNode(node.id, {
                    data: {
                      ...node.data,
                      config: { ...node.data.config, prompt: e.target.value },
                    },
                  })
                }
                rows={4}
              />
            </div>
          </>
        )}

        {node.type === "approval" && (
          <>
            <div className="space-y-2">
              <Label>Approvers (comma-separated emails)</Label>
              <Textarea
                placeholder="user1@company.com, user2@company.com"
                value={node.data.config?.approvers?.join(", ") || ""}
                onChange={(e) =>
                  updateNode(node.id, {
                    data: {
                      ...node.data,
                      config: {
                        ...node.data.config,
                        approvers: e.target.value
                          .split(",")
                          .map((s) => s.trim()),
                      },
                    },
                  })
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
