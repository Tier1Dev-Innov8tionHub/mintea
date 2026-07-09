"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/modal";
import { CategoryIcon } from "@/components/icons/category-icon";
import { TransactionRow } from "@/components/dashboard/cards";
import { AccountViewFilterChips } from "@/components/accounts/view-filter-chips";
import { EditTransactionSheet } from "@/components/transactions/edit-transaction-sheet";
import {
  useAccounts,
  useTransactions,
  useCategories,
  useBudgets,
  useFinanceMutations,
  useViewer,
} from "@/lib/db/hooks";
import { filterTransactionsByAccountView } from "@/lib/account-view";
import {
  monthlySpend,
  spendingByCategory,
  uncategorizedTransactions,
  monthlyTransfers,
  monthlyIgnored,
  budgetStatus,
} from "@/lib/calculations";
import { formatCurrency, formatMonthYear, getMonthKey } from "@/lib/format";
import { Money } from "@/components/ui/money";
import { addMonths, subMonths } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { AccountViewFilter, Transaction } from "@/lib/db/schema";

export default function SpendingPage() {
  const accounts = useAccounts();
  const transactions = useTransactions();
  const categories = useCategories();
  const budgets = useBudgets();
  const viewer = useViewer();
  const { updateTransaction } = useFinanceMutations();
  const [month, setMonth] = useState(new Date());
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [viewFilter, setViewFilter] = useState<AccountViewFilter>("all");

  const filteredTransactions = useMemo(
    () =>
      filterTransactionsByAccountView(
        transactions,
        accounts,
        viewer?.userId,
        viewFilter,
      ),
    [transactions, accounts, viewer?.userId, viewFilter],
  );

  const spend = monthlySpend(filteredTransactions, month);
  const lastMonthSpend = monthlySpend(
    filteredTransactions,
    subMonths(month, 1),
  );
  const diff = spend - lastMonthSpend;
  const byCategory = spendingByCategory(
    filteredTransactions,
    categories,
    month,
  );
  const uncategorized = uncategorizedTransactions(filteredTransactions, month);
  const transfers = monthlyTransfers(filteredTransactions, month);
  const ignored = monthlyIgnored(filteredTransactions, month);
  const status = budgetStatus(
    budgets,
    filteredTransactions,
    categories,
    month,
  );
  const budgetMap = new Map(
    status.filter((s) => s.budgeted > 0).map((s) => [s.category.id, s]),
  );
  const totalBudgeted = status.reduce((sum, s) => sum + s.budgeted, 0);
  const monthKey = getMonthKey(month);

  const handleCategorize = async (txId: string, categoryId: string) => {
    await updateTransaction(txId, { categoryId });
  };

  return (
    <MobileShell title="Spending">
      <div className="space-y-4">
        <AccountViewFilterChips value={viewFilter} onChange={setViewFilter} />

        <div className="flex items-center justify-between">
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold">{formatMonthYear(month)}</span>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total spent</p>
                <p data-sensitive className="text-3xl font-bold">
                  {formatCurrency(spend)}
                </p>
              </div>
              {totalBudgeted > 0 && (
                <Link
                  href="/budgets"
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                >
                  <Money value={totalBudgeted} /> budgeted
                </Link>
              )}
            </div>
            {lastMonthSpend > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                {diff <= 0 ? (
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                )}
                <span
                  className={`text-sm font-medium ${diff <= 0 ? "text-emerald-600" : "text-amber-600"}`}
                >
                  <Money value={Math.abs(diff)} />{" "}
                  {diff <= 0 ? "less" : "more"} than last month
                </span>
              </div>
            )}
            {totalBudgeted > 0 && (
              <div className="mt-3">
                <Progress
                  value={Math.min(100, (spend / totalBudgeted) * 100)}
                  barClassName={
                    spend > totalBudgeted ? "bg-red-400" : "bg-emerald-500"
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  {spend > totalBudgeted ? (
                    <>
                      <Money value={spend - totalBudgeted} /> over category
                      budgets
                    </>
                  ) : (
                    <>
                      <Money value={totalBudgeted - spend} /> under category
                      budgets
                    </>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {byCategory.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wider text-gray-500">
                BY CATEGORY
              </p>
              <Link
                href="/budgets"
                className="text-xs font-medium text-emerald-600"
              >
                Budgets
              </Link>
            </div>
            <Card>
              <CardContent className="space-y-3 p-4">
                {byCategory.map(({ category, spent }) => {
                  const budget = budgetMap.get(category.id);
                  const pct = budget
                    ? (spent / budget.budgeted) * 100
                    : spend > 0
                      ? (spent / spend) * 100
                      : 0;
                  const over = budget ? spent > budget.budgeted : false;
                  return (
                    <div key={category.id} className="flex items-center gap-3">
                      <CategoryIcon
                        icon={category.icon}
                        color={category.color}
                      />
                      <div className="flex-1">
                        <div className="mb-1 flex justify-between">
                          <span className="text-sm font-medium">
                            {category.name}
                          </span>
                          <span
                            data-sensitive
                            className={`text-sm font-semibold ${over ? "text-red-500" : ""}`}
                          >
                            {budget
                              ? `${formatCurrency(spent)} / ${formatCurrency(budget.budgeted)}`
                              : formatCurrency(spent)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(100, pct)}
                          barClassName={
                            over
                              ? "bg-red-400"
                              : budget
                                ? "bg-emerald-500"
                                : "bg-blue-400"
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {uncategorized.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500">
              NEEDS CATEGORIZATION
            </p>
            <Card>
              <CardContent className="p-4">
                <p className="mb-3 text-sm text-gray-500">
                  Tap a category below to categorize this transaction.
                </p>
                {uncategorized.map((tx) => (
                  <div key={tx.id} className="mb-4 last:mb-0">
                    <TransactionRow
                      description={tx.description}
                      date={tx.date}
                      amount={tx.amount}
                      type="expense"
                      ignored={tx.isIgnored}
                      pending={tx.isPending}
                      onClick={() => setEditTx(tx)}
                    />
                    <div className="mt-2 flex flex-wrap gap-2 pl-13">
                      {categories
                        .filter((c) => c.group === "spending")
                        .slice(0, 6)
                        .map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategorize(tx.id, cat.id)}
                            className="rounded-full p-1.5 transition-all hover:ring-2 hover:ring-emerald-400"
                          >
                            <CategoryIcon
                              icon={cat.icon}
                              color={cat.color}
                              size={16}
                            />
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500">
            NON-SPENDING
          </p>
          <Card>
            <CardContent className="divide-y divide-gray-100 p-4">
              {[
                { label: "Transfers", amount: transfers, icon: "↔" },
                { label: "Ignored", amount: ignored, icon: "−" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span data-sensitive className="font-semibold">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {totalBudgeted === 0 && (
          <Link href="/budgets">
            <Card className="border-dashed">
              <CardContent className="p-4 text-center text-sm text-gray-500">
                Set category budgets for {monthKey} to track progress here
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      <EditTransactionSheet
        open={!!editTx}
        onClose={() => setEditTx(null)}
        transaction={editTx}
      />
    </MobileShell>
  );
}
