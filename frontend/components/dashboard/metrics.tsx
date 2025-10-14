"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockMetrics, mockAgentMetrics } from "@/lib/mock-data";
import { MetricsSummary, AgentMetrics } from "@/types/workflow";
import {
  Activity,
  DollarSign,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  Zap,
  Target,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function MetricsDashboard() {
  const [summary, setSummary] = useState<MetricsSummary>(mockMetrics);
  const [agentMetrics, setAgentMetrics] =
    useState<AgentMetrics[]>(mockAgentMetrics);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSummary((prev) => ({
        ...prev,
        runningExecutions: Math.floor(Math.random() * 5),
        totalCost: prev.totalCost + Math.random() * 0.5,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Monitor workflow performance and agent metrics
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="reliability">Reliability</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Executions"
              value={summary.totalExecutions}
              icon={Activity}
              color="blue"
            />
            <MetricCard
              title="Success Rate"
              value={`${summary.successRate.toFixed(1)}%`}
              icon={CheckCircle2}
              color="green"
              subtitle={`${summary.completedExecutions} completed`}
            />
            <MetricCard
              title="Failed"
              value={summary.failedExecutions}
              icon={XCircle}
              color="red"
            />
            <MetricCard
              title="Total Cost"
              value={`$${summary.totalCost.toFixed(2)}`}
              icon={DollarSign}
              color="purple"
            />
          </div>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Execution Status</CardTitle>
              <CardDescription>
                Current workflow execution distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <StatusBar
                  label="Completed"
                  value={summary.completedExecutions}
                  total={summary.totalExecutions}
                  color="bg-green-500"
                />
                <StatusBar
                  label="Failed"
                  value={summary.failedExecutions}
                  total={summary.totalExecutions}
                  color="bg-red-500"
                />
                <StatusBar
                  label="Running"
                  value={summary.runningExecutions}
                  total={summary.totalExecutions}
                  color="bg-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Average Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {summary.averageDuration.toFixed(1)}s
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Per workflow execution
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Success Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  +{((summary.successRate - 90) / 0.9).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600 mt-1">From last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agent Performance Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {agentMetrics.map((agent) => (
              <Card key={agent.agentId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {agent.provider}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs mt-1">
                        {agent.agentId}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {(agent.reliability * 100).toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-600">Reliability</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">
                        Executions
                      </Label>
                      <p className="text-lg font-semibold mt-1">
                        {agent.executionCount}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Avg Cost</Label>
                      <p className="text-lg font-semibold mt-1 text-green-600">
                        ${agent.averageCost.toFixed(3)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">
                        Avg Latency
                      </Label>
                      <p className="text-lg font-semibold mt-1 text-blue-600">
                        {agent.averageLatency.toFixed(1)}s
                      </p>
                    </div>
                  </div>
                  <Progress value={agent.reliability * 100} className="mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown by Provider</CardTitle>
              <CardDescription>Total spend across all agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <CostBar
                  label="OpenAI GPT-4"
                  cost={35.4}
                  total={summary.totalCost}
                  color="bg-purple-500"
                />
                <CostBar
                  label="Lyzr Agent Factory"
                  cost={7.81}
                  total={summary.totalCost}
                  color="bg-blue-500"
                />
                <CostBar
                  label="Custom Agents"
                  cost={0.0}
                  total={summary.totalCost}
                  color="bg-gray-500"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cost per Execution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  ${(summary.totalCost / summary.totalExecutions).toFixed(3)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Most Expensive Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-gray-900">
                  OpenAI GPT-4
                </div>
                <p className="text-sm text-gray-600 mt-1">$0.12 avg/call</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cost Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">-12%</div>
                <p className="text-sm text-gray-600 mt-1">From last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reliability Tab */}
        <TabsContent value="reliability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Reliability Scores</CardTitle>
              <CardDescription>
                Based on successful completions and error rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentMetrics
                  .sort((a, b) => b.reliability - a.reliability)
                  .map((agent) => (
                    <div key={agent.agentId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {agent.provider}
                        </span>
                        <span className="text-sm font-semibold">
                          {(agent.reliability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={agent.reliability * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Self-Healing Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">23</div>
                <p className="text-sm text-gray-600 mt-1">
                  Automatic fallback triggers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Auto-Tuning Adjustments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">47</div>
                <p className="text-sm text-gray-600 mt-1">
                  Temperature optimizations
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "blue" | "green" | "red" | "purple";
  subtitle?: string;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBar({ label, value, total, color }: any) {
  const percentage = (value / total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CostBar({ label, cost, total, color }: any) {
  const percentage = (cost / total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">${cost.toFixed(2)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function Label({ children, className }: any) {
  return (
    <label className={`text-xs text-gray-600 ${className}`}>{children}</label>
  );
}
