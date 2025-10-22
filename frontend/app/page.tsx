"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";
import { api } from "@/lib/api";

// API function to fetch all workflows from the backend
async function fetchWorkflows() {
  return api.workflows.list();
}

// API function to create a new, empty workflow
async function createNewWorkflow() {
  return api.workflows.create({
    name: "Untitled Workflow",
    description: "A new workflow started from the dashboard.",
    nodes: [],
    edges: [],
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch all workflows to display on the dashboard
  const {
    data: workflowsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workflows"],
    queryFn: fetchWorkflows,
  });

  // Mutation to handle creating a new workflow and redirecting
  const createWorkflowMutation = useMutation({
    mutationFn: createNewWorkflow,
    onSuccess: (data) => {
      router.push(`/workflows/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateNew = () => {
    createWorkflowMutation.mutate();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <header className="flex items-center justify-between pb-8 border-b">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to the future of workflows.
            </h1>
            <p className="text-gray-600 mt-1">
              Build, refine, and productionize agents effortlessly in minutes.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <a href="#" className="text-purple-600 hover:text-purple-800">
              Docs <ArrowRight className="inline w-4 h-4" />
            </a>
            <a href="#" className="text-purple-600 hover:text-purple-800">
              APIs <ArrowRight className="inline w-4 h-4" />
            </a>
            <a href="#" className="text-purple-600 hover:text-purple-800">
              Tutorials <ArrowRight className="inline w-4 h-4" />
            </a>
          </div>
        </header>

        {/* Build Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Build</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer bg-white"
              onClick={handleCreateNew}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Plus className="w-6 h-6 text-purple-600" />
                  </div>
                  New Workflow
                </CardTitle>
                <CardDescription>Start from a blank canvas.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Your Workflows Section */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Workflows
          </h2>
          {isLoading && (
            <div className="text-center p-12 text-gray-500">
              <Loader2 className="w-8 h-8 mx-auto animate-spin mb-3" />
              <p>Loading your workflows...</p>
            </div>
          )}
          {error && (
            <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg">
              {error.message}
            </div>
          )}

          {/* Workflow List */}
          {workflowsData && workflowsData.items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflowsData.items.map((wf: any) => (
                <Link href={`/workflows/${wf.id}`} key={wf.id} passHref>
                  <Card className="hover:border-purple-500 hover:shadow-md transition-all h-full flex flex-col bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                        <span className="flex-1 line-clamp-2">{wf.name}</span>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {wf.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto text-xs text-gray-500 pt-4">
                      Updated {timeAgo(wf.updated_at)}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {workflowsData && workflowsData.items.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 font-medium">
                You haven&apos;t created any workflows yet.
              </p>
              <p className="text-sm text-gray-400">
                Get started by creating a new one.
              </p>
              <Button
                onClick={handleCreateNew}
                className="mt-6"
                disabled={createWorkflowMutation.isPending}
              >
                {createWorkflowMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Your First Workflow
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
