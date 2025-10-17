// Core workflow types matching backend schema

import { Node, Edge } from "@xyflow/react";

export type NodeType =
  | "trigger"
  | "agent"
  | "api_call"
  | "approval"
  | "conditional"
  | "hitl"
  | "timer"
  | "fork"
  | "merge"
  | "event"
  | "eval"
  | "meta"
  | "end";

export type NodeStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "waiting_approval"
  | "paused";

export type WorkflowMode =
  | "design"
  | "executing"
  | "completed"
  | "failed"
  | "paused";

export type LayoutType = "dag" | "event-hub";

export interface NodeData {
  [key: string]: unknown;
  label: string;
  type: NodeType;
  status: NodeStatus;
  config: Record<string, any>;
  error?: string;
  executionTime?: number;
  cost?: number;
  reliability?: number;
}

export interface WorkflowNode extends Node<NodeData> {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface WorkflowEdge extends Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  condition?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: WorkflowMode;
  layoutType: LayoutType;
  createdAt: string;
  updatedAt: string;
}

// --- [THIS IS THE CORRECTED/IMPROVED SECTION] ---
export type EventTypeName =
  | "started"
  | "completed"
  | "failed"
  | "approval_requested"
  | "updated";

export interface ExecutionEvent {
  id: string;
  workflowId: string;
  executionId: string; // <-- ADDED for clarity and correct filtering
  nodeId?: string; // NodeId can be optional for workflow-level events
  eventType: EventTypeName;
  timestamp: string;
  data?: any;
  error?: string;
}
// --- [END OF CORRECTION] ---

export interface ApprovalRequest {
  id: string;
  executionId: string;
  nodeId: string;
  description: string;
  context: any;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
  comment?: string;
}

export interface MetricsSummary {
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  runningExecutions: number;
  successRate: number;
  totalCost: number;
  averageDuration: number;
}

export interface AgentMetrics {
  agentId: string;
  provider: string;
  executionCount: number;
  reliability: number;
  averageCost: number;
  averageLatency: number;
}
