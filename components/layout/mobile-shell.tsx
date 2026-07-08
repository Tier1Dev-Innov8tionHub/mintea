"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Settings, ChevronLeft } from "lucide-react";
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
  /** Pull main content up over the gradient header (Rocket Money–style). */
  overlap?: boolean;
}

export function MobileShell({
  title,
  children,
  showBack,
  showSettings = true,
  headerExtra,
  className,
  overlap = true,
}: MobileShellProps) {
  const router = useRouter();
  const today = format(new Date(), "EEE, MMM d");

  return (
    <div className={cn("flex min-h-screen flex-col bg-[#f3f4f6]", className)}>
      {/* Mobile: tall gradient + card overlap. Desktop: compact page title bar. */}
      <header className="mint-gradient px-4 pt-safe text-white pb-8 md:pb-0">
        <div className="mx-auto flex max-w-[430px] items-center justify-between py-3 md:max-w-none md:py-2.5">
          {/* Back / settings: mobile only — desktop uses the sidebar */}
          <div className="flex w-16 items-center justify-start gap-3 md:invisible md:pointer-events-none">
            {showBack ? (
              <button
                onClick={() => router.back()}
                className="rounded-full p-1.5 hover:bg-white/10"
                aria-label="Go back"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : showSettings ? (
              <Link
                href="/settings"
                className="rounded-full p-1.5 hover:bg-white/10"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
            ) : (
              <div className="w-7" />
            )}
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold tracking-wide md:text-base">
              {title ?? today}
            </p>
          </div>
          <div className="flex w-16 items-center justify-end gap-1.5">
            {headerExtra}
            {/* Account controls live in the sidebar on desktop */}
            <div className="md:hidden">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium hover:bg-white/25"
                  >
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                  >
                    Sign up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-7 w-7",
                    },
                  }}
                />
              </Show>
            </div>
          </div>
        </div>
      </header>
      <main className="relative z-10 flex-1 overflow-y-auto pb-24 md:pb-8">
        <div
          className={cn(
            "mx-auto max-w-[430px] px-4 md:max-w-4xl md:pt-6",
            // Card tuck only on mobile; desktop needs clear space under the toolbar
            overlap && "-mt-5 md:mt-0",
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
