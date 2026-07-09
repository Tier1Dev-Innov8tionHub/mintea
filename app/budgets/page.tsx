"use client";

import { useState } from "react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/modal";
import { BudgetDonut, SimpleBarChart } from "@/components/charts";
import { CategoryIcon } from "@/components/icons/category-icon";
import {
  useTransactions,
  useCategories,
  useBudgets,
  useFinanceMutations,
} from "@/lib/db/hooks";
import {
  budgetStatus,
  categoryHistory,
  incomeAllocation,
  monthlyIncome,
} from "@/lib/calculations";
import { formatCurrency, getMonthKey } from "@/lib/format";
import { Money } from "@/components/ui/money";
import { addMonths, subMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { Category } from "@/lib/db/schema";

export default function BudgetsPage() {
  const transactions = useTransactions();
  const categories = useCategories();
  const budgets = useBudgets();
  const { upsertBudget } = useFinanceMutations();
  const [month, setMonth] = useState(new Date());
  const [editCategory, setEditCategory] = useState<
    (Category & { budgeted: number; spent: number }) | null
  >(null);
  const [editAmount, setEditAmount] = useState(0);

  const monthKey = getMonthKey(month);
  const status = budgetStatus(budgets, transactions, categories, month);
  const income = monthlyIncome(transactions, month);
  const allocation = incomeAllocation(
    transactions,
    budgets,
    month,
    categories,
  );
  const totalBudgeted = status.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = status.reduce((s, b) => s + b.spent, 0);
  const budgetedRows = status.filter((s) => s.budgeted > 0);
  const unbudgetedRows = status.filter((s) => s.budgeted === 0 && s.spent > 0);
  const unusedCategories = categories.filter(
    (c) =>
      (c.group === "spending" || c.group === "bills" || c.group === "savings") &&
      !status.some((s) => s.category.id === c.id),
  );

  const openEdit = (item: {
    category: Category;
    budgeted: number;
    spent: number;
  }) => {
    setEditCategory({
      ...item.category,
      budgeted: item.budgeted,
      spent: item.spent,
    });
    setEditAmount(item.budgeted || Math.ceil(item.spent / 25) * 25 || 100);
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
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold">{format(month, "MMMM yyyy")}</span>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-around">
              <BudgetDonut
                data={allocation}
                total={income || totalBudgeted || totalSpent}
                size={160}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {allocation.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p data-sensitive className="text-sm font-semibold">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Budgeted</p>
              <p data-sensitive className="text-xl font-bold text-emerald-600">
                {formatCurrency(totalBudgeted)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Spent</p>
              <p data-sensitive className="text-xl font-bold">
                {formatCurrency(totalSpent)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500">
            CATEGORIES
          </p>
          <div className="space-y-2">
            {budgetedRows.map((item) => {
              const pct =
                item.budgeted > 0 ? (item.spent / item.budgeted) * 100 : 0;
              const over = item.spent > item.budgeted;
              return (
                <button
                  key={item.category.id}
                  onClick={() => openEdit(item)}
                  className="w-full text-left"
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CategoryIcon
                          icon={item.category.icon}
                          color={item.category.color}
                        />
                        <div className="flex-1">
                          <div className="mb-1 flex justify-between">
                            <span className="font-medium">
                              {item.category.name}
                            </span>
                            <span
                              data-sensitive
                              className={`text-sm font-semibold ${over ? "text-red-500" : ""}`}
                            >
                              {formatCurrency(item.spent)} /{" "}
                              {formatCurrency(item.budgeted)}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(100, pct)}
                            barClassName={
                              over ? "bg-red-400" : "bg-emerald-500"
                            }
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {over ? (
                              <>
                                <Money value={item.spent - item.budgeted} /> over
                                budget
                              </>
                            ) : (
                              <>
                                <Money value={item.remaining} /> remaining
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
            {budgetedRows.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-sm text-gray-500">
                  No budgets set for this month yet.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {(unbudgetedRows.length > 0 || unusedCategories.length > 0) && (
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500">
              SET A BUDGET
            </p>
            <div className="space-y-2">
              {unbudgetedRows.map((item) => (
                <button
                  key={item.category.id}
                  onClick={() => openEdit(item)}
                  className="w-full text-left"
                >
                  <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                      <CategoryIcon
                        icon={item.category.icon}
                        color={item.category.color}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.category.name}</p>
                        <p className="text-xs text-gray-500">
                          Spent <Money value={item.spent} /> · no budget
                        </p>
                      </div>
                      <span className="text-xs font-medium text-emerald-600">
                        Add
                      </span>
                    </CardContent>
                  </Card>
                </button>
              ))}
              {unusedCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() =>
                    openEdit({ category, budgeted: 0, spent: 0 })
                  }
                  className="w-full text-left"
                >
                  <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                      <CategoryIcon
                        icon={category.icon}
                        color={category.color}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-gray-500">No spend yet</p>
                      </div>
                      <span className="text-xs font-medium text-emerald-600">
                        Add
                      </span>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        )}

        <Link href="/spending">
          <Button variant="outline" className="w-full">
            View spending breakdown
          </Button>
        </Link>
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
                <p className="border-b-2 border-blue-400 pb-1 text-4xl font-bold text-blue-600">
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

            <div className="grid grid-cols-3 gap-2 border-y border-gray-100 py-3 text-center text-sm">
              <div>
                <p className="text-xs text-gray-500">Budgeted</p>
                <p className="font-semibold">{formatCurrency(editAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Spent</p>
                <p className="font-semibold">
                  {formatCurrency(editCategory.spent)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Remaining</p>
                <p className="font-semibold">
                  {formatCurrency(editAmount - editCategory.spent)}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-center text-sm text-gray-500">
                Last 3 months
              </p>
              <SimpleBarChart data={history} budget={editAmount} />
            </div>

            <Button onClick={handleSaveBudget} className="w-full">
              Save Budget
            </Button>
          </div>
        )}
      </Sheet>
    </MobileShell>
  );
}
