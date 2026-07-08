import { startOfMonth, endOfMonth, parseISO, isWithinInterval, format, eachDayOfInterval, subMonths } from "date-fns";
import type { Account, Budget, Category, Goal, Recurring, Transaction } from "../db/schema";

export function netCash(accounts: Account[]): number {
  const assets = accounts
    .filter(
      (a) =>
        a.type === "checking" ||
        a.type === "cash" ||
        a.type === "savings" ||
        a.type === "investment",
    )
    .reduce((sum, a) => sum + a.balance, 0);
  const liabilities = accounts
    .filter((a) => a.type === "credit")
    .reduce((sum, a) => sum + a.balance, 0);
  return assets - liabilities;
}

export function netWorthBreakdown(accounts: Account[]): {
  assets: number;
  liabilities: number;
  netWorth: number;
  byType: Array<{ type: Account["type"]; label: string; total: number }>;
} {
  const assets = accounts
    .filter((a) => a.type !== "credit")
    .reduce((sum, a) => sum + a.balance, 0);
  const liabilities = accounts
    .filter((a) => a.type === "credit")
    .reduce((sum, a) => sum + a.balance, 0);

  const labels: Record<Account["type"], string> = {
    checking: "Checking",
    cash: "Cash",
    savings: "Savings",
    credit: "Credit",
    investment: "Investments",
  };
  const types: Account["type"][] = [
    "checking",
    "cash",
    "savings",
    "investment",
    "credit",
  ];
  const byType = types
    .map((type) => ({
      type,
      label: labels[type],
      total: accounts
        .filter((a) => a.type === type)
        .reduce((sum, a) => sum + a.balance, 0),
    }))
    .filter((row) => row.total !== 0 || accounts.some((a) => a.type === row.type));

  return { assets, liabilities, netWorth: assets - liabilities, byType };
}

/** Normalize recurring amounts to a monthly equivalent. */
export function monthlyRecurringTotal(recurring: Recurring[]): number {
  return recurring
    .filter((r) => r.active)
    .reduce((sum, r) => {
      if (r.frequency === "weekly") return sum + r.amount * (52 / 12);
      if (r.frequency === "yearly") return sum + r.amount / 12;
      return sum + r.amount;
    }, 0);
}

