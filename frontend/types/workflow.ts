export interface NodeData {
  label: string;
  icon?: string;
  config?: Record<string, any>;
  status?: "idle" | "running" | "success" | "error";
  [key: string]: unknown;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface Execution {
  id: string;
  workflowId: string;
  status: "running" | "completed" | "failed" | "paused";
  currentNode?: string;
  startedAt: string;
  completedAt?: string;
}

import { Node, Edge } from "@xyflow/react";

export type NodeType = "trigger" | "agent" | "approval" | "http" | "transform";

export interface NodeData {
  label: string;
  icon?: string;
  config?: Record<string, any>;
  status?: "idle" | "running" | "success" | "error";
}

export type WorkflowNode = Node<NodeData, NodeType>;

export type WorkflowEdge = Edge & {
  condition?: {
    field: string;
    operator: string;
    value: any;
  };
};
