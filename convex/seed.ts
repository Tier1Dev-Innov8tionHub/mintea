import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireHouseholdId, requireUserId, touchSync } from "./lib/household";

const DEFAULT_CATEGORIES = [
  { name: "Dining & Drinks", icon: "utensils", color: "#3B82F6", group: "spending" as const },
  { name: "Groceries", icon: "shopping-cart", color: "#10B981", group: "spending" as const },
  { name: "Shopping", icon: "shopping-bag", color: "#8B5CF6", group: "spending" as const },
  { name: "Transportation", icon: "car", color: "#F59E0B", group: "spending" as const },
  { name: "Entertainment", icon: "film", color: "#EC4899", group: "spending" as const },
  { name: "Health", icon: "heart-pulse", color: "#EF4444", group: "spending" as const },
  { name: "Bills & Utilities", icon: "home", color: "#6366F1", group: "bills" as const },
  { name: "Subscriptions", icon: "repeat", color: "#14B8A6", group: "bills" as const },
  { name: "Salary", icon: "briefcase", color: "#059669", group: "income" as const },
  { name: "Freelance", icon: "laptop", color: "#0D9488", group: "income" as const },
  { name: "Savings Transfer", icon: "piggy-bank", color: "#059669", group: "savings" as const },
  { name: "Transfer", icon: "arrow-left-right", color: "#9CA3AF", group: "spending" as const },
];

function monthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function subMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

async function clearHouseholdData(
  ctx: MutationCtx,
  householdId: Id<"households">,
): Promise<void> {
  const tables = [
    "transactions",
    "budgets",
    "goals",
    "recurring",
    "accounts",
    "categories",
    "settings",
  ] as const;

  for (const table of tables) {
    const rows = await ctx.db
      .query(table)
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
  }
}

async function seedHouseholdData(
  ctx: MutationCtx,
  householdId: Id<"households">,
  userId: Id<"users">,
): Promise<void> {
  const checkingId = await ctx.db.insert("accounts", {
    householdId,
    name: "Checking",
    type: "checking",
    balance: 5848,
    color: "#059669",
    createdBy: userId,
  });
  await ctx.db.insert("accounts", {
    householdId,
    name: "Savings",
    type: "savings",
    balance: 11714,
    color: "#0D9488",
    createdBy: userId,
  });
  await ctx.db.insert("accounts", {
    householdId,
    name: "Credit Card",
    type: "credit",
    balance: 934,
    color: "#6366F1",
    createdBy: userId,
  });

  const catMap: Record<string, Id<"categories">> = {};
  for (const c of DEFAULT_CATEGORIES) {
    const id = await ctx.db.insert("categories", {
      householdId,
      ...c,
      createdBy: userId,
    });
    catMap[c.name] = id;
  }

  const thisMonth = monthKey();
  const prevMonth = monthKey(subMonths(new Date(), 1));

  const budgetSpecs: Array<{ name: string; amount: number; month: string }> = [
    { name: "Dining & Drinks", amount: 697, month: thisMonth },
    { name: "Groceries", amount: 450, month: thisMonth },
    { name: "Shopping", amount: 300, month: thisMonth },
    { name: "Transportation", amount: 200, month: thisMonth },
    { name: "Entertainment", amount: 150, month: thisMonth },
    { name: "Bills & Utilities", amount: 345, month: thisMonth },
    { name: "Dining & Drinks", amount: 650, month: prevMonth },
    { name: "Groceries", amount: 420, month: prevMonth },
  ];

  for (const b of budgetSpecs) {
    await ctx.db.insert("budgets", {
      householdId,
      categoryId: catMap[b.name]!,
      amount: b.amount,
      month: b.month,
      createdBy: userId,
    });
  }

  await ctx.db.insert("goals", {
    householdId,
    name: "Emergency Fund",
    icon: "umbrella",
    targetAmount: 5000,
    currentAmount: 3200,
    status: "active",
    createdBy: userId,
  });
  await ctx.db.insert("goals", {
    householdId,
    name: "Vacation",
    icon: "palmtree",
    targetAmount: 3000,
    currentAmount: 1166,
    status: "active",
    deadline: "2026-12-01",
    createdBy: userId,
  });
  await ctx.db.insert("goals", {
    householdId,
    name: "New Laptop",
    icon: "laptop",
    targetAmount: 1500,
    currentAmount: 450,
    status: "paused",
    createdBy: userId,
  });

  const today = new Date();
  const recurringSpecs = [
    {
      name: "Spotify",
      amount: 21.31,
      nextDate: formatDate(subDays(today, -17)),
      category: "Subscriptions",
    },
    {
      name: "Chase Credit Card",
      amount: 300,
      nextDate: formatDate(subDays(today, -25)),
      category: "Bills & Utilities",
    },
    {
      name: "Netflix",
      amount: 15.99,
      nextDate: formatDate(subDays(today, -12)),
      category: "Subscriptions",
    },
    {
      name: "Rent",
      amount: 1450,
      nextDate: formatDate(subDays(today, -5)),
      category: "Bills & Utilities",
    },
  ];

  for (const r of recurringSpecs) {
    await ctx.db.insert("recurring", {
      householdId,
      name: r.name,
      amount: r.amount,
      frequency: "monthly",
      nextDate: r.nextDate,
      categoryId: catMap[r.category]!,
      active: true,
      createdBy: userId,
    });
  }

  const txSpecs: Array<{
    type: "income" | "expense" | "transfer";
    amount: number;
    category: string | null;
    description: string;
    daysAgo: number;
    isIgnored?: boolean;
  }> = [
    { type: "income", amount: 4250, category: "Salary", description: "Paycheck", daysAgo: 3 },
    { type: "expense", amount: 87.42, category: "Groceries", description: "Whole Foods", daysAgo: 1 },
    { type: "expense", amount: 42.5, category: "Dining & Drinks", description: "Blue Bottle Coffee", daysAgo: 1 },
    { type: "expense", amount: 156, category: "Shopping", description: "Amazon", daysAgo: 2 },
    { type: "expense", amount: 14.04, category: null, description: "Butler", daysAgo: 5 },
    { type: "expense", amount: 45, category: "Transportation", description: "Uber", daysAgo: 4 },
    { type: "expense", amount: 21.31, category: "Subscriptions", description: "Spotify", daysAgo: 7 },
    { type: "expense", amount: 125, category: "Dining & Drinks", description: "Nobu", daysAgo: 8 },
    { type: "expense", amount: 68.3, category: "Groceries", description: "Trader Joe's", daysAgo: 10 },
    { type: "expense", amount: 200, category: "Entertainment", description: "Concert Tickets", daysAgo: 12 },
    { type: "transfer", amount: 500, category: "Savings Transfer", description: "Transfer to Savings", daysAgo: 3 },
    { type: "income", amount: 850, category: "Freelance", description: "Freelance Project", daysAgo: 15 },
    { type: "expense", amount: 1450, category: "Bills & Utilities", description: "Rent Payment", daysAgo: 5 },
    { type: "expense", amount: 89.99, category: "Health", description: "Gym Membership", daysAgo: 6 },
    { type: "expense", amount: 302, category: "Transfer", description: "Ignored Transfer", daysAgo: 9, isIgnored: true },
  ];

  for (const t of txSpecs) {
    await ctx.db.insert("transactions", {
      householdId,
      accountId: checkingId,
      type: t.type,
      amount: t.amount,
      categoryId: t.category ? catMap[t.category]! : null,
      description: t.description,
      date: formatDate(subDays(today, t.daysAgo)),
      isIgnored: t.isIgnored ?? false,
      createdBy: userId,
    });
  }

  const spendingCats = DEFAULT_CATEGORIES.slice(0, 6).map((c) => catMap[c.name]!);
  const descriptions = ["Target", "Starbucks", "CVS", "Shell Gas", "Chipotle"];
  for (let i = 20; i < 45; i++) {
    await ctx.db.insert("transactions", {
      householdId,
      accountId: checkingId,
      type: "expense",
      amount: Math.round(20 + Math.random() * 80),
      categoryId: spendingCats[i % spendingCats.length]!,
      description: descriptions[i % descriptions.length]!,
      date: formatDate(subDays(today, i)),
      isIgnored: false,
      createdBy: userId,
    });
  }

  await ctx.db.insert("settings", {
    householdId,
    displayName: "",
    monthlyBudget: 3500,
    currency: "USD",
    onboardingComplete: false,
    lastSynced: new Date().toISOString(),
  });
}

