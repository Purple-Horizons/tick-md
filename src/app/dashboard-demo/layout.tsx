"use client";

import Shell from "@/components/dashboard/Shell";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { useDemoStore } from "@/lib/demo-store";

export default function DemoDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider demo={true} storeHook={useDemoStore}>
      <Shell isDemo={true}>{children}</Shell>
    </DashboardProvider>
  );
}
