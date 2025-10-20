/**
 * API Configuration and Utilities
 * Centralized API client for all backend communication
 */

// Get API URL from environment variable with fallback
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

/**
 * Build API endpoint URL
 */
export function apiUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
}

/**
 * Build WebSocket URL
 */
export function wsUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${WS_URL}/${cleanPath}`;
}

/**
 * Fetch wrapper with error handling
 */
export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = apiUrl(path);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error(`API Error [${path}]:`, error);
    throw error;
  }
}

/**
 * API Client with typed methods
 */
export const api = {
  // Workflows
  workflows: {
    list: () => apiFetch("/api/workflows/"),
    get: (id: string) => apiFetch(`/api/workflows/${id}`),
    create: (data: {
      name: string;
      description?: string;
      nodes?: any[];
      edges?: any[];
    }) =>
      apiFetch("/api/workflows/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiFetch(`/api/workflows/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    execute: (id: string, input_data: any) =>
      apiFetch(`/api/workflows/${id}/execute`, {
        method: "POST",
        body: JSON.stringify({ input_data }),
      }),
  },

  // Executions
  executions: {
    get: (id: string) => apiFetch(`/api/executions/${id}`),
    narrate: (id: string) =>
      apiFetch(`/api/executions/${id}/narrate`, { method: "POST" }),
  },

  // Approvals
  approvals: {
    approve: (executionId: string, data: any) =>
      apiFetch(`/api/approvals/${executionId}/approve`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    deny: (executionId: string, reason: string) =>
      apiFetch(`/api/approvals/${executionId}/deny`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
  },

  // Node Types
  nodeTypes: {
    list: () => apiFetch("/api/node-types"),
  },

  // Metrics
  metrics: {
    get: () => apiFetch("/api/metrics"),
  },
};
