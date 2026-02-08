"use client";

import Shell from "@/components/dashboard/Shell";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { useTickStore } from "@/lib/store";
import "./dashboard.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-root">
      <DashboardProvider storeHook={useTickStore}>
        <Shell>{children}</Shell>
      </DashboardProvider>
    </div>
  );
}
