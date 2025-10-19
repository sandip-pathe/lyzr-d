import { WorkflowNode, WorkflowEdge } from "@/types/workflow";
import {
  Bot,
  Globe,
  Target,
  CheckCheck,
  Clock,
  Radio,
  Eye,
  Merge,
  Split,
  GitBranchPlus,
  Zap,
  CheckCircle2,
} from "lucide-react";

export const mockNodes: WorkflowNode[] = [
  {
    id: "trigger-1",
    type: "trigger",
    position: { x: 250, y: 50 },
    data: {
      label: "Contract Uploaded",
      type: "trigger",
      status: "completed",
      config: {
        name: "Contract Uploaded",
        type: "manual",
        input_json: { event: "file_upload" },
      },
    },
  },
  {
    id: "agent-1",
    type: "agent",
    position: { x: 250, y: 180 },
    data: {
      label: "Extract Clauses",
      type: "agent",
      status: "completed",
      config: {
        name: "Extract Clauses",
        system_instructions: "Extract all clauses from the contract",
        temperature: 0.3,
        provider: "openai",
        agent_id: "gpt-4",
      },
      executionTime: 4.2,
      cost: 0.08,
      reliability: 0.96,
    },
  },
  {
    id: "eval-1",
    type: "eval",
    position: { x: 250, y: 310 },
    data: {
      label: "Policy Check",
      type: "eval",
      status: "completed",
      config: {
        name: "Policy Check",
        eval_type: "llm_judge",
        config: { criteria: "Verify all mandatory clauses present" },
        on_failure: "block",
      },
      executionTime: 1.8,
    },
  },
  {
    id: "approval-1",
    type: "approval",
    position: { x: 250, y: 440 },
    data: {
      label: "Legal Review",
      type: "approval",
      status: "waiting_approval",
      config: {
        name: "Legal Review",
        description: "Please review the contract and approve",
      },
    },
  },
  {
    id: "agent-2",
    type: "agent",
    position: { x: 100, y: 570 },
    data: {
      label: "Risk Analysis",
      type: "agent",
      status: "idle",
      config: {
        name: "Risk Analysis",
        system_instructions: "Analyze contract risks",
        provider: "openai",
        agent_id: "gpt-4",
      },
    },
  },
  {
    id: "merge-1",
    type: "merge",
    position: { x: 250, y: 700 },
    data: {
      label: "Combine Results",
      type: "merge",
      status: "idle",
      config: {
        name: "Combine Results",
        merge_strategy: "combine",
      },
    },
  },
  {
    id: "api-1",
    type: "api_call",
    position: { x: 250, y: 830 },
    data: {
      label: "Send Notification",
      type: "api_call",
      status: "idle",
      config: {
        name: "Send Notification",
        method: "POST",
        url: "https://api.slack.com/messages",
        headers: { "Content-Type": "application/json" },
      },
    },
  },
];

export const mockEdges: WorkflowEdge[] = [
  { id: "e1", source: "trigger-1", target: "agent-1" },
  { id: "e2", source: "agent-1", target: "eval-1" },
  { id: "e3", source: "eval-1", target: "approval-1", label: "passed" },
  { id: "e4", source: "approval-1", target: "agent-2" },
  { id: "e5", source: "agent-2", target: "merge-1" },
  { id: "e6", source: "merge-1", target: "api-1" },
];

export const nodeTemplates = [
  {
    type: "trigger",
    label: "Trigger",
    description: "Start workflow",
    color: "bg-green-500",
    icon: Zap,
  },
  {
    type: "agent",
    label: "AI Agent",
    description: "Call AI model",
    color: "bg-purple-500",
    icon: Bot,
  },
  {
    type: "api_call",
    label: "API Call",
    description: "HTTP/API call",
    color: "bg-purple-500",
    icon: Globe,
  },
  {
    type: "conditional",
    label: "Conditional",
    description: "If/else branching logic",
    color: "bg-indigo-500",
    icon: GitBranchPlus,
  },
  {
    type: "approval",
    label: "Approval",
    description: "Simple in-app confirmation",
    color: "bg-orange-500",
    icon: CheckCheck,
  },
  {
    type: "eval",
    label: "Evaluation",
    description: "Policy check",
    color: "bg-yellow-500",
    icon: Target,
  },
  {
    type: "merge",
    label: "Merge",
    description: "Combine branches",
    color: "bg-indigo-500",
    icon: Merge,
  },
  {
    type: "event",
    label: "Event",
    description: "Pub/sub",
    color: "bg-cyan-500",
    icon: Radio,
  },
  {
    type: "timer",
    label: "Timer",
    description: "Delay/wait",
    color: "bg-green-500",
    icon: Clock,
  },
  {
    type: "end",
    label: "End",
    description: "End of workflow",
    color: "bg-gray-800",
    icon: CheckCircle2,
  },
] as const;
