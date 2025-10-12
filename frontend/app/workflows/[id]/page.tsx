import { Canvas } from "@/components/ui/canvas/canvas";
import { Toaster } from "sonner";

export default function WorkflowEditorPage() {
  return (
    <>
      <Canvas />
      <Toaster position="bottom-right" />
    </>
  );
}
