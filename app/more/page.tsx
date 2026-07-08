"use client";

import Link from "next/link";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  Target,
  PieChart,
  Settings,
  Leaf,
  ChevronRight,
  Smartphone,
  Building2,
  TrendingUp,
} from "lucide-react";

const MORE_ITEMS = [
  {
    href: "/accounts",
    label: "Accounts",
    icon: Building2,
    description: "Balances you enter manually",
  },
  {
    href: "/net-worth",
    label: "Net Worth",
    icon: TrendingUp,
    description: "Assets, liabilities, and history",
  },
  {
    href: "/goals",
    label: "Savings Goals",
    icon: Target,
    description: "Track your financial goals",
  },
  {
    href: "/budgets",
    label: "Budgets",
    icon: PieChart,
    description: "Manage category budgets",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "App preferences",
  },
];

export default function MorePage() {
  return (
    <MobileShell title="More" showSettings={false}>
      <div className="animate-fade-up space-y-5">
        <Card className="overflow-hidden">
          <div className="mint-gradient px-5 py-6">
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80">
                <Leaf className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">mintea</p>
                <p className="text-sm text-white/75">Household finance</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardContent className="divide-y divide-gray-100 p-0">
            {MORE_ITEMS.map(({ href, label, icon: Icon, description }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <Icon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <Smartphone className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Add to Home Screen
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                In Safari or Chrome, use Share → Add to Home Screen for a
                full-screen mintea experience with the mint splash.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="pt-2 text-center text-xs text-gray-400">
          mintea · Shared workspace · Private personal accounts
        </p>
      </div>
    </MobileShell>
  );
}
