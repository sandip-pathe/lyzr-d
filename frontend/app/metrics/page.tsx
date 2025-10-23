import { MetricsDashboard } from "@/components/dashboard/metrics";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metrics - Lyzr Orchestrator",
  description:
    "Monitor workflow performance, execution metrics, AI agent reliability, and system analytics. Track latency, success rates, and operational insights.",
  keywords:
    "metrics, analytics, workflow metrics, performance monitoring, AI agent metrics, dashboard",
  openGraph: {
    title: "Metrics Dashboard - Lyzr Orchestrator",
    description: "Real-time workflow and AI agent performance metrics",
    type: "website",
  },
};

export default function MetricsPage() {
  return <MetricsDashboard />;
}
