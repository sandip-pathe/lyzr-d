import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  WorkflowNode,
  WorkflowEdge,
  WorkflowMode,
  ExecutionEvent,
  LayoutType,
  ApprovalRequest,
} from "@/types/workflow";

interface WorkflowState {
  // Core workflow data
  workflowId: string | null;
  workflowName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  mode: WorkflowMode;
  layoutType: LayoutType;

  // Selection
  selectedNodeId: string | null;

  // Execution data
  executionId: string | null; // <-- ADDED
  events: ExecutionEvent[];

  // UI state
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  bottomPanelOpen: boolean;

  // WebSocket
  wsConnected: boolean;
  currentApproval: ApprovalRequest | null;
  setCurrentApproval: (approval: ApprovalRequest | null) => void;

  // Actions
  setWorkflowId: (id: string) => void; // <-- ADDED
  setWorkflowName: (name: string) => void; // <-- ADDED
  setExecutionId: (id: string | null) => void; // <-- ADDED
  setMode: (mode: WorkflowMode) => void;
  setLayoutType: (type: LayoutType) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  deleteNode: (id: string) => void;
  updateNodeStatus: (
    id: string,
    status: WorkflowNode["data"]["status"]
  ) => void;
  setSelectedNode: (id: string | null) => void;
  addEvent: (event: ExecutionEvent) => void;
  clearEvents: () => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleBottomPanel: () => void;
  setWsConnected: (connected: boolean) => void;
  resetWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  devtools((set, get) => ({
    // Initial state
    workflowId: null,
    workflowName: "Untitled Workflow",
    nodes: [],
    edges: [],
    mode: "design",
    layoutType: "dag",
    selectedNodeId: null,
    executionId: null,
    events: [],
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    bottomPanelOpen: false,
    wsConnected: false,
    currentApproval: null,
    // ... (previous actions)
    setCurrentApproval: (approval) => set({ currentApproval: approval }),

    // Actions
    setWorkflowId: (id) => set({ workflowId: id }),
    setWorkflowName: (name) => set({ workflowName: name }),
    setExecutionId: (id) => set({ executionId: id }),

    setMode: (mode) => {
      set({ mode });
      if (mode === "executing") {
        set({
          leftSidebarOpen: true,
          rightSidebarOpen: true,
          bottomPanelOpen: true,
        });
      } else if (mode === "design") {
        set({
          leftSidebarOpen: true,
          rightSidebarOpen: true,
          bottomPanelOpen: false,
        });
      }
    },

    setLayoutType: (type) => set({ layoutType: type }),

    setNodes: (nodes) => set({ nodes }),

    setEdges: (edges) => set({ edges }),

    addNode: (node) =>
      set((state) => ({
        nodes: [...state.nodes, node],
      })),

    updateNode: (id, updates) =>
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id
            ? { ...n, ...updates, data: { ...n.data, ...updates.data } }
            : n
        ),
      })),

    deleteNode: (id) =>
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== id),
        edges: state.edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId:
          state.selectedNodeId === id ? null : state.selectedNodeId,
      })),

    updateNodeStatus: (id, status) =>
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, status } } : n
        ),
      })),

    setSelectedNode: (id) => set({ selectedNodeId: id }),

    addEvent: (event) =>
      set((state) => ({
        events: [event, ...state.events], // Prepend for chronological order in UI
      })),

    clearEvents: () => set({ events: [] }),

    toggleLeftSidebar: () =>
      set((state) => ({
        leftSidebarOpen: !state.leftSidebarOpen,
      })),

    toggleRightSidebar: () =>
      set((state) => ({
        rightSidebarOpen: !state.rightSidebarOpen,
      })),

    toggleBottomPanel: () =>
      set((state) => ({
        bottomPanelOpen: !state.bottomPanelOpen,
      })),

    setWsConnected: (connected) => set({ wsConnected: connected }),

    resetWorkflow: () =>
      set({
        nodes: [],
        edges: [],
        mode: "design",
        selectedNodeId: null,
        executionId: null,
        events: [],
        layoutType: "dag",
      }),
  }))
);
