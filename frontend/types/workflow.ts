// frontend/types/workflow.ts
// --- UPDATED ---

import { Node, Edge } from "@xyflow/react";

// NodeType, NodeStatus, WorkflowMode, LayoutType enums remain the same
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

// --- Configuration Types (Matching Pydantic Schemas) ---

// Add 'export' keyword to all interfaces and the type alias below
export interface BaseNodeConfig {
  input_mapping?: Record<string, any>;
  output_mapping?: Record<string, string>;
}

export interface TriggerConfig {
  type: "manual" | "schedule" | "webhook";
  schedule?: string;
  webhook_url?: string;
}

export interface AgentConfig extends BaseNodeConfig {
  provider: string;
  agent_id: string;
  temperature?: number;
}

export interface ApiCallConfig extends BaseNodeConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"; // More specific
  headers?: Record<string, string>;
  body_template?: Record<string, any>;
}

export interface ApprovalConfig extends BaseNodeConfig {
  title: string;
  description: string;
  approvers: string[];
  channels: ("slack" | "email")[];
}

export interface ConditionalConfig extends BaseNodeConfig {
  condition_expression: string;
}

export interface EvalConfig extends BaseNodeConfig {
  eval_type: "schema" | "llm_judge" | "policy" | "custom";
  config: Record<string, any>; // Could be further typed based on eval_type
  on_failure: "block" | "warn" | "retry" | "compensate";
}

export interface ForkConfig {
  branch_count?: number;
}

export interface MergeConfig extends BaseNodeConfig {
  merge_strategy: "combine" | "first" | "vote";
}

export interface TimerConfig {
  duration_seconds: number;
}

export interface EventConfig extends BaseNodeConfig {
  operation: "publish" | "subscribe";
  channel: string;
}

export interface MetaConfig extends BaseNodeConfig {
  operation: "observe" | string; // Allow custom operations?
  metrics_to_capture: string[];
}

export interface EndConfig {}

// --- Union Type for Specific Configs ---
export type SpecificNodeConfig =
  | TriggerConfig
  | AgentConfig
  | ApiCallConfig
  | ApprovalConfig
  | ConditionalConfig
  | EvalConfig
  | ForkConfig
  | MergeConfig
  | TimerConfig
  | EventConfig
  | MetaConfig
  | EndConfig;

// --- NodeData Interface ---
export interface NodeData {
  [key: string]: unknown;
  label: string;
  type: NodeType;
  status: NodeStatus;
  config: SpecificNodeConfig;
  error?: string;
  executionTime?: number;
  cost?: number;
  reliability?: number;
  lastResult?: any;
}

// WorkflowNode and WorkflowEdge remain structurally similar, but use the refined NodeData
export interface WorkflowNode extends Node<NodeData> {
  type: NodeType;
  data: NodeData;
}

export interface WorkflowEdge extends Edge {
  // id, source, target are inherited
  label?: string; // Optional label (e.g., for conditional branches 'true'/'false')
  animated?: boolean;
  sourceHandle?: string;
  targetHandle?: string;
}
// ... rest of the file (Workflow, ExecutionEvent, ApprovalRequest etc.) remains the same ...
export type EventTypeName =
  | "node.started"
  | "node.completed"
  | "node.failed"
  | "workflow.started"
  | "workflow.completed"
  | "workflow.failed"
  | "approval.requested"
  | "approval.granted" // Assuming backend sends these
  | "approval.denied" // Assuming backend sends these
  | "compensation.started"
  | "compensation.completed"
  | "compensation.failed"
  | "eval.completed"
  | "fork.started"
  | "merge.completed"
  | "timer.started"
  | "timer.completed"
  | "meta.observation"
  | "ui.approval.requested" // From activities.py
  | string; // Allow for custom events

export interface ExecutionEvent {
  // Using a unique ID combining execution, node, type, and timestamp might be more robust
  id: string; // e.g., `${executionId}-${nodeId}-${eventType}-${timestamp}`
  workflowId: string;
  executionId: string;
  nodeId?: string; // Optional for workflow-level events
  eventType: EventTypeName;
  timestamp: string; // ISO 8601 format string
  data?: any; // Contains result on success, error details on failure, etc.
  error?: string; // Explicit error message if applicable
}

// ApprovalRequest seems okay, maybe add title/description if sent from backend
export interface ApprovalRequest {
  id: string; // approval_id from backend event
  executionId: string;
  nodeId: string;
  title: string; // Added
  description: string; // Added
  context: any; // Data passed for the approver to see
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
  comment?: string;
}

// Metrics types seem okay for now
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
