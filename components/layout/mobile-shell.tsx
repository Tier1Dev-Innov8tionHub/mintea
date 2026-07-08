"use client";

import Link from "next/link";
import { Settings, Bell, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MobileShellProps {
  title?: string;
  children: React.ReactNode;
  showBack?: boolean;
  showSettings?: boolean;
  headerExtra?: React.ReactNode;
  className?: string;
}

export function MobileShell({
  title,
  children,
  showBack,
  showSettings = true,
  headerExtra,
  className,
}: MobileShellProps) {
  const router = useRouter();
  const today = format(new Date(), "EEEE, MMM d");

  return (
    <div className={cn("flex min-h-screen flex-col bg-gray-50", className)}>
      <header className="bg-gradient-to-r from-emerald-700 to-teal-500 px-4 pb-6 pt-safe text-white md:rounded-none">
        <div className="mx-auto flex max-w-[430px] items-center justify-between py-3 md:max-w-none">
          <div className="flex items-center gap-3">
            {showBack ? (
              <button onClick={() => router.back()} className="rounded-full p-1 hover:bg-white/10">
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : showSettings ? (
              <Link href="/settings" className="rounded-full p-1 hover:bg-white/10">
                <Settings className="h-5 w-5" />
              </Link>
            ) : (
              <div className="w-7" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">{title ?? today}</p>
          </div>
          <div className="flex items-center gap-2">
            {headerExtra}
            {!showBack && (
              <button className="rounded-full p-1 hover:bg-white/10">
                <Bell className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <div className="mx-auto max-w-[430px] px-4 md:max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
