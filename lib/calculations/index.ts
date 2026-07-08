import { startOfMonth, endOfMonth, parseISO, isWithinInterval, format, eachDayOfInterval, subMonths } from "date-fns";
import type { Account, Budget, Category, Goal, Recurring, Transaction } from "../db/schema";

export function netCash(accounts: Account[]): number {
  const assets = accounts
    .filter((a) => a.type === "checking" || a.type === "cash" || a.type === "savings")
    .reduce((sum, a) => sum + a.balance, 0);
  const liabilities = accounts
    .filter((a) => a.type === "credit")
    .reduce((sum, a) => sum + a.balance, 0);
  return assets - liabilities;
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

  return monthBudgets.map((b) => {
    const category = categories.find((c) => c.id === b.categoryId)!;
    const spent = spentMap.get(b.categoryId) ?? 0;
    return {
      category,
      budgeted: b.amount,
      spent,
      remaining: b.amount - spent,
    };
  });
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
  month: Date
): { label: string; amount: number; color: string }[] {
  const income = monthlyIncome(transactions, month);
  const spend = monthlySpend(transactions, month);
  const monthKey = format(month, "yyyy-MM");
  const savingsTarget = budgets
    .filter((b) => b.month === monthKey)
    .reduce((sum, b) => sum + b.amount, 0) * 0.1;
  const bills = spend * 0.27;
  return [
    { label: "Spending", amount: spend, color: "#1E40AF" },
    { label: "Savings target", amount: Math.round(savingsTarget), color: "#3B82F6" },
    { label: "Bills & utilities", amount: Math.round(bills), color: "#93C5FD" },
    { label: "Remaining", amount: Math.max(0, income - spend - savingsTarget - bills), color: "#D1FAE5" },
  ].filter((item) => item.amount > 0);
}
