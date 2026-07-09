import { describe, expect, it } from "vitest";
import {
  netCash,
  netWorthBreakdown,
  monthlyRecurringTotal,
  totalBalances,
  accountLabel,
  monthlySpend,
  monthlyIncome,
  spendingByCategory,
  budgetStatus,
  goalProgress,
  dailySpendingChart,
  incomeAllocation,
} from "@/lib/calculations";
import type {
  Account,
  Budget,
  Category,
  Goal,
  Recurring,
  Transaction,
} from "@/lib/db/schema";

function acc(p: Partial<Account> & Pick<Account, "type" | "balance">): Account {
  return {
    id: p.id ?? "a",
    name: p.name ?? "Account",
    type: p.type,
    balance: p.balance,
    color: p.color ?? "#000000",
    last4: p.last4,
    ownerId: p.ownerId ?? "u1",
    purpose: p.purpose ?? "joint",
    visibility: p.visibility ?? "shared",
  };
}

function tx(p: Partial<Transaction> & Pick<Transaction, "amount" | "type">): Transaction {
  return {
    id: p.id ?? "t",
    accountId: p.accountId ?? "a",
    type: p.type,
    amount: p.amount,
    categoryId: p.categoryId ?? null,
    description: p.description ?? "tx",
    date: p.date ?? "2024-06-15",
    isIgnored: p.isIgnored ?? false,
    notes: p.notes,
    isPending: p.isPending,
    recurringId: p.recurringId,
  };
}

const JUNE = new Date(2024, 5, 15);

describe("netCash", () => {
  it("sums assets and subtracts credit liabilities", () => {
    const accounts = [
      acc({ id: "1", type: "checking", balance: 1000 }),
      acc({ id: "2", type: "savings", balance: 500 }),
      acc({ id: "3", type: "cash", balance: 100 }),
      acc({ id: "4", type: "investment", balance: 2000 }),
      acc({ id: "5", type: "credit", balance: 300 }),
    ];
    expect(netCash(accounts)).toBe(1000 + 500 + 100 + 2000 - 300);
  });

  it("returns 0 for no accounts", () => {
    expect(netCash([])).toBe(0);
  });
});

describe("netWorthBreakdown", () => {
  it("separates assets, liabilities, and net worth", () => {
    const accounts = [
      acc({ id: "1", type: "checking", balance: 1000 }),
      acc({ id: "2", type: "credit", balance: 400 }),
    ];
    const b = netWorthBreakdown(accounts);
    expect(b.assets).toBe(1000);
    expect(b.liabilities).toBe(400);
    expect(b.netWorth).toBe(600);
  });

  it("includes a byType row even when total is zero but accounts exist", () => {
    const accounts = [acc({ id: "1", type: "checking", balance: 0 })];
    const b = netWorthBreakdown(accounts);
    expect(b.byType.some((r) => r.type === "checking")).toBe(true);
  });
});

describe("monthlyRecurringTotal", () => {
  it("normalizes frequencies to monthly and ignores inactive", () => {
    const recurring: Recurring[] = [
      { id: "1", name: "Weekly", amount: 12, frequency: "weekly", nextDate: "2024-06-01", categoryId: "c", active: true },
      { id: "2", name: "Monthly", amount: 100, frequency: "monthly", nextDate: "2024-06-01", categoryId: "c", active: true },
      { id: "3", name: "Yearly", amount: 1200, frequency: "yearly", nextDate: "2024-06-01", categoryId: "c", active: true },
      { id: "4", name: "Off", amount: 999, frequency: "monthly", nextDate: "2024-06-01", categoryId: "c", active: false },
    ];
    expect(monthlyRecurringTotal(recurring)).toBeCloseTo(12 * (52 / 12) + 100 + 1200 / 12, 5);
  });
});

describe("totalBalances", () => {
  it("sums every balance as-is", () => {
    expect(
      totalBalances([
        acc({ id: "1", type: "checking", balance: 100 }),
        acc({ id: "2", type: "credit", balance: 50 }),
      ]),
    ).toBe(150);
  });
});

describe("accountLabel", () => {
  it("appends masked last4 when present", () => {
    expect(accountLabel(acc({ type: "checking", balance: 0, name: "Chase", last4: "1234" }))).toBe("Chase •••• 1234");
  });
  it("returns plain name without last4", () => {
    expect(accountLabel(acc({ type: "checking", balance: 0, name: "Chase" }))).toBe("Chase");
  });
});

