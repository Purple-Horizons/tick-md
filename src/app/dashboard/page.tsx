import type { Metadata } from "next";
import KanbanBoard from "@/components/dashboard/KanbanBoard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "TICK.md self-hosted dashboard. Kanban board for managing multi-agent tasks with real-time updates from your TICK.md file.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <KanbanBoard />;
}
