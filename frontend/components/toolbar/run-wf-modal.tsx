import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Play, Loader2 } from "lucide-react";

interface RunWorkflowModalProps {
  open: boolean;
  onClose: () => void;
  onRun: (inputData: any) => void;
  isExecuting: boolean;
}

export function RunWorkflowModal({
  open,
  onClose,
  onRun,
  isExecuting,
}: RunWorkflowModalProps) {
  const [inputData, setInputData] = useState("{\n\n}");

  const handleRun = () => {
    try {
      const parsedData = JSON.parse(inputData);
      onRun(parsedData);
    } catch (error) {
      alert("Invalid JSON input.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Run Workflow</DialogTitle>
          <DialogDescription>
            Provide initial JSON input data for the workflow execution.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="input-data" className="text-right pt-2">
              Input Data
            </Label>
            <Textarea
              id="input-data"
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              className="col-span-3 font-mono"
              rows={10}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleRun} disabled={isExecuting}>
            {isExecuting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Execute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
