// frontend/hooks/useWorkflow.ts
import { useQuery } from "@tanstack/react-query";
import { useWorkflowStore } from "@/lib/store";
import { useEffect } from "react";

async function fetchWorkflow(workflowId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}`
  );
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
}

export function useWorkflow(workflowId: string) {
  const { setNodes, setEdges, setWorkflow } = useWorkflowStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => fetchWorkflow(workflowId),
    enabled: !!workflowId, // Only run the query if workflowId is not null
  });

  useEffect(() => {
    if (data) {
      // Once data is fetched, update the Zustand store
      setWorkflow(
        data.id,
        data.name,
        data.definition.nodes,
        data.definition.edges
      );
    }
  }, [data, setWorkflow]);

  return { workflow: data, isLoading, error };
}
