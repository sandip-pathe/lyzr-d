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
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    }
  }, [data, setWorkflowId, setWorkflowName, setNodes, setEdges]);

  return { workflow: data, isLoading, error };
}
