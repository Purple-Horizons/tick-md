"use client";

import Shell from "@/components/dashboard/Shell";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { useTickStore } from "@/lib/store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider storeHook={useTickStore}>
      <Shell>{children}</Shell>
    </DashboardProvider>
  );
}
