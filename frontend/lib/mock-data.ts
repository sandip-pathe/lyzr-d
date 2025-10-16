import { WorkflowNode, WorkflowEdge } from "@/types/workflow";

// Mock workflow nodes (Legal Contract Review)
export const mockNodes: WorkflowNode[] = [
  {
    id: "trigger-1",
    type: "trigger",
    position: { x: 250, y: 50 },
    data: {
      label: "Contract Uploaded",
      type: "trigger",
      status: "completed",
      config: { eventType: "file_upload" },
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
        provider: "openai",
        model: "gpt-4",
        temperature: 0.3,
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
        evalType: "llm_judge",
        criteria: "Verify all mandatory clauses present",
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
        approvers: ["legal@company.com"],
        approvalType: "any",
      },
    },
  },
  {
    id: "fork-1",
    type: "fork",
    position: { x: 250, y: 570 },
    data: {
      label: "Parallel Processing",
      type: "fork",
      status: "idle",
      config: { branches: 3 },
    },
  },
  {
    id: "agent-2",
    type: "agent",
    position: { x: 100, y: 700 },
    data: {
      label: "Risk Analysis",
      type: "agent",
      status: "idle",
      config: { provider: "lyzr", model: "risk-analyzer" },
    },
  },
  {
    id: "agent-3",
    type: "agent",
    position: { x: 250, y: 700 },
    data: {
      label: "Compliance Check",
      type: "agent",
      status: "idle",
      config: { provider: "openai", model: "gpt-4" },
    },
  },
  {
    id: "agent-4",
    type: "agent",
    position: { x: 400, y: 700 },
    data: {
      label: "Generate Summary",
      type: "agent",
      status: "idle",
      config: { provider: "openai", model: "gpt-4o-mini" },
    },
  },
  {
    id: "merge-1",
    type: "merge",
    position: { x: 250, y: 830 },
    data: {
      label: "Combine Results",
      type: "merge",
      status: "idle",
      config: { strategy: "combine" },
    },
  },
  {
    id: "action-1",
    type: "action",
    position: { x: 250, y: 960 },
    data: {
      label: "Send Notification",
      type: "action",
      status: "idle",
      config: {
        method: "POST",
        url: "https://api.slack.com/messages",
      },
    },
  },
];

export const mockEdges: WorkflowEdge[] = [
  { id: "e1", source: "trigger-1", target: "agent-1" },
  { id: "e2", source: "agent-1", target: "eval-1" },
  { id: "e3", source: "eval-1", target: "approval-1", label: "passed" },
  { id: "e4", source: "approval-1", target: "fork-1" },
  { id: "e5", source: "fork-1", target: "agent-2" },
  { id: "e6", source: "fork-1", target: "agent-3" },
  { id: "e7", source: "fork-1", target: "agent-4" },
  { id: "e8", source: "agent-2", target: "merge-1" },
  { id: "e9", source: "agent-3", target: "merge-1" },
  { id: "e10", source: "agent-4", target: "merge-1" },
  { id: "e11", source: "merge-1", target: "action-1" },
];

export const nodeTemplates = [
  {
    type: "trigger",
    label: "Trigger",
    description: "Start workflow",
    color: "bg-green-500",
    icon: "⚡",
  },
  {
    type: "agent",
    label: "AI Agent",
    description: "Call AI model",
    color: "bg-purple-500",
    icon: "🤖",
  },
  {
    type: "action",
    label: "Action",
    description: "HTTP/API call",
    color: "bg-blue-500",
    icon: "🔗",
  },
  {
    type: "approval",
    label: "Approval",
    description: "Human-in-loop",
    color: "bg-orange-500",
    icon: "✋",
  },
  {
    type: "eval",
    label: "Evaluation",
    description: "Policy check",
    color: "bg-yellow-500",
    icon: "🎯",
  },
  {
    type: "fork",
    label: "Fork",
    description: "Parallel split",
    color: "bg-pink-500",
    icon: "🍴",
  },
  {
    type: "merge",
    label: "Merge",
    description: "Combine branches",
    color: "bg-indigo-500",
    icon: "🔀",
  },
  {
    type: "timer",
    label: "Timer",
    description: "Delay/wait",
    color: "bg-cyan-500",
    icon: "⏱️",
  },
  {
    type: "event",
    label: "Event",
    description: "Pub/sub",
    color: "bg-red-500",
    icon: "📢",
  },
  {
    type: "meta",
    label: "Meta",
    description: "Observability",
    color: "bg-gray-500",
    icon: "👁️",
  },
] as const;
