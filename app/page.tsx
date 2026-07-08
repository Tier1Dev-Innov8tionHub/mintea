"use client";

import { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpendingChart } from "@/components/charts";
import { GoalProgressCard, AccountRow, TransactionRow } from "@/components/dashboard/cards";
import { CategoryIcon } from "@/components/icons/category-icon";
import { AddTransactionSheet } from "@/components/transactions/add-transaction-sheet";
import {
  useAccounts,
  useTransactions,
  useCategories,
  useGoals,
  useSettings,
  useFinanceMutations,
} from "@/lib/db/hooks";
import {
  netCash,
  totalBalances,
  accountLabel,
  monthlySpend,
  dailySpendingChart,
} from "@/lib/calculations";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { subMonths } from "date-fns";
import {
  Building2,
  CreditCard,
  PiggyBank,
  Banknote,
  RefreshCw,
  CheckCircle2,
  Plus,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

function accountTypeIcon(type: string) {
  switch (type) {
    case "credit":
      return <CreditCard className="h-5 w-5 text-indigo-600" />;
    case "savings":
      return <PiggyBank className="h-5 w-5 text-teal-600" />;
    case "cash":
      return <Banknote className="h-5 w-5 text-amber-600" />;
    default:
      return <Building2 className="h-5 w-5 text-emerald-600" />;
  }
}

export default function DashboardPage() {
  const accounts = useAccounts();
  const transactions = useTransactions();
  const categories = useCategories();
  const goals = useGoals();
  const { settings } = useSettings();
  const { touchSync } = useFinanceMutations();
  const [showAdd, setShowAdd] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const now = new Date();
  const lastMonth = subMonths(now, 1);
  const spend = monthlySpend(transactions, now);
  const lastMonthSpend = monthlySpend(transactions, lastMonth);
  const budget = settings?.monthlyBudget ?? 3500;
  const diff = budget - spend;
  const chartData = dailySpendingChart(transactions, now);
  const cash = netCash(accounts);
  const total = totalBalances(accounts);
  const sortedAccounts = [...accounts].sort((a, b) => {
    const order = ["checking", "savings", "credit", "cash"] as const;
    const byType = order.indexOf(a.type) - order.indexOf(b.type);
    if (byType !== 0) return byType;
    return a.name.localeCompare(b.name);
  });
  const recent = transactions.slice(0, 5);
  const activeGoals = goals.filter((g) => g.status === "active");

  const handleSync = async () => {
    setSyncing(true);
    await touchSync();
    setTimeout(() => setSyncing(false), 500);
  };

  const getCategory = (id: string | null) => categories.find((c) => c.id === id);

  return (
    <MobileShell>
      <div className="-mt-4 space-y-4">
        {/* Spending Card */}
        <Card className="overflow-hidden -mx-0 shadow-md">
          <CardContent className="p-0">
            <div className="p-4 pb-2">
              <p className="text-sm text-gray-500">Current spend this month</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">{formatCurrency(spend)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                {diff >= 0 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600 font-medium">
                      {formatCurrency(diff)} below budget
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600 font-medium">
                      {formatCurrency(Math.abs(diff))} over budget
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="px-2 pb-2">
              <SpendingChart data={chartData} budget={budget} />
            </div>
            {lastMonthSpend > 0 && (
              <div className="mx-4 mb-4 rounded-xl bg-emerald-50 px-3 py-2 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-700">
                  {spend < lastMonthSpend
                    ? `${formatCurrency(lastMonthSpend - spend)} less than last month`
                    : `${formatCurrency(spend - lastMonthSpend)} more than last month`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accounts */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 tracking-wider">ACCOUNTS</p>
            <div className="flex items-center gap-3">
              <Link href="/accounts" className="text-xs text-emerald-600 font-medium">
                Manage
              </Link>
              <button
                onClick={handleSync}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600"
              >
                <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
                Sync
              </button>
            </div>
          </div>
          <Card>
            <CardContent className="p-4">
              {sortedAccounts.length === 0 ? (
                <div className="py-2 text-center">
                  <p className="text-sm text-gray-500 mb-2">No accounts yet</p>
                  <Link href="/accounts">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Add account
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {sortedAccounts.map((account) => (
                    <AccountRow
                      key={account.id}
                      icon={accountTypeIcon(account.type)}
                      label={accountLabel(account)}
                      amount={account.balance}
                    />
                  ))}
                  <AccountRow
                    icon={<Banknote className="h-5 w-5 text-gray-600" />}
                    label="All balances"
                    amount={total}
                  />
                  <AccountRow
                    icon={<Banknote className="h-5 w-5 text-emerald-600" />}
                    label="Net cash"
                    amount={cash}
                    color="#059669"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Goals */}
        <div>
          <p className="text-xs font-semibold text-gray-500 tracking-wider mb-2">FINANCIAL GOALS</p>
          <div className="space-y-2">
            {activeGoals.map((goal) => (
              <GoalProgressCard key={goal.id} goal={goal} />
            ))}
          </div>
          <Link href="/goals">
            <Button variant="outline" className="w-full mt-2 gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 tracking-wider">RECENT TRANSACTIONS</p>
            <Link href="/transactions" className="text-xs text-emerald-600 font-medium">
              See all
            </Link>
          </div>
          <Card>
            <CardContent className="p-4">
              {recent.map((tx) => {
                const cat = getCategory(tx.categoryId);
                return (
                  <TransactionRow
                    key={tx.id}
                    description={tx.description}
                    date={formatShortDate(tx.date)}
                    amount={tx.amount}
                    type={tx.type}
                    icon={
                      cat ? (
                        <CategoryIcon icon={cat.icon} color={cat.color} />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <span className="text-blue-500 text-lg">?</span>
                        </div>
                      )
                    }
                  />
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={() => setShowAdd(true)}
          className="w-full gap-2"
          variant="mint"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <AddTransactionSheet open={showAdd} onClose={() => setShowAdd(false)} />
    </MobileShell>
  );
}
