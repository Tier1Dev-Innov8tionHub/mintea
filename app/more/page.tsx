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
  HelpCircle,
} from "lucide-react";

const MORE_ITEMS = [
  { href: "/goals", label: "Savings Goals", icon: Target, description: "Track your financial goals" },
  { href: "/budgets", label: "Budgets", icon: PieChart, description: "Manage category budgets" },
  { href: "/settings", label: "Settings", icon: Settings, description: "App preferences" },
];

export default function MorePage() {
  return (
    <MobileShell title="More" showSettings={false}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 py-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-700">mintea</p>
            <p className="text-sm text-gray-500">Personal finance tracker</p>
          </div>
        </div>

        <div className="space-y-2">
          {MORE_ITEMS.map(({ href, label, icon: Icon, description }) => (
            <Link key={href} href={href}>
              <Card className="hover:bg-gray-50 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Add to Home Screen</p>
              <p className="text-xs text-gray-500">
                Install mintea as an app on your phone for the best experience.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 pt-4">mintea v0.1.0 · Data stored locally</p>
      </div>
    </MobileShell>
  );
}
