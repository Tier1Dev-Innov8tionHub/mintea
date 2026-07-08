"use client";

import { useMemo, useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpendingChart } from "@/components/charts";
import {
  GoalProgressCard,
  AccountRow,
  TransactionRow,
} from "@/components/dashboard/cards";
import { CategoryIcon } from "@/components/icons/category-icon";
import { AccountViewFilterChips } from "@/components/accounts/view-filter-chips";
import { AddTransactionSheet } from "@/components/transactions/add-transaction-sheet";
import { EditTransactionSheet } from "@/components/transactions/edit-transaction-sheet";
import {
  useAccounts,
  useTransactions,
  useCategories,
  useGoals,
  useSettings,
  useViewer,
} from "@/lib/db/hooks";
import {
  filterAccountsByView,
  filterTransactionsByAccountView,
} from "@/lib/account-view";
import {
  netCash,
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
  CheckCircle2,
  Plus,
  TrendingDown,
  Wallet,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { AccountViewFilter, Transaction } from "@/lib/db/schema";

function accountTypeIcon(type: string) {
  switch (type) {
    case "credit":
      return <CreditCard className="h-5 w-5 text-indigo-600" />;
    case "savings":
      return <PiggyBank className="h-5 w-5 text-teal-600" />;
    case "cash":
      return <Banknote className="h-5 w-5 text-amber-600" />;
    case "investment":
      return <Building2 className="h-5 w-5 text-violet-600" />;
    default:
      return <Building2 className="h-5 w-5 text-emerald-600" />;
  }
}

export default function DashboardPage() {
  const accounts = useAccounts();
  const transactions = useTransactions();
  const categories = useCategories();
  const goals = useGoals();
  const viewer = useViewer();
  const { settings } = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [viewFilter, setViewFilter] = useState<AccountViewFilter>("all");

  const userId = viewer?.userId;
  const filteredAccounts = useMemo(
    () => filterAccountsByView(accounts, userId, viewFilter),
    [accounts, userId, viewFilter],
  );
  const filteredTransactions = useMemo(
    () =>
      filterTransactionsByAccountView(
        transactions,
        accounts,
        userId,
        viewFilter,
      ),
    [transactions, accounts, userId, viewFilter],
  );

  const now = new Date();
  const lastMonth = subMonths(now, 1);
  const spend = monthlySpend(filteredTransactions, now);
  const lastMonthSpend = monthlySpend(filteredTransactions, lastMonth);
  const budget = settings?.monthlyBudget ?? 3500;
  const diff = budget - spend;
  const chartData = dailySpendingChart(filteredTransactions, now);
  const cash = netCash(filteredAccounts);
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    const order = [
      "checking",
      "savings",
      "credit",
      "cash",
      "investment",
    ] as const;
    const byType = order.indexOf(a.type) - order.indexOf(b.type);
    if (byType !== 0) return byType;
    return a.name.localeCompare(b.name);
  });
  const recent = filteredTransactions.slice(0, 5);
  const activeGoals = goals.filter((g) => g.status === "active");

  const getCategory = (id: string | null) =>
    categories.find((c) => c.id === id);

  return (
    <MobileShell>
      <div className="animate-fade-up space-y-5">
        <AccountViewFilterChips value={viewFilter} onChange={setViewFilter} />

        {/* Hero spending card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="px-5 pb-2 pt-5">
              <p className="text-sm text-gray-500">Current spend this month</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-gray-900 tabular-nums">
                {formatCurrency(spend)}
              </p>
              <div className="mt-2.5 flex items-center gap-1.5">
                {diff >= 0 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-gray-600">
                      {formatCurrency(diff)} below budget
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700">
                      {formatCurrency(Math.abs(diff))} over budget
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="px-2 pb-1">
              <SpendingChart data={chartData} budget={budget} />
            </div>
            {lastMonthSpend > 0 && (
              <p className="px-5 pb-3 text-xs text-gray-400">
                {spend < lastMonthSpend
                  ? `${formatCurrency(lastMonthSpend - spend)} less than last month`
                  : `${formatCurrency(spend - lastMonthSpend)} more than last month`}
              </p>
            )}
            <Link
              href="/spending"
              className="flex items-center gap-3 border-t border-gray-100 px-5 py-3.5 transition-colors hover:bg-gray-50"
            >
              <Wallet className="h-5 w-5 text-gray-500" />
              <span className="flex-1 text-sm font-medium text-gray-900">
                View Spending
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          </CardContent>
        </Card>

        {/* Accounts */}
        <div>
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-gray-500">
              ACCOUNTS
            </p>
            <Link
              href="/accounts"
              className="text-xs font-medium text-gray-900 underline underline-offset-2"
            >
              Manage
            </Link>
          </div>
          <Card>
            <CardContent className="px-5 py-1">
              {sortedAccounts.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="mb-3 text-sm text-gray-500">No accounts yet</p>
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
                      expandable
                    />
                  ))}
                  <Link href="/net-worth" className="block">
                    <AccountRow
                      icon={<Banknote className="h-5 w-5 text-emerald-600" />}
                      label="Net cash"
                      amount={cash}
                      color="#059669"
                      href
                    />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Goals */}
        <div>
          <p className="mb-2.5 text-[11px] font-semibold tracking-[0.08em] text-gray-500">
            FINANCIAL GOALS
          </p>
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <GoalProgressCard key={goal.id} goal={goal} />
            ))}
            {activeGoals.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-sm text-gray-500">
                  No active goals yet
                </CardContent>
              </Card>
            )}
          </div>
          <Link href="/goals">
            <Button variant="outline" className="mt-3 w-full gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-gray-500">
              RECENT TRANSACTIONS
            </p>
            <Link
              href="/transactions"
              className="text-xs font-medium text-emerald-700"
            >
              See all
            </Link>
          </div>
          <Card>
            <CardContent className="px-5 py-1">
              {recent.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  No transactions yet
                </p>
              ) : (
                recent.map((tx) => {
                  const cat = getCategory(tx.categoryId);
                  return (
                    <TransactionRow
                      key={tx.id}
                      description={tx.description}
                      date={formatShortDate(tx.date)}
                      amount={tx.amount}
                      type={tx.type}
                      ignored={tx.isIgnored}
                      pending={tx.isPending}
                      onClick={() => setEditTx(tx)}
                      icon={
                        cat ? (
                          <CategoryIcon icon={cat.icon} color={cat.color} />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                            <span className="text-lg text-blue-500">?</span>
                          </div>
                        )
                      }
                    />
                  );
                })
              )}
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
      <EditTransactionSheet
        open={!!editTx}
        onClose={() => setEditTx(null)}
        transaction={editTx}
      />
    </MobileShell>
  );
}