/**
 * Ensure the signed-in user belongs to a household.
 * - First user creates + seeds a household.
 * - Second allowlisted user auto-joins the existing household (max 2 members).
 */
export const ensureHousehold = mutation({
  args: {},
  returns: v.id("households"),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      return existing.householdId;
    }

    // Prefer joining an existing household that still has a free seat.
    const households = await ctx.db.query("households").collect();
    for (const household of households) {
      const members = await ctx.db
        .query("householdMembers")
        .withIndex("by_household", (q) => q.eq("householdId", household._id))
        .collect();
      if (members.length < 2) {
        await ctx.db.insert("householdMembers", {
          householdId: household._id,
          userId,
          role: "member",
          joinedAt: Date.now(),
        });
        return household._id;
      }
    }

    const householdId = await ctx.db.insert("households", {
      name: "Our Household",
      createdAt: Date.now(),
    });
    await ctx.db.insert("householdMembers", {
      householdId,
      userId,
      role: "owner",
      joinedAt: Date.now(),
    });
    await seedHouseholdData(ctx, householdId, userId);
    return householdId;
  },
});

/** Wipe household finance data and reseed demo data. */
export const resetDemoData = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    await clearHouseholdData(ctx, householdId);
    await seedHouseholdData(ctx, householdId, userId);
    return null;
  },
});

export const touchLastSynced = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { householdId } = await requireHouseholdId(ctx);
    await touchSync(ctx, householdId);
    return null;
  },
});

/** Internal helper for agent/dev seeding without auth (not exposed to clients). */
export const seedForUser = internalMutation({
  args: { userId: v.id("users") },
  returns: v.id("households"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (existing) return existing.householdId;

    const householdId = await ctx.db.insert("households", {
      name: "Our Household",
      createdAt: Date.now(),
    });
    await ctx.db.insert("householdMembers", {
      householdId,
      userId: args.userId,
      role: "owner",
      joinedAt: Date.now(),
    });
    await seedHouseholdData(ctx, householdId, args.userId);
    return householdId;
  },
});
