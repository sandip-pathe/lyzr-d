"use client";

import {
  Code2,
  ExternalLink,
  Terminal,
  Zap,
  CheckCircle2,
  Database,
  Clock,
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

export default function APIPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <header className="pb-8 border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Terminal className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                API Reference
              </h1>
              <p className="text-gray-600 mt-1">
                RESTful API endpoints for workflow orchestration
              </p>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Link href="/">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
            <a
              href={`${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
              }/docs`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-purple-600 hover:bg-purple-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Interactive API Docs
              </Button>
            </a>
          </div>
        </header>

        {/* Introduction */}
        <section className="mt-8">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-lg border border-purple-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Developer API for Workflow Orchestration
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              The Lyzr Orchestrator API provides a comprehensive set of RESTful
              endpoints to programmatically create, manage, execute, and monitor
              AI-powered workflows. Built on FastAPI with full OpenAPI 3.0
              specification, our API enables seamless integration with your
              applications.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">RESTful Design</p>
                  <p className="text-sm text-gray-600">
                    Standard HTTP methods and status codes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">JSON Format</p>
                  <p className="text-sm text-gray-600">
                    All requests and responses use JSON
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">
                    Real-time Events
                  </p>
                  <p className="text-sm text-gray-600">
                    WebSocket support for live updates
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Base URL
            </h2>
            <code className="bg-gray-100 px-4 py-2 rounded text-sm block font-mono">
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
            </code>
            <p className="text-sm text-gray-600 mt-3">
              All API requests should be made to this base URL. Authentication
              may be required for production deployments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Code2 className="w-6 h-6 text-purple-600" />
                  Workflows API
                </CardTitle>
                <CardDescription>
                  Create, read, update, and delete workflows. Manage workflow
                  definitions with nodes and edges.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm border-l-2 border-green-500 pl-3 py-1">
                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                    GET
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/workflows
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    List all workflows with pagination
                  </p>
                </div>
                <div className="text-sm border-l-2 border-blue-500 pl-3 py-1">
                  <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                    POST
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/workflows
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a new workflow definition
                  </p>
                </div>
                <div className="text-sm border-l-2 border-green-500 pl-3 py-1">
                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                    GET
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/workflows/:id
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Get workflow details by ID
                  </p>
                </div>
                <div className="text-sm border-l-2 border-yellow-500 pl-3 py-1">
                  <span className="font-mono bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                    PUT
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/workflows/:id
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Update workflow configuration
                  </p>
                </div>
                <div className="text-sm border-l-2 border-red-500 pl-3 py-1">
                  <span className="font-mono bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                    DELETE
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/workflows/:id
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Delete a workflow permanently
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-purple-600" />
                  Executions API
                </CardTitle>
                <CardDescription>
                  Trigger workflow runs and monitor execution status in
                  real-time with Temporal orchestration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm border-l-2 border-blue-500 pl-3 py-1">
                  <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                    POST
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/workflows/:id/execute
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Trigger a new workflow execution with input data
                  </p>
                </div>
                <div className="text-sm border-l-2 border-green-500 pl-3 py-1">
                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                    GET
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/executions
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    List all workflow executions with filters
                  </p>
                </div>
                <div className="text-sm border-l-2 border-green-500 pl-3 py-1">
                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                    GET
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/executions/:id
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Get execution details, status, and outputs
                  </p>
                </div>
                <div className="text-sm border-l-2 border-orange-500 pl-3 py-1">
                  <span className="font-mono bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">
                    POST
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/executions/:id/cancel
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Cancel a running execution
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Terminal className="w-6 h-6 text-purple-600" />
                  Events API
                </CardTitle>
                <CardDescription>
                  Stream real-time workflow events, execution logs, and state
                  changes via REST and WebSockets.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm border-l-2 border-green-500 pl-3 py-1">
                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                    GET
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/events
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Query historical event logs with pagination
                  </p>
                </div>
                <div className="text-sm border-l-2 border-green-500 pl-3 py-1">
                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                    GET
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/workflows/:id/events
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Get events for a specific workflow execution
                  </p>
                </div>
                <div className="text-sm border-l-2 border-purple-500 pl-3 py-1">
                  <span className="font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                    WS
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /ws/workflows/:id
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    WebSocket connection for live event streaming
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Code2 className="w-6 h-6 text-purple-600" />
                  Node Types API
                </CardTitle>
                <CardDescription>
                  Discover available node types, their configuration schemas,
                  and input/output specifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm border-l-2 border-green-500 pl-3 py-1">
                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                    GET
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/node-types
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    List all available node types and categories
                  </p>
                </div>
                <div className="text-sm border-l-2 border-green-500 pl-3 py-1">
                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                    GET
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/node-types/:type
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Get detailed schema for a specific node type
                  </p>
                </div>
                <div className="text-sm border-l-2 border-green-500 pl-3 py-1">
                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                    GET
                  </span>
                  <code className="ml-2 text-gray-600 font-mono">
                    /api/node-types/:type/schema
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Get JSON Schema for node configuration validation
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Authentication & Usage
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Request Headers
              </h3>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                  <span className="text-gray-600">Content-Type:</span>{" "}
                  application/json
                </div>
                <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                  <span className="text-gray-600">Accept:</span>{" "}
                  application/json
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Response Format
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  All responses return JSON with standard structure:
                </p>
                <div className="bg-gray-50 p-3 rounded font-mono text-xs text-gray-700">
                  {`{ "data": {...}, "status": "success" }`}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Example: Execute a Workflow
            </h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm font-mono">
                {`curl -X POST "${
                  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
                }/api/workflows/abc123/execute" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input_data": {
      "user_query": "Analyze customer sentiment",
      "data_source": "reviews.csv"
    }
  }'`}
              </pre>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Interactive API Documentation
            </h3>
            <p className="text-gray-600 mb-4">
              For detailed API documentation with interactive examples,
              request/response schemas, and a built-in API testing interface,
              visit our Swagger UI:
            </p>
            <a
              href={`${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
              }/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 underline text-lg font-medium"
            >
              Open Interactive API Documentation
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
