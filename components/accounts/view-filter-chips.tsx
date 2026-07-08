"use client";

import type { AccountViewFilter } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ value: AccountViewFilter; label: string }> = [
  { value: "all", label: "All I can see" },
  { value: "mine", label: "Mine" },
  { value: "shared", label: "Shared" },
];

export function AccountViewFilterChips({
  value,
  onChange,
}: {
  value: AccountViewFilter;
  onChange: (next: AccountViewFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-emerald-600 text-white"
              : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
