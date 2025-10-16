"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText } from "lucide-react";

interface NarrationModalProps {
  open: boolean;
  onClose: () => void;
  narration: string | undefined;
  isLoading: boolean;
}

// A simple markdown-to-HTML renderer
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const html = content
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
    .replace(
      /^## (.*$)/gim,
      '<h2 class="text-xl font-semibold mt-6 mb-3 border-b pb-2">$1</h2>'
    )
    .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
    .replace(
      /`(.*)`/gim,
      '<code class="bg-gray-100 text-sm font-mono p-1 rounded">$1</code>'
    )
    .replace(/\n/gim, "<br />");

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export function NarrationModal({
  open,
  onClose,
  narration,
  isLoading,
}: NarrationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5 text-blue-600" />
            Execution Narration Report
          </DialogTitle>
          <DialogDescription>
            A human-readable summary of the workflow execution timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full rounded-md border p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <p className="ml-4 text-gray-500">Generating narration...</p>
              </div>
            ) : narration ? (
              <div className="prose prose-sm max-w-none">
                <SimpleMarkdown content={narration} />
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No narration available for this execution.
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
