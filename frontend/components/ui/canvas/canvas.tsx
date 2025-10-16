"use client";

import { useCallback, useEffect, useRef } from "react";
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

  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdges as Edge[]);
  }, [storeEdges, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `e${connection.source}-${connection.target}`,
        type: "smoothstep",
        animated: mode === "executing",
      };
      setStoreEdges(addEdge(edge, storeEdges) as WorkflowEdge[]);
    },
    [storeEdges, setStoreEdges, mode]
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
    },
    [screenToFlowPosition, addNode]
  );

  const handleLayoutToggle = useCallback(() => {
    setLayoutType(layoutType === "dag" ? "event-hub" : "dag");
  }, [layoutType, setLayoutType]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
