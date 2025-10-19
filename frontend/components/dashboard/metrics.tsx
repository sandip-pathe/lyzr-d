"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  DollarSign,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// API fetching functions
async function fetchSummaryMetrics() {
  const res = await fetch(`http://localhost:8000/api/metrics/summary`);
  if (!res.ok) throw new Error("Failed to fetch summary metrics.");
  return res.json();
}

async function fetchAgentMetrics() {
  const res = await fetch(`http://localhost:8000/api/metrics/agents`);
  if (!res.ok) throw new Error("Failed to fetch agent metrics.");
  return res.json();
}

export function MetricsDashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["summaryMetrics"],
    queryFn: fetchSummaryMetrics,
  });
  const { data: agentMetrics, isLoading: isAgentLoading } = useQuery({
    queryKey: ["agentMetrics"],
    queryFn: fetchAgentMetrics,
  });

  if (isSummaryLoading || isAgentLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Executions"
              value={summary.total_executions}
              icon={Activity}
            />
            <MetricCard
              title="Success Rate"
              value={`${summary.success_rate}%`}
              icon={CheckCircle2}
            />
            <MetricCard title="Failed" value={summary.failed} icon={XCircle} />
            <MetricCard
              title="Running"
              value={summary.running}
              icon={Loader2}
            />
          </div>
        </TabsContent>
        <TabsContent value="agents" className="space-y-4">
          {agentMetrics?.map((agent: any) => (
            <Card key={agent.agent_id}>
              <CardHeader>
                <CardTitle>
                  {agent.provider}:{" "}
                  <span className="font-mono">{agent.agent_id}</span>
                </CardTitle>
                <CardDescription>{agent.executions} executions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Reliability</p>
                    <p className="font-semibold">
                      {(agent.reliability_score * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg. Latency</p>
                    <p className="font-semibold">
                      {agent.avg_latency_ms.toFixed(0)}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Cost</p>
                    <p className="font-semibold">
                      ${agent.total_cost.toFixed(4)}
                    </p>
                  </div>
                </div>
                <Progress
                  value={agent.reliability_score * 100}
                  className="mt-4 h-2"
                />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
