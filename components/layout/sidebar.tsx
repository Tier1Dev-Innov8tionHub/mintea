"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import {
  LayoutGrid,
  CalendarClock,
  Wallet,
  PieChart,
  Search,
  Target,
  Settings,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/recurring", label: "Recurring", icon: CalendarClock },
  { href: "/spending", label: "Spending", icon: Wallet },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/transactions", label: "Transactions", icon: Search },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-gray-200 md:bg-white md:min-h-screen">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-emerald-700">mintea</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {SIDEBAR_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 p-4 space-y-3">
        <Show when="signed-out">
          <div className="flex flex-col gap-2">
            <SignInButton mode="modal">
              <button
                type="button"
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign up
              </button>
            </SignUpButton>
          </div>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-3">
            <UserButton />
            <div>
              <p className="text-xs text-gray-400">Personal finance tracker</p>
              <p className="text-xs text-gray-400">Synced via Convex</p>
            </div>
          </div>
        </Show>
      </div>
    </aside>
  );
}
