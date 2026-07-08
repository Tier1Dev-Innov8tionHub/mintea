"use client";

import { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/modal";
import { CategoryIcon } from "@/components/icons/category-icon";
import { TransactionRow } from "@/components/dashboard/cards";
import { useTransactions, useCategories } from "@/lib/db/hooks";
import {
  monthlySpend,
  spendingByCategory,
  uncategorizedTransactions,
  monthlyTransfers,
  monthlyIgnored,
} from "@/lib/calculations";
import { formatCurrency, formatMonthYear } from "@/lib/format";
import { addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { updateTransaction } from "@/lib/db/hooks";

export default function SpendingPage() {
  const transactions = useTransactions();
  const categories = useCategories();
  const [month, setMonth] = useState(new Date());

  const spend = monthlySpend(transactions, month);
  const lastMonthSpend = monthlySpend(transactions, subMonths(month, 1));
  const diff = spend - lastMonthSpend;
  const byCategory = spendingByCategory(transactions, categories, month);
  const uncategorized = uncategorizedTransactions(transactions, month);
  const transfers = monthlyTransfers(transactions, month);
  const ignored = monthlyIgnored(transactions, month);

  const handleCategorize = async (txId: string, categoryId: string) => {
    await updateTransaction(txId, { categoryId });
  };

  return (
    <MobileShell title="Spending">
      <div className="space-y-4">
        {/* Month selector */}
        <div className="flex items-center justify-between">
          <button onClick={() => setMonth(subMonths(month, 1))} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold">{formatMonthYear(month)}</span>
          <button onClick={() => setMonth(addMonths(month, 1))} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Summary */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total spent</p>
            <p className="text-3xl font-bold">{formatCurrency(spend)}</p>
            {lastMonthSpend > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                {diff <= 0 ? (
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                )}
                <span className={`text-sm font-medium ${diff <= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {formatCurrency(Math.abs(diff))} {diff <= 0 ? "less" : "more"} than last month
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider mb-2">BY CATEGORY</p>
            <Card>
              <CardContent className="p-4 space-y-3">
                {byCategory.map(({ category, spent }) => (
                  <div key={category.id} className="flex items-center gap-3">
                    <CategoryIcon icon={category.icon} color={category.color} />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-sm font-semibold">{formatCurrency(spent)}</span>
                      </div>
                      <Progress value={(spent / spend) * 100} barClassName="bg-blue-400" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Needs categorization */}
        {uncategorized.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider mb-2">NEEDS CATEGORIZATION</p>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-3">
                  Tap a category below to categorize this transaction.
                </p>
                {uncategorized.map((tx) => (
                  <div key={tx.id} className="mb-4 last:mb-0">
                    <TransactionRow
                      description={tx.description}
                      date={tx.date}
                      amount={tx.amount}
                      type="expense"
                    />
                    <div className="flex flex-wrap gap-2 mt-2 pl-13">
                      {categories
                        .filter((c) => c.group === "spending")
                        .slice(0, 6)
                        .map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategorize(tx.id, cat.id)}
                            className="rounded-full p-1.5 hover:ring-2 hover:ring-emerald-400 transition-all"
                          >
                            <CategoryIcon icon={cat.icon} color={cat.color} size={16} />
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Non-spending */}
        <div>
          <p className="text-xs font-semibold text-gray-500 tracking-wider mb-2">NON-SPENDING</p>
          <Card>
            <CardContent className="p-4 divide-y divide-gray-100">
              {[
                { label: "Transfers", amount: transfers, icon: "↔" },
                { label: "Ignored", amount: ignored, icon: "−" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileShell>
  );
}
