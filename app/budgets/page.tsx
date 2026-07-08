"use client";

import { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/modal";
import { BudgetDonut, SimpleBarChart } from "@/components/charts";
import { CategoryIcon } from "@/components/icons/category-icon";
import { useTransactions, useCategories, useBudgets, useFinanceMutations } from "@/lib/db/hooks";
import { budgetStatus, categoryHistory, incomeAllocation, monthlyIncome } from "@/lib/calculations";
import { formatCurrency, getMonthKey } from "@/lib/format";
import { addMonths, subMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { Category } from "@/lib/db/schema";

export default function BudgetsPage() {
  const transactions = useTransactions();
  const categories = useCategories();
  const budgets = useBudgets();
  const { upsertBudget } = useFinanceMutations();
  const [month, setMonth] = useState(new Date());
  const [editCategory, setEditCategory] = useState<(Category & { budgeted: number; spent: number }) | null>(null);
  const [editAmount, setEditAmount] = useState(0);

  const monthKey = getMonthKey(month);
  const status = budgetStatus(budgets, transactions, categories, month);
  const income = monthlyIncome(transactions, month);
  const allocation = incomeAllocation(transactions, budgets, month);
  const totalBudgeted = status.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = status.reduce((s, b) => s + b.spent, 0);

  const openEdit = (item: typeof status[0]) => {
    setEditCategory({ ...item.category, budgeted: item.budgeted, spent: item.spent });
    setEditAmount(item.budgeted);
  };

  const handleSaveBudget = async () => {
    if (!editCategory) return;
    await upsertBudget(editCategory.id, monthKey, editAmount);
    setEditCategory(null);
  };

  const history = editCategory
    ? categoryHistory(transactions, editCategory.id)
    : [];

  return (
    <MobileShell title="Budgets">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setMonth(subMonths(month, 1))} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold">{format(month, "MMMM yyyy")}</span>
          <button onClick={() => setMonth(addMonths(month, 1))} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Overview */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-around">
              <BudgetDonut data={allocation} total={income || totalSpent} size={160} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {allocation.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-semibold">{formatCurrency(item.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Budgeted</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalBudgeted)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Spent</p>
              <p className="text-xl font-bold">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Category budgets */}
        <div>
          <p className="text-xs font-semibold text-gray-500 tracking-wider mb-2">CATEGORIES</p>
          <div className="space-y-2">
            {status.map((item) => {
              const pct = item.budgeted > 0 ? (item.spent / item.budgeted) * 100 : 0;
              const over = item.spent > item.budgeted;
              return (
                <button key={item.category.id} onClick={() => openEdit(item)} className="w-full text-left">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CategoryIcon icon={item.category.icon} color={item.category.color} />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{item.category.name}</span>
                            <span className={`text-sm font-semibold ${over ? "text-red-500" : ""}`}>
                              {formatCurrency(item.spent)} / {formatCurrency(item.budgeted)}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(100, pct)}
                            barClassName={over ? "bg-red-400" : "bg-emerald-500"}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {over
                              ? `${formatCurrency(item.spent - item.budgeted)} over budget`
                              : `${formatCurrency(item.remaining)} remaining`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Sheet
        open={!!editCategory}
        onClose={() => setEditCategory(null)}
        title={editCategory?.name}
      >
        {editCategory && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setEditAmount(Math.max(0, editAmount - 25))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600 border-b-2 border-blue-400 pb-1">
                  {formatCurrency(editAmount)}
                </p>
              </div>
              <button
                onClick={() => setEditAmount(editAmount + 25)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm border-y border-gray-100 py-3">
              <div>
                <p className="text-gray-500 text-xs">Budgeted</p>
                <p className="font-semibold">{formatCurrency(editAmount)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Spent</p>
                <p className="font-semibold">{formatCurrency(editCategory.spent)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Remaining</p>
                <p className="font-semibold">{formatCurrency(editAmount - editCategory.spent)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2 text-center">Last 3 months</p>
              <SimpleBarChart data={history} budget={editAmount} />
            </div>

            <Button onClick={handleSaveBudget} className="w-full">Save Budget</Button>
          </div>
        )}
      </Sheet>
    </MobileShell>
  );
}
