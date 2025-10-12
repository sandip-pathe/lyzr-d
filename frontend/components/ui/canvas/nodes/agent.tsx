"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { BaseNode } from "./base";
import { Bot, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const AgentNode = memo((props: NodeProps) => {
  const { provider, model } = props.data.config || {};

  return (
    <BaseNode {...props} icon={<Bot className="w-5 h-5" />} color="purple">
      <div className="space-y-3">
        {/* Provider badge */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <Badge variant="outline" className="text-xs">
            {provider || "OpenAI"}
          </Badge>
        </div>

        {/* Model */}
        {model && (
          <div className="text-xs text-gray-600">
            Model: <span className="font-mono">{model}</span>
          </div>
        )}

        {/* Input preview */}
        {props.data.config?.prompt && (
          <div className="text-xs text-gray-500 line-clamp-2 italic">
            {props.data.config.prompt}
          </div>
        )}
      </div>
    </BaseNode>
  );
});

AgentNode.displayName = "AgentNode";
