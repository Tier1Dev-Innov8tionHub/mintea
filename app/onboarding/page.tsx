"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings, useFinanceMutations } from "@/lib/db/hooks";
import { SpendingChart } from "@/components/charts";
import { formatCurrency } from "@/lib/format";
import { Leaf, ChevronLeft } from "lucide-react";

function nameFromClerkUser(user: {
  fullName: string | null;
  firstName: string | null;
  username: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
} | null | undefined): string {
  if (!user) return "";
  return (
    user.fullName?.trim() ||
    user.firstName?.trim() ||
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    ""
  );
}

const SLIDES = [
  {
    title: "Your finances,",
    subtitle: "all in one place",
    content: "preview-spending",
  },
  {
    title: "Track spending,",
    subtitle: "save more",
    content: "preview-savings",
  },
  {
    title: "Reach your",
    subtitle: "financial goals",
    content: "preview-goals",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { settings } = useSettings();
  const { updateSettings } = useFinanceMutations();
  const [slide, setSlide] = useState(0);
  const [step, setStep] = useState<"slides" | "setup">("slides");
  const [monthlyBudget, setMonthlyBudget] = useState("3500");

  const displayName = nameFromClerkUser(user);

  useEffect(() => {
    if (settings?.onboardingComplete) {
      router.replace("/");
    }
  }, [router, settings]);

  const handleFinish = async () => {
    await updateSettings({
      displayName: displayName || "Friend",
      monthlyBudget: parseFloat(monthlyBudget) || 3500,
      onboardingComplete: true,
    });
    router.replace("/");
  };

  if (step === "setup") {
    return (
      <div className="flex min-h-screen flex-col bg-white px-6 py-safe">
        <button onClick={() => setStep("slides")} className="py-4">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-2">
            {displayName ? `Welcome, ${displayName}` : "Welcome to mintea"}
          </h1>
          <p className="text-gray-500 mb-8">
            {displayName
              ? "Set a monthly budget to get started. Personal accounts stay private unless you share them."
              : "Shared workspace with private personal accounts when you need them."}
          </p>
          <div className="space-y-4">
            <Input
              label="Monthly budget target"
              type="number"
              placeholder="3500"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleFinish} className="w-full mb-8" size="lg">
          Get Started
        </Button>
      </div>
    );
  }

  const current = SLIDES[slide];
  const mockChartData = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    cumulative: Math.round(50 + i * 85 + ((i * 17) % 40)),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f4f6]">
      <div className="flex flex-1 items-center justify-center px-6 pt-12">
        <div className="w-full max-w-xs">
          {slide === 0 && (
            <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08)]">
              <div className="mint-gradient px-4 py-3">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-white" />
                  <span className="text-sm font-semibold text-white">mintea</span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500">Current spend this month</p>
                <p className="text-2xl font-bold tracking-tight">
                  {formatCurrency(2942)}
                </p>
                <p className="mt-1 text-xs text-emerald-600">$143 below budget</p>
                <div className="mt-2">
                  <SpendingChart data={mockChartData} budget={3500} height={80} />
                </div>
              </div>
            </div>
          )}
          {slide === 1 && (
            <div className="space-y-2">
              <div className="mint-gradient rounded-3xl p-5 text-white">
                <p className="text-xs opacity-80">Savings</p>
                <p className="text-3xl font-bold">{formatCurrency(11714)}</p>
              </div>
              <div className="flex justify-between rounded-3xl bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
                <span className="text-sm">Savings</span>
                <span className="font-semibold">{formatCurrency(12648)}</span>
              </div>
              <div className="flex justify-between rounded-3xl bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
                <span className="text-sm">Card balance</span>
                <span className="font-semibold text-red-500">
                  -{formatCurrency(934)}
                </span>
              </div>
            </div>
          )}
          {slide === 2 && (
            <div className="rounded-3xl bg-white shadow-xl p-4 space-y-3">
              {[
                { name: "Emergency Fund", current: 3200, target: 5000 },
                { name: "Vacation", current: 1166, target: 3000 },
              ].map((g) => (
                <div key={g.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{g.name}</span>
                    <span>{formatCurrency(g.current)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${(g.current / g.target) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-8 text-center">
        <h2 className="text-2xl font-bold">{current.title}</h2>
        <p className="text-xl text-gray-500">{current.subtitle}</p>

        <div className="flex justify-center gap-2 my-6">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === slide ? "bg-gray-900" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {slide < SLIDES.length - 1 ? (
          <Button onClick={() => setSlide(slide + 1)} className="w-full" size="lg">
            Continue
          </Button>
        ) : (
          <Button onClick={() => setStep("setup")} className="w-full" size="lg">
            Continue
          </Button>
        )}

        <button
          onClick={handleFinish}
          className="mt-4 text-sm underline text-gray-600"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
