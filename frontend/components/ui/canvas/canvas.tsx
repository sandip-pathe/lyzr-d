"use client";

import { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  useReactFlow,
  Panel,
  ReactFlowProvider,
} from "@xyflow/react";
import { WorkflowNode, NodeType, WorkflowEdge } from "@/types/workflow";
import "@xyflow/react/dist/style.css";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomNode } from "./nodes/custom";
import { useWorkflowStore } from "@/lib/store";
import { EventHubNode } from "./nodes/event-hub-node";

const nodeTypes: NodeTypes = {
  trigger: CustomNode,
  agent: CustomNode,
  action: CustomNode,
  approval: CustomNode,
  eval: CustomNode,
  fork: CustomNode,
  merge: CustomNode,
  timer: CustomNode,
  event: EventHubNode,
  meta: CustomNode,
};

const snapGrid: [number, number] = [15, 15];

function WorkflowCanvasInner() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    addNode,
    setSelectedNode,
    layoutType,
    setLayoutType,
    mode,
  } = useWorkflowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges as Edge[]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      setStoreNodes(nodes as WorkflowNode[]);
    },
    [nodes, onNodesChange, setStoreNodes]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      // React Flow's `edges` state is of type `Edge[]`, cast it to `WorkflowEdge[]` for your store
      setStoreEdges(edges as WorkflowEdge[]);
    },
    [edges, onEdgesChange, setStoreEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `e${connection.source}-${connection.target}`,
        type: "smoothstep",
        animated: mode === "executing",
      };
      const newEdges = addEdge(edge, edges);
      setEdges(newEdges);
      // Cast the new array of edges to `WorkflowEdge[]` for your store
      setStoreEdges(newEdges as WorkflowEdge[]);
    },
    [edges, setEdges, setStoreEdges, mode]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // Drag and drop from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData(
        "application/reactflow"
      ) as NodeType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // It's better to type newNode as WorkflowNode from the start
      const newNode: WorkflowNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          type,
          status: "idle",
          config: {},
        },
      };

      addNode(newNode);
      // Now you can add it directly without casting issues
      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, addNode, setNodes]
  );

  // Auto-layout toggle
  const handleLayoutToggle = useCallback(() => {
    setLayoutType(layoutType === "dag" ? "event-hub" : "dag");
  }, [layoutType, setLayoutType]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        snapToGrid={true}
        snapGrid={snapGrid}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: mode === "executing",
          style: { strokeWidth: 2 },
        }}
        fitView
        minZoom={0.2}
        maxZoom={4}
        className="bg-gray-50"
      >
        <Background color="#94a3b8" gap={15} />
        <Controls />
        <MiniMap
          color="#000000"
          nodeColor={(node) => {
            const colors = {
              trigger: "#22c55e",
              agent: "#a855f7",
              action: "#3b82f6",
              approval: "#f97316",
              eval: "#eab308",
              fork: "#ec4899",
              merge: "#6366f1",
              timer: "#06b6d4",
              event: "#ef4444",
              meta: "#6b7280",
            };
            return colors[node.type as NodeType] || "#6b7280";
          }}
          className="!bg-black !border-2 !border-black"
        />

        {/* Layout Toggle Panel */}
        <Panel position="top-right" className="flex gap-2">
          <Button
            variant={layoutType === "dag" ? "default" : "outline"}
            size="sm"
            onClick={handleLayoutToggle}
            className="shadow-md select-none"
          >
            <Layers className="w-4 h-4 mr-2" />
            {layoutType === "dag" ? "DAG Mode" : "Event Hub Mode"}
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}
