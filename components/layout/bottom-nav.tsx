"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CalendarClock,
  Wallet,
  Search,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/recurring", label: "Recurring", icon: CalendarClock },
  { href: "/spending", label: "Spending", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: Search },
  { href: "/more", label: "More", icon: Menu },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white pb-safe md:hidden">
      <div className="mx-auto flex max-w-[430px] items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
                active ? "text-emerald-600" : "text-gray-500"
              )}
            >
              {active && <div className="mb-0.5 h-0.5 w-6 rounded-full bg-emerald-600" />}
              <Icon className={cn("h-5 w-5", active && "text-emerald-600")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
