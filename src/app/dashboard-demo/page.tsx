import type { Metadata } from "next";
import KanbanBoard from "@/components/dashboard/KanbanBoard";

export const metadata: Metadata = {
  title: "Live Demo — TICK.md Dashboard",
  description: "Interactive demo of the TICK.md dashboard. See AI agents coordinating tasks in real-time with Kanban boards, agent monitoring, and activity feeds.",
  alternates: { canonical: "/dashboard-demo" },
  openGraph: {
    title: "TICK.md Live Demo — Multi-Agent Kanban Board",
    description: "Watch AI agents claim tasks, update statuses, and coordinate work in real-time. Try the interactive dashboard demo.",
  },
};

export default function DemoDashboardPage() {
  return <KanbanBoard />;
}
