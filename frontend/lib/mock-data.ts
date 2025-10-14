import {
  WorkflowNode,
  WorkflowEdge,
  ExecutionEvent,
  AgentMetrics,
  MetricsSummary,
  ApprovalRequest,
} from "@/types/workflow";

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

// Mock event hub workflow (Event-driven architecture)
export const mockEventHubNodes: WorkflowNode[] = [
  {
    id: "event-hub-1",
    type: "event",
    position: { x: 400, y: 400 },
    data: {
      label: "Redis Event Bus",
      type: "event",
      status: "running",
      config: {
        topics: ["contract.created", "contract.approved", "contract.rejected"],
        throughput: 127,
      },
    },
  },
  {
    id: "publisher-1",
    type: "trigger",
    position: { x: 200, y: 200 },
    data: {
      label: "Contract Upload",
      type: "trigger",
      status: "completed",
      config: { publishes: "contract.created" },
    },
  },
  {
    id: "subscriber-1",
    type: "agent",
    position: { x: 600, y: 250 },
    data: {
      label: "Process Contract",
      type: "agent",
      status: "running",
      config: { subscribes: "contract.created" },
    },
  },
  {
    id: "subscriber-2",
    type: "agent",
    position: { x: 650, y: 400 },
    data: {
      label: "Analytics Engine",
      type: "agent",
      status: "completed",
      config: { subscribes: "contract.created" },
    },
  },
  {
    id: "subscriber-3",
    type: "action",
    position: { x: 600, y: 550 },
    data: {
      label: "Send Email",
      type: "action",
      status: "idle",
      config: { subscribes: "contract.approved" },
    },
  },
  {
    id: "subscriber-4",
    type: "meta",
    position: { x: 200, y: 550 },
    data: {
      label: "Audit Logger",
      type: "meta",
      status: "running",
      config: { subscribes: "*" },
    },
  },
];

export const mockEventHubEdges: WorkflowEdge[] = [
  { id: "eh1", source: "publisher-1", target: "event-hub-1", animated: true },
  {
    id: "eh2",
    source: "event-hub-1",
    target: "subscriber-1",
    animated: true,
    label: "contract.created",
  },
  {
    id: "eh3",
    source: "event-hub-1",
    target: "subscriber-2",
    animated: true,
    label: "contract.created",
  },
  {
    id: "eh4",
    source: "event-hub-1",
    target: "subscriber-3",
    label: "contract.approved",
  },
  {
    id: "eh5",
    source: "event-hub-1",
    target: "subscriber-4",
    animated: true,
    label: "*",
  },
];

// Mock execution events
export const mockEvents: ExecutionEvent[] = [
  {
    id: "evt-1",
    workflowId: "wf-001",
    nodeId: "trigger-1",
    eventType: "started",
    timestamp: "2025-10-14T10:23:12Z",
  },
  {
    id: "evt-2",
    workflowId: "wf-001",
    nodeId: "trigger-1",
    eventType: "completed",
    timestamp: "2025-10-14T10:23:13Z",
  },
  {
    id: "evt-3",
    workflowId: "wf-001",
    nodeId: "agent-1",
    eventType: "started",
    timestamp: "2025-10-14T10:23:15Z",
  },
  {
    id: "evt-4",
    workflowId: "wf-001",
    nodeId: "agent-1",
    eventType: "completed",
    timestamp: "2025-10-14T10:23:19Z",
    data: { confidence: 0.92, extractedClauses: 12 },
  },
  {
    id: "evt-5",
    workflowId: "wf-001",
    nodeId: "eval-1",
    eventType: "started",
    timestamp: "2025-10-14T10:23:20Z",
  },
  {
    id: "evt-6",
    workflowId: "wf-001",
    nodeId: "eval-1",
    eventType: "completed",
    timestamp: "2025-10-14T10:23:22Z",
    data: { score: 0.95, passed: true },
  },
  {
    id: "evt-7",
    workflowId: "wf-001",
    nodeId: "approval-1",
    eventType: "approval_requested",
    timestamp: "2025-10-14T10:23:23Z",
  },
];

// Mock approval request
export const mockApprovalRequest: ApprovalRequest = {
  id: "apr-001",
  executionId: "exec-001",
  nodeId: "approval-1",
  description:
    "Review extracted contract clauses for accuracy and completeness",
  context: {
    contractName: "Service Agreement - Acme Corp",
    extractedClauses: 12,
    confidence: 0.92,
    highRiskItems: ["termination clause", "liability cap"],
  },
  status: "pending",
  requestedAt: "2025-10-14T10:23:23Z",
};

// Mock metrics
export const mockMetrics: MetricsSummary = {
  totalExecutions: 127,
  completedExecutions: 120,
  failedExecutions: 7,
  runningExecutions: 1,
  successRate: 94.5,
  totalCost: 43.21,
  averageDuration: 156.3,
};

export const mockAgentMetrics: AgentMetrics[] = [
  {
    agentId: "openai-gpt4",
    provider: "OpenAI GPT-4",
    executionCount: 45,
    reliability: 0.98,
    averageCost: 0.12,
    averageLatency: 3.2,
  },
  {
    agentId: "lyzr-extractor",
    provider: "Lyzr Extractor",
    executionCount: 32,
    reliability: 0.94,
    averageCost: 0.08,
    averageLatency: 2.1,
  },
  {
    agentId: "custom-validator",
    provider: "Custom Validator",
    executionCount: 18,
    reliability: 0.89,
    averageCost: 0.0,
    averageLatency: 1.5,
  },
];

// Node templates for palette
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
