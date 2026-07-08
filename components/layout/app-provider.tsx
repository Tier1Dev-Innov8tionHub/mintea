"use client";

import { useDbInit } from "@/lib/db/hooks";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const ready = useDbInit();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-700 to-teal-500">
        <div className="text-center text-white">
          <div className="mb-4 text-4xl font-bold">mintea</div>
          <div className="text-sm opacity-80">Loading your finances...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
