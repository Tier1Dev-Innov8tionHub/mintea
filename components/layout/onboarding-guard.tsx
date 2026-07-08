"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSettings } from "@/lib/db/seed";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/onboarding") return;
    getSettings().then((s) => {
      if (!s.onboardingComplete) {
        router.replace("/onboarding");
      }
    });
  }, [pathname, router]);

  return <>{children}</>;
}
