import { WorkflowCanvas } from "@/components/ui/canvas/canvas";
import { Toaster } from "sonner";

export default function WorkflowEditorPage() {
  return (
    <>
      <WorkflowCanvas />
      <Toaster position="bottom-right" />
    </>
  );
}
