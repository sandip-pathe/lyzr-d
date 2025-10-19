"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiCallConfig } from "@/types/workflow";

interface ApiCallPropertiesProps {
  config: ApiCallConfig;
  onUpdate: (key: string, value: any) => void;
}

export function ApiCallProperties({
  config,
  onUpdate,
}: ApiCallPropertiesProps) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={config.name || ""}
          onChange={(e) => onUpdate("name", e.target.value)}
          placeholder="e.g., Fetch User Data"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Required - Identifies this API call
        </p>
      </div>

      {/* URL */}
      <div className="space-y-2">
        <Label>URL</Label>
        <Input
          value={config.url || ""}
          onChange={(e) => onUpdate("url", e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">Required - API endpoint</p>
      </div>

      {/* Method */}
      <div className="space-y-2">
        <Label>HTTP Method</Label>
        <Select
          value={config.method || "POST"}
          onValueChange={(v) => onUpdate("method", v)}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Headers */}
      <div className="space-y-2">
        <Label>Headers (JSON)</Label>
        <Textarea
          value={JSON.stringify(config.headers || {}, null, 2)}
          onChange={(e) => {
            try {
              onUpdate("headers", JSON.parse(e.target.value));
            } catch {
              // Ignore parse errors while typing
            }
          }}
          placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
          rows={3}
          className="font-mono text-xs bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">Optional - HTTP headers</p>
      </div>

      {/* Body */}
      <div className="space-y-2">
        <Label>Body (JSON)</Label>
        <Textarea
          value={JSON.stringify(config.body || {}, null, 2)}
          onChange={(e) => {
            try {
              onUpdate("body", JSON.parse(e.target.value));
            } catch {
              // Ignore parse errors while typing
            }
          }}
          placeholder='{"key": "value"}'
          rows={4}
          className="font-mono text-xs bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-400">
          Optional for GET - Previous output will be merged in automatically
        </p>
      </div>
    </div>
  );
}
