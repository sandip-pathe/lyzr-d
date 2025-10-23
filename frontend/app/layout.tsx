import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Lyzr Orchestrator - AI Workflow Orchestration Platform",
  description:
    "Build, deploy, and scale intelligent AI workflows with event-driven orchestration. Visual workflow builder with drag-and-drop nodes, Temporal orchestration, real-time monitoring, and human-in-the-loop approvals. From idea to production in minutes.",
  keywords:
    "AI workflow, orchestration, Temporal, workflow automation, AI agents, event-driven, visual builder, no-code AI, workflow platform, Lyzr",
  authors: [{ name: "Sandip Pathe" }],
  openGraph: {
    title: "Lyzr Orchestrator - AI Workflow Platform",
    description: "Visual, event-driven AI workflow orchestration platform",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lyzr Orchestrator - AI Workflow Platform",
    description: "Build intelligent AI workflows with visual orchestration",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://lyzr.anaya.legal"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