describe("monthlySpend / monthlyIncome", () => {
  const transactions = [
    tx({ id: "1", type: "expense", amount: 40, date: "2024-06-05" }),
    tx({ id: "2", type: "expense", amount: 60, date: "2024-06-20" }),
    tx({ id: "3", type: "expense", amount: 999, date: "2024-06-10", isIgnored: true }),
    tx({ id: "4", type: "income", amount: 3000, date: "2024-06-01" }),
    tx({ id: "5", type: "expense", amount: 500, date: "2024-05-30" }),
  ];

  it("sums non-ignored expenses within the month", () => {
    expect(monthlySpend(transactions, JUNE)).toBe(100);
  });
  it("sums non-ignored income within the month", () => {
    expect(monthlyIncome(transactions, JUNE)).toBe(3000);
  });
});

describe("spendingByCategory", () => {
  it("aggregates expenses per spending/bills category, sorted desc", () => {
    const categories: Category[] = [
      { id: "food", name: "Food", icon: "x", color: "#1", group: "spending" },
      { id: "bills", name: "Bills", icon: "x", color: "#2", group: "bills" },
      { id: "pay", name: "Salary", icon: "x", color: "#3", group: "income" },
    ];
    const transactions = [
      tx({ id: "1", type: "expense", amount: 30, categoryId: "food", date: "2024-06-02" }),
      tx({ id: "2", type: "expense", amount: 70, categoryId: "bills", date: "2024-06-03" }),
      tx({ id: "3", type: "expense", amount: 10, categoryId: "food", date: "2024-06-04" }),
    ];
    const result = spendingByCategory(transactions, categories, JUNE);
    expect(result.map((r) => [r.category.id, r.spent])).toEqual([
      ["bills", 70],
      ["food", 40],
    ]);
  });
});

describe("budgetStatus", () => {
  it("computes remaining per category for the month", () => {
    const categories: Category[] = [
      { id: "food", name: "Food", icon: "x", color: "#1", group: "spending" },
    ];
    const budgets: Budget[] = [{ id: "b", categoryId: "food", amount: 200, month: "2024-06" }];
    const transactions = [tx({ id: "1", type: "expense", amount: 50, categoryId: "food", date: "2024-06-02" })];
    const [row] = budgetStatus(budgets, transactions, categories, JUNE);
    expect(row.budgeted).toBe(200);
    expect(row.spent).toBe(50);
    expect(row.remaining).toBe(150);
  });
});

describe("goalProgress", () => {
  it("returns percentage capped at 100", () => {
    expect(goalProgress(goal(50, 200))).toBe(25);
    expect(goalProgress(goal(500, 200))).toBe(100);
    expect(goalProgress(goal(10, 0))).toBe(0);
  });
});

function goal(current: number, target: number): Goal {
  return { id: "g", name: "G", icon: "x", targetAmount: target, currentAmount: current, status: "active" };
}

describe("dailySpendingChart", () => {
  it("produces a cumulative series for the month", () => {
    const transactions = [
      tx({ id: "1", type: "expense", amount: 10, date: "2024-06-01" }),
      tx({ id: "2", type: "expense", amount: 20, date: "2024-06-03" }),
    ];
    const chart = dailySpendingChart(transactions, JUNE);
    expect(chart).toHaveLength(30);
    expect(chart[0].cumulative).toBe(10);
    expect(chart[chart.length - 1].cumulative).toBe(30);
  });
});

describe("incomeAllocation", () => {
  it("falls back to actual spend when no budgets and never double-counts", () => {
    const categories: Category[] = [
      { id: "food", name: "Food", icon: "x", color: "#1", group: "spending" },
      { id: "bills", name: "Bills", icon: "x", color: "#2", group: "bills" },
      { id: "sav", name: "Savings", icon: "x", color: "#3", group: "savings" },
    ];
    const transactions = [
      tx({ id: "1", type: "income", amount: 1000, date: "2024-06-01" }),
      tx({ id: "2", type: "expense", amount: 100, categoryId: "food", date: "2024-06-02" }),
      tx({ id: "3", type: "expense", amount: 200, categoryId: "bills", date: "2024-06-03" }),
      tx({ id: "4", type: "expense", amount: 300, categoryId: "sav", date: "2024-06-04" }),
    ];
    const slices = incomeAllocation(transactions, [], JUNE, categories);
    const byLabel = Object.fromEntries(slices.map((s) => [s.label, s.amount]));
    expect(byLabel.Spending).toBe(100);
    expect(byLabel.Bills).toBe(200);
    expect(byLabel.Savings).toBe(300);
    expect(byLabel.Remaining).toBe(400);
  });
});
