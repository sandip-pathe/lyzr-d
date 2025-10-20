/**
 * TypeScript type definitions for node outputs
 * Mirrors the Python schemas in backend/app/schemas/node_outputs.py
 */

export type NodeStatus = "success" | "failed" | "partial";

export interface BaseNodeOutput {
  node_id: string;
  node_type: string;
  timestamp: string;
  status: NodeStatus;
  raw_output: any;
  error?: string;
}

export interface TriggerOutput extends BaseNodeOutput {
  node_type: "trigger";
  input_data: Record<string, any>;
  trigger_type: string;
}

export interface AgentOutput extends BaseNodeOutput {
  node_type: "agent";
  output: string;
  model: string;
  cost: number;
  temperature_used: number;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
    completion_tokens_details?: {
      accepted_prediction_tokens?: number;
      audio_tokens?: number;
      reasoning_tokens?: number;
      rejected_prediction_tokens?: number;
    };
    prompt_tokens_details?: {
      audio_tokens?: number;
      cached_tokens?: number;
    };
  };
}

export interface TimerOutput extends BaseNodeOutput {
  node_type: "timer";
  scheduled_time: string;
  next_run?: string;
  delay_seconds?: number;
  recurring: boolean;
}

export interface ConditionOutput extends BaseNodeOutput {
  node_type: "conditional";
  condition_met: boolean;
  branch: "true" | "false";
  evaluation: Record<string, any>;
  matched_condition?: string;
}

export interface LoopOutput extends BaseNodeOutput {
  node_type: "loop";
  iteration: number;
  current_item: any;
  has_more: boolean;
  total_items: number;
  items_processed: number;
}

export interface MergeOutput extends BaseNodeOutput {
  node_type: "merge";
  merged_data: Record<string, any>;
  sources: string[];
  merge_strategy: string;
}

export interface APICallOutput extends BaseNodeOutput {
  node_type: "api_call";
  status_code: number;
  body: any;
  headers: Record<string, string>;
  response_time_ms: number;
  url: string;
}

export interface EvalOutput extends BaseNodeOutput {
  node_type: "eval";
  passed: boolean;
  score: number;
  feedback: string;
  criteria: Record<string, any>;
  detailed_scores?: Record<string, number>;
}

export interface ApprovalOutput extends BaseNodeOutput {
  node_type: "approval";
  approved: boolean;
  approver?: string;
  comments?: string;
  approval_time?: string;
}

export interface EndOutput extends BaseNodeOutput {
  node_type: "end";
  captured_output?: any;
  workflow_summary?: Record<string, any>;
}

export interface EventOutput extends BaseNodeOutput {
  node_type: "event";
  event_name: string;
  event_data: Record<string, any>;
  published_at: string;
}

export interface MetaOutput extends BaseNodeOutput {
  node_type: "meta";
  sub_workflow_id?: string;
  sub_workflow_result?: Record<string, any>;
}

export type NodeOutput =
  | TriggerOutput
  | AgentOutput
  | TimerOutput
  | ConditionOutput
  | LoopOutput
  | MergeOutput
  | APICallOutput
  | EvalOutput
  | ApprovalOutput
  | EndOutput
  | EventOutput
  | MetaOutput;

export interface WorkflowOutput {
  status: "completed" | "failed" | "running";
  output: any;
  node_outputs?: Record<string, NodeOutput>;
}
