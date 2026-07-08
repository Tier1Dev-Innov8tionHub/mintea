"use client";

import { useDbInit } from "@/lib/db/hooks";
import { BrandMark } from "@/components/brand/brand-mark";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { ready, isLoading, error, isAuthenticated } = useDbInit();

  if (isLoading || (isAuthenticated && !ready && !error)) {
    return (
      <div className="mint-gradient flex min-h-screen items-center justify-center">
        <div className="animate-fade-up text-center">
          <BrandMark size="hero" stacked />
          <p className="mt-6 text-sm font-medium text-white/75">
            Loading your finances…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mint-gradient flex min-h-screen items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <BrandMark size="lg" stacked className="mb-6 justify-center" />
          <p className="text-sm text-white/90">{error}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <Sidebar />
      <div className="flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
