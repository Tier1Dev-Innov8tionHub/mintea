"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useSettings } from "@/lib/db/hooks";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { settings } = useSettings();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (pathname === "/onboarding" || pathname === "/signin") return;
    if (settings && !settings.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [pathname, router, isAuthenticated, isLoading, settings]);

  return <>{children}</>;
}
