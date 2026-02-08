"use client";

import { createContext, useContext, ReactNode } from "react";
import type { DemoStore } from "@/lib/demo-store";

type StoreHook = () => DemoStore;

const DashboardContext = createContext<StoreHook | null>(null);

export function DashboardProvider({ children, demo = false, storeHook }: { children: ReactNode; demo?: boolean; storeHook: StoreHook }) {
  return <DashboardContext.Provider value={storeHook}>{children}</DashboardContext.Provider>;
}

export function useDashboardStore() {
  const storeHook = useContext(DashboardContext);
  if (!storeHook) {
    throw new Error("useDashboardStore must be used within DashboardProvider");
  }
  return storeHook();
}
