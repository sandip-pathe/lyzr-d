"use client";

import { Button } from "@/components/ui/button";
import { Play, Save, Download, History, Loader2 } from "lucide-react";
import { useWorkflowStore } from "@/lib/store";
import { toast } from "sonner";

interface ToolbarProps {
  isExecuting: boolean;
}

export function Toolbar({ isExecuting }: ToolbarProps) {
  const { nodes, edges } = useWorkflowStore();

  const handleSave = async () => {
    // API call to save workflow
    toast.success("Workflow saved");
  };

  const handleRun = async () => {
    // API call to execute workflow
    toast.info("Workflow started");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-2 flex items-center gap-2">
      <Button onClick={handleRun} disabled={isExecuting} className="gap-2">
        {isExecuting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run
          </>
        )}
      </Button>

      <Button variant="outline" onClick={handleSave} className="gap-2">
        <Save className="w-4 h-4" />
        Save
      </Button>

      <Button variant="outline" className="gap-2">
        <History className="w-4 h-4" />
        History
      </Button>

      <Button variant="outline" className="gap-2">
        <Download className="w-4 h-4" />
        Export
      </Button>
    </div>
  );
}
