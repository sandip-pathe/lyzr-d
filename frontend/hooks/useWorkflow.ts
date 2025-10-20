// frontend/hooks/useWorkflow.ts
import { useQuery } from "@tanstack/react-query";
import { useWorkflowStore } from "@/lib/store";
import { useEffect } from "react";
import { api } from "@/lib/api";

async function fetchWorkflow(workflowId: string) {
  return api.workflows.get(workflowId);
}

export function useWorkflow(workflowId: string) {
  const { setWorkflowId, setWorkflowName, setNodes, setEdges } =
    useWorkflowStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => fetchWorkflow(workflowId),
    enabled: !!workflowId, // Only run the query if workflowId is not null
  });

  useEffect(() => {
    if (data) {
      setWorkflowId(data.id);
      setWorkflowName(data.name);
      // Changed to extract nodes and edges from data.definition
      const definition = data.definition || {};
      setNodes(definition.nodes || []);
      setEdges(definition.edges || []);
    }
  }, [data, setWorkflowId, setWorkflowName, setNodes, setEdges]);

  return { workflow: data, isLoading, error };
}
