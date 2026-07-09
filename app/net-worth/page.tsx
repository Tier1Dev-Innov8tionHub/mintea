"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NetWorthChart } from "@/components/charts";
import { AccountViewFilterChips } from "@/components/accounts/view-filter-chips";
import {
  useAccounts,
  useBalanceSnapshots,
  useFinanceMutations,
  useViewer,
} from "@/lib/db/hooks";
import { filterAccountsByView } from "@/lib/account-view";
import { accountLabel, netWorthBreakdown } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import {
  Building2,
  CreditCard,
  PiggyBank,
  Banknote,
  TrendingUp,
  Camera,
} from "lucide-react";
import type { AccountType, AccountViewFilter } from "@/lib/db/schema";

function typeIcon(type: AccountType) {
  switch (type) {
    case "credit":
      return <CreditCard className="h-5 w-5 text-indigo-600" />;
    case "savings":
      return <PiggyBank className="h-5 w-5 text-teal-600" />;
    case "cash":
      return <Banknote className="h-5 w-5 text-amber-600" />;
    case "investment":
      return <TrendingUp className="h-5 w-5 text-violet-600" />;
    default:
      return <Building2 className="h-5 w-5 text-emerald-600" />;
  }
}

export default function NetWorthPage() {
  const accounts = useAccounts();
  const snapshots = useBalanceSnapshots();
  const viewer = useViewer();
  const { captureBalanceSnapshot } = useFinanceMutations();
  const [capturing, setCapturing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<AccountViewFilter>("all");

  const filteredAccounts = useMemo(
    () => filterAccountsByView(accounts, viewer?.userId, viewFilter),
    [accounts, viewer?.userId, viewFilter],
  );

  const breakdown = useMemo(
    () => netWorthBreakdown(filteredAccounts),
    [filteredAccounts],
  );
  const chartData = useMemo(
    () =>
      snapshots.map((s: { date: string; netWorth: number }) => ({
        date: s.date,
        netWorth: s.netWorth,
      })),
    [snapshots],
  );

  const sortedAccounts = useMemo(
    () =>
      [...filteredAccounts].sort((a, b) => {
        const order: AccountType[] = [
          "checking",
          "cash",
          "savings",
          "investment",
          "credit",
        ];
        const byType = order.indexOf(a.type) - order.indexOf(b.type);
        if (byType !== 0) return byType;
        return a.name.localeCompare(b.name);
      }),
    [filteredAccounts],
  );

  const canCapture = viewFilter === "all";

  const handleCapture = async () => {
    if (!canCapture) return;
    setCapturing(true);
    setMessage(null);
    try {
      await captureBalanceSnapshot();
      setMessage("Snapshot saved for today");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to capture");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <MobileShell
      title="Net Worth"
      showBack
      headerExtra={
        <button
          type="button"
          onClick={() => void handleCapture()}
          disabled={capturing || !canCapture}
          className="rounded-full p-1 hover:bg-white/10 disabled:opacity-50"
          aria-label="Capture balance snapshot"
        >
          <Camera className="h-5 w-5" />
        </button>
      }
    >
      <div className="space-y-4">
        <AccountViewFilterChips value={viewFilter} onChange={setViewFilter} />

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Net worth</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {formatCurrency(breakdown.netWorth)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Assets</p>
                <p className="font-semibold text-emerald-700">
                  {formatCurrency(breakdown.assets)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Liabilities</p>
                <p className="font-semibold text-indigo-700">
                  {formatCurrency(breakdown.liabilities)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wider text-gray-500">
                HISTORY
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={capturing || accounts.length === 0 || !canCapture}
                onClick={() => void handleCapture()}
              >
                <Camera className="h-3.5 w-3.5" />
                {capturing ? "Saving…" : "Snapshot"}
              </Button>
            </div>
            <NetWorthChart data={chartData} />
            {!canCapture && (
              <p className="mt-2 text-center text-xs text-gray-500">
                Snapshots capture total net worth. Switch to All to save one.
              </p>
            )}
            {message && (
              <p className="mt-2 text-center text-xs text-gray-500">{message}</p>
            )}
          </CardContent>
        </Card>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500">
            BY TYPE
          </p>
          <Card>
            <CardContent className="divide-y divide-gray-100 p-0">
              {breakdown.byType.map((row) => (
                <div
                  key={row.type}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {typeIcon(row.type)}
                    <span className="font-medium">{row.label}</span>
                  </div>
                  <span
                    className={
                      row.type === "credit"
                        ? "font-semibold text-indigo-700"
                        : "font-semibold"
                    }
                  >
                    {formatCurrency(row.total)}
                  </span>
                </div>
              ))}
              {breakdown.byType.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-gray-500">
                  No accounts yet.{" "}
                  <Link href="/accounts" className="text-emerald-600">
                    Add one
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {sortedAccounts.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wider text-gray-500">
                ACCOUNTS
              </p>
              <Link
                href="/accounts"
                className="text-xs font-medium text-emerald-600"
              >
                Manage
              </Link>
            </div>
            <Card>
              <CardContent className="divide-y divide-gray-100 p-0">
                {sortedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {typeIcon(account.type)}
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {accountLabel(account)}
                        </p>
                        <p className="text-xs capitalize text-gray-500">
                          {account.type}
                        </p>
                      </div>
                    </div>
                    <span
                      className={
                        account.type === "credit"
                          ? "font-semibold text-indigo-700"
                          : "font-semibold"
                      }
                    >
                      {formatCurrency(account.balance)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
