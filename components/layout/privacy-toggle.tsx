"use client";

import { Eye, EyeOff } from "lucide-react";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { cn } from "@/lib/utils";

export function PrivacyToggle({ className }: { className?: string }) {
  const { hidden, toggle } = usePrivacy();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={hidden ? "Show amounts" : "Hide amounts"}
      title={hidden ? "Show amounts" : "Hide amounts"}
      className={cn("rounded-full p-1.5 hover:bg-white/10", className)}
    >
      {hidden ? (
        <EyeOff className="h-5 w-5" />
      ) : (
        <Eye className="h-5 w-5" />
      )}
    </button>
  );
}