/** Plain sum of every account balance (credit balances counted as-is, like a spreadsheet). */
export function totalBalances(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function accountLabel(account: Account): string {
  return account.last4 ? `${account.name} •••• ${account.last4}` : account.name;
}

export function getTransactionsInMonth(
  transactions: Transaction[],
  month: Date
): Transaction[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  return transactions.filter((t) => {
    const d = parseISO(t.date);
    return isWithinInterval(d, { start, end });
  });
}

export function monthlySpend(transactions: Transaction[], month: Date): number {
  return getTransactionsInMonth(transactions, month)
    .filter((t) => t.type === "expense" && !t.isIgnored)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function monthlyIncome(transactions: Transaction[], month: Date): number {
  return getTransactionsInMonth(transactions, month)
    .filter((t) => t.type === "income" && !t.isIgnored)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function monthlyTransfers(transactions: Transaction[], month: Date): number {
  return getTransactionsInMonth(transactions, month)
    .filter((t) => t.type === "transfer")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function monthlyIgnored(transactions: Transaction[], month: Date): number {
  return getTransactionsInMonth(transactions, month)
    .filter((t) => t.isIgnored)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function spendingByCategory(
  transactions: Transaction[],
  categories: Category[],
  month: Date
): { category: Category; spent: number }[] {
  const monthTx = getTransactionsInMonth(transactions, month).filter(
    (t) => t.type === "expense" && !t.isIgnored && t.categoryId
  );
  const spentMap = new Map<string, number>();
  for (const t of monthTx) {
    if (t.categoryId) {
      spentMap.set(t.categoryId, (spentMap.get(t.categoryId) ?? 0) + t.amount);
    }
  }
  return categories
    .filter((c) => c.group === "spending" || c.group === "bills")
    .map((category) => ({
      category,
      spent: spentMap.get(category.id) ?? 0,
    }))
    .filter((item) => item.spent > 0)
    .sort((a, b) => b.spent - a.spent);
}

export function budgetStatus(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  month: Date
): { category: Category; budgeted: number; spent: number; remaining: number }[] {
  const monthKey = format(month, "yyyy-MM");
  const monthBudgets = budgets.filter((b) => b.month === monthKey);
  const spending = spendingByCategory(transactions, categories, month);
  const spentMap = new Map(spending.map((s) => [s.category.id, s.spent]));
  const budgetMap = new Map(monthBudgets.map((b) => [b.categoryId, b.amount]));

  const categoryIds = new Set<string>([
    ...monthBudgets.map((b) => b.categoryId),
    ...spending.map((s) => s.category.id),
  ]);

  return [...categoryIds]
    .map((id) => {
      const category = categories.find((c) => c.id === id);
      if (!category) return null;
      const spent = spentMap.get(id) ?? 0;
      const budgeted = budgetMap.get(id) ?? 0;
      return {
        category,
        budgeted,
        spent,
        remaining: budgeted - spent,
      };
    })
    .filter(
      (row): row is { category: Category; budgeted: number; spent: number; remaining: number } =>
        row !== null,
    )
    .sort((a, b) => b.spent - a.spent);
}

export function goalProgress(goal: Goal): number {
  if (goal.targetAmount === 0) return 0;
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}

export function recurringUpcoming(recurring: Recurring[], days = 7): Recurring[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);
  return recurring
    .filter((r) => r.active)
    .filter((r) => {
      const d = parseISO(r.nextDate);
      return d >= today && d <= cutoff;
    })
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
}

export function recurringLater(recurring: Recurring[]): Recurring[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekOut = new Date(today);
  weekOut.setDate(weekOut.getDate() + 7);
  return recurring
    .filter((r) => r.active)
    .filter((r) => parseISO(r.nextDate) > weekOut)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
}

export function dailySpendingChart(
  transactions: Transaction[],
  month: Date
): { day: number; amount: number; cumulative: number }[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  let cumulative = 0;
  return days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayAmount = transactions
      .filter((t) => t.date === dayStr && t.type === "expense" && !t.isIgnored)
      .reduce((sum, t) => sum + t.amount, 0);
    cumulative += dayAmount;
    return { day: day.getDate(), amount: dayAmount, cumulative };
  });
}

export function categoryHistory(
  transactions: Transaction[],
  categoryId: string,
  months = 3
): { month: string; spent: number }[] {
  const result: { month: string; spent: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const month = subMonths(new Date(), i);
    const spent = getTransactionsInMonth(transactions, month)
      .filter((t) => t.type === "expense" && t.categoryId === categoryId && !t.isIgnored)
      .reduce((sum, t) => sum + t.amount, 0);
    result.push({ month: format(month, "MMM"), spent });
  }
  return result;
}

export function uncategorizedTransactions(transactions: Transaction[], month: Date): Transaction[] {
  return getTransactionsInMonth(transactions, month).filter(
    (t) => t.type === "expense" && !t.categoryId && !t.isIgnored
  );
}

export function incomeAllocation(
  transactions: Transaction[],
  budgets: Budget[],
  month: Date,
  categories: Category[] = [],
): { label: string; amount: number; color: string }[] {
  const income = monthlyIncome(transactions, month);
  const monthKey = format(month, "yyyy-MM");
  const monthBudgets = budgets.filter((b) => b.month === monthKey);

  const billsCategoryIds = new Set(
    categories.filter((c) => c.group === "bills").map((c) => c.id),
  );
  const savingsCategoryIds = new Set(
    categories.filter((c) => c.group === "savings").map((c) => c.id),
  );

  let billsBudgeted = 0;
  let savingsBudgeted = 0;
  let spendingBudgeted = 0;
  for (const b of monthBudgets) {
    if (billsCategoryIds.has(b.categoryId)) billsBudgeted += b.amount;
    else if (savingsCategoryIds.has(b.categoryId)) savingsBudgeted += b.amount;
    else spendingBudgeted += b.amount;
  }

  // Partition actual expenses so fallbacks never double-count across slices.
  let billsSpent = 0;
  let savingsSpent = 0;
  let spendingSpent = 0;
  for (const t of getTransactionsInMonth(transactions, month)) {
    if (t.type !== "expense" || t.isIgnored) continue;
    if (t.categoryId && billsCategoryIds.has(t.categoryId)) {
      billsSpent += t.amount;
    } else if (t.categoryId && savingsCategoryIds.has(t.categoryId)) {
      savingsSpent += t.amount;
    } else {
      spendingSpent += t.amount;
    }
  }

  // Prefer budget rows; fall back to that group's actual spend only.
  const spendingAmount = spendingBudgeted > 0 ? spendingBudgeted : spendingSpent;
  const billsAmount = billsBudgeted > 0 ? billsBudgeted : billsSpent;
  const savingsAmount = savingsBudgeted > 0 ? savingsBudgeted : savingsSpent;

  const allocated = spendingAmount + billsAmount + savingsAmount;
  const remaining = Math.max(0, (income || allocated) - allocated);

  return [
    { label: "Spending", amount: spendingAmount, color: "#1E40AF" },
    { label: "Bills", amount: billsAmount, color: "#93C5FD" },
    { label: "Savings", amount: savingsAmount, color: "#3B82F6" },
    { label: "Remaining", amount: remaining, color: "#D1FAE5" },
  ].filter((item) => item.amount > 0);
}
