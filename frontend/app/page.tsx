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
  const timestamp = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return api.workflows.create({
    name: `New Workflow - ${timestamp}`,
    description:
      "Start building your AI workflow by adding nodes and connecting them.",
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
              Lyzr Orchestrator
            </h1>
            <p className="text-gray-600 mt-1">
              Build, deploy, and scale AI workflows with ease. From idea to
              production in minutes.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <a
              href="https://docs.lyzr.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800"
            >
              Docs <ArrowRight className="inline w-4 h-4" />
            </a>
            <a
              href="https://lyzr-d-production.up.railway.app/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800"
            >
              API <ArrowRight className="inline w-4 h-4" />
            </a>
            <a
              href="https://github.com/sandip-pathe/lyzr-d"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800"
            >
              GitHub <ArrowRight className="inline w-4 h-4" />
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
                  Create Workflow
                </CardTitle>
                <CardDescription>
                  Design intelligent AI workflows with drag-and-drop nodes.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Your Workflows Section */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            All Workflows
          </h2>
          {isLoading && (
            <div className="text-center p-12 text-gray-500">
              <Loader2 className="w-8 h-8 mx-auto animate-spin mb-3" />
              <p>Loading workflows...</p>
            </div>
          )}
          {error && (
            <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg">
              {error.message}
            </div>
          )}

          {/* Workflow List - Including Templates */}
          {workflowsData && workflowsData.items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflowsData.items.map((wf: any) => {
                const isTemplate = wf.id && wf.id.startsWith("template-");
                return (
                  <Link href={`/workflows/${wf.id}`} key={wf.id} passHref>
                    <Card
                      className={`hover:border-purple-500 hover:shadow-md transition-all h-full flex flex-col bg-white ${
                        isTemplate ? "border-l-4 border-l-blue-500" : ""
                      }`}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-start gap-3">
                          {isTemplate ? (
                            <span className="text-xl flex-shrink-0">
                              {wf.name.split(" ")[0]}
                            </span>
                          ) : (
                            <FileText className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                          )}
                          <span className="flex-1 line-clamp-2">
                            {wf.name.replace(/^[^\s]+ /, "")}
                          </span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {wf.description || "AI workflow orchestration"}
                        </CardDescription>
                        {isTemplate && (
                          <div className="pt-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              Template
                            </span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="mt-auto text-xs text-gray-500 pt-4">
                        {isTemplate
                          ? "Ready to use"
                          : `Updated ${timeAgo(wf.updated_at)}`}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {workflowsData && workflowsData.items.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg bg-white">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-700 font-semibold text-lg mb-1">
                Ready to build your first workflow?
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Create intelligent AI workflows with drag-and-drop simplicity.
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
