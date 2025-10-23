"use client";

import {
  Book,
  Code,
  FileText,
  Layers,
  Zap,
  GitBranch,
  Users,
  Shield,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DocsPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <header className="pb-8 border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Book className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Documentation
              </h1>
              <p className="text-gray-600 mt-1">
                Learn how to build and orchestrate AI workflows
              </p>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Link href="/">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </header>

        {/* Content Section */}
        <section className="mt-8">
          {/* Introduction Banner */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-lg border border-purple-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Lyzr Orchestrator Documentation
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Lyzr Orchestrator is a visual, event-driven AI workflow
              orchestration platform that combines the reliability of
              deterministic workflow engines with the flexibility of intelligent
              AI agents. Build complex workflows using a drag-and-drop canvas,
              execute them with Temporal&apos;s durable orchestration, and
              monitor everything in real-time.
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <Link href="/api">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  View API Reference
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Core Concepts */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Core Concepts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Code className="w-6 h-6 text-purple-600" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>
                    Quick start guide to building your first workflow
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-2">
                      Build Your First Workflow:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600">
                      <li>Create a new workflow from the dashboard</li>
                      <li>Drag nodes onto the canvas</li>
                      <li>Connect nodes to define execution flow</li>
                      <li>Configure node properties</li>
                      <li>Execute and monitor results</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Layers className="w-6 h-6 text-purple-600" />
                    Node Types
                  </CardTitle>
                  <CardDescription>
                    Available node types and their configurations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-2">Available Node Types:</p>
                    <ul className="space-y-1 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <strong>AI Agents:</strong> GPT-4o, Claude, Gemini,
                        Custom Agents
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <strong>Logic:</strong> Conditional, Loops, Data
                        Transform
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <strong>Integration:</strong> HTTP, Database, API Calls
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <strong>Human-in-Loop:</strong> Approval, Review Gates
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <GitBranch className="w-6 h-6 text-purple-600" />
                    Workflow Patterns
                  </CardTitle>
                  <CardDescription>
                    Common patterns and best practices for workflow design
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-2">
                      Popular Workflow Patterns:
                    </p>
                    <ul className="space-y-1 text-gray-600">
                      <li className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Sequential Processing
                      </li>
                      <li className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-blue-500" />
                        Parallel Execution
                      </li>
                      <li className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-500" />
                        Human-in-the-Loop Approval
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-500" />
                        Error Handling & Retry Logic
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Book className="w-6 h-6 text-purple-600" />
                    Advanced Topics
                  </CardTitle>
                  <CardDescription>
                    Deep dive into orchestration layer concepts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-2">Advanced Features:</p>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Event-driven architecture with Redis Pub/Sub</li>
                      <li>• Temporal workflow orchestration</li>
                      <li>• Real-time WebSocket updates</li>
                      <li>• Durable execution and state management</li>
                      <li>• Workflow versioning and rollback</li>
                      <li>• Custom node development</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Architecture Overview */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Architecture Overview
            </h2>
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Hybrid Orchestration Architecture</CardTitle>
                <CardDescription>
                  Understanding the event-driven workflow execution model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-700 space-y-3">
                  <p>
                    Lyzr Orchestrator uses a hybrid architecture that combines:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Frontend Layer
                      </h4>
                      <p className="text-sm text-blue-800">
                        React Flow canvas for visual workflow design with
                        real-time updates via WebSockets
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-2">
                        Orchestration Layer
                      </h4>
                      <p className="text-sm text-purple-800">
                        Temporal workflows for durable execution with Redis
                        event streaming
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">
                        Execution Layer
                      </h4>
                      <p className="text-sm text-green-800">
                        Python workers executing AI agents, API calls, and
                        business logic
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Use Cases */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Common Use Cases
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-lg border hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">
                  📝 Document Processing
                </h3>
                <p className="text-sm text-gray-600">
                  Automate document analysis, extraction, and classification
                  with AI agents
                </p>
              </div>
              <div className="bg-white p-5 rounded-lg border hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">
                  🤖 Customer Support Automation
                </h3>
                <p className="text-sm text-gray-600">
                  Route, analyze, and respond to customer queries with
                  intelligent agents
                </p>
              </div>
              <div className="bg-white p-5 rounded-lg border hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">
                  📊 Data Pipeline Orchestration
                </h3>
                <p className="text-sm text-gray-600">
                  Build ETL workflows with AI-powered data transformation and
                  validation
                </p>
              </div>
              <div className="bg-white p-5 rounded-lg border hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">
                  ✅ Approval Workflows
                </h3>
                <p className="text-sm text-gray-600">
                  Create human-in-the-loop workflows for compliance and review
                  processes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* External Resources */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            External Resources
          </h2>
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-gray-600 mb-4">
              Learn more about orchestration and workflow patterns:
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://docs.temporal.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 underline"
              >
                Temporal Documentation →
              </a>
              <a
                href="https://docs.lyzr.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 underline"
              >
                Lyzr AI Documentation →
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
