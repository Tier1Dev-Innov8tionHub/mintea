"use client";

import { useDbInit } from "@/lib/db/hooks";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { ready, isLoading, error, isAuthenticated } = useDbInit();

  if (isLoading || (isAuthenticated && !ready && !error)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-700 to-teal-500">
        <div className="text-center text-white">
          <div className="mb-4 text-4xl font-bold">mintea</div>
          <div className="text-sm opacity-80">Loading your finances...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-700 to-teal-500 px-6">
        <div className="max-w-sm text-center text-white">
          <div className="mb-4 text-4xl font-bold">mintea</div>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
