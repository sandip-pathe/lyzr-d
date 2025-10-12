"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useWorkflowStore } from "@/lib/store";
import { NodePanel } from "./node-panel";
import { AgentNode } from "./nodes/agent";
import { ApprovalNode } from "./nodes/approval";
import { PropertiesPanel } from "./properties-panel";
import { Toolbar } from "./toolbar";
import { WorkflowEdge, WorkflowNode } from "@/types/workflow";

const nodeTypes = {
  agent: AgentNode,
  approval: ApprovalNode,
};

export function Canvas() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes,
    setEdges,
  } = useWorkflowStore();
  const [nodes, , onNodesChange] = useNodesState<WorkflowNode>(storeNodes);
  const [edges, , onEdgesChange] = useEdgesState<WorkflowEdge>(storeEdges);
  const [isExecuting, setIsExecuting] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges(addEdge({ ...params, animated: true }, edges));
    },
    [edges, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData(
        "application/reactflow"
      ) as WorkflowNode["type"];
      const position = {
        x: event.clientX,
        y: event.clientY,
      };

      const newNode: WorkflowNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `New ${type}`, config: {} },
      };

      setNodes([...nodes, newNode]);
    },
    [nodes, setNodes]
  );

  return (
    <div className="w-full h-screen flex">
      {/* Left: Node Palette */}
      <NodePanel />

      {/* Center: Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-gray-50"
        >
          <Background gap={16} size={1} color="#e5e7eb" />
          <Controls className="!border-gray-200" />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === "agent") return "#a855f7";
              if (node.type === "approval") return "#f97316";
              return "#6b7280";
            }}
            className="!border-gray-200"
          />

          {/* Top Toolbar */}
          <Panel position="top-center">
            <Toolbar isExecuting={isExecuting} />
          </Panel>
        </ReactFlow>
      </div>

      {/* Right: Properties Panel */}
      <PropertiesPanel />
    </div>
  );
}
