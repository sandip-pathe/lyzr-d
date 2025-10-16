"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { BaseNode } from "./base";
import { UserCheck, Mail, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ApprovalNode = memo((props: NodeProps) => {
  const { approvers, channels } = props.data.config || {};

  return (
    <BaseNode
      {...props}
      icon={<UserCheck className="w-5 h-5" />}
      color="orange"
    >
      <div className="space-y-3">
        {approvers?.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-700">Approvers</div>
            <div className="flex flex-wrap gap-1">
              {approvers.map((email: string) => (
                <Badge key={email} variant="secondary" className="text-xs">
                  {email}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {channels?.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-medium text-gray-700">Channels:</span>
            {channels.includes("email") && (
              <Mail className="w-4 h-4 text-gray-500" />
            )}
            {channels.includes("slack") && (
              <MessageSquare className="w-4 h-4 text-gray-500" />
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
});

ApprovalNode.displayName = "ApprovalNode";
