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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/80 bg-white/95 pb-safe backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-[430px] items-stretch justify-around px-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-[10px] font-medium transition-colors",
                active ? "text-emerald-700" : "text-gray-400",
              )}
            >
              {active && (
                <span className="absolute inset-x-3 top-0 h-[3px] rounded-b-full bg-emerald-600" />
              )}
              <Icon
                className={cn("h-5 w-5 stroke-[1.75]", active && "text-emerald-700")}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
