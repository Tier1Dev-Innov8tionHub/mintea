import { v } from "convex/values";

export const accountTypeValidator = v.union(
  v.literal("checking"),
  v.literal("savings"),
  v.literal("credit"),
  v.literal("cash"),
);

export const transactionTypeValidator = v.union(
  v.literal("income"),
  v.literal("expense"),
  v.literal("transfer"),
);

export const categoryGroupValidator = v.union(
  v.literal("spending"),
  v.literal("income"),
  v.literal("bills"),
  v.literal("savings"),
);

export const goalStatusValidator = v.union(
  v.literal("active"),
  v.literal("paused"),
);

export const recurringFrequencyValidator = v.union(
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("yearly"),
);

/** Client-facing shape: Convex `_id` exposed as `id` for UI compatibility. */
export const accountDoc = v.object({
  id: v.id("accounts"),
  name: v.string(),
  type: accountTypeValidator,
  balance: v.number(),
  color: v.string(),
});

export const categoryDoc = v.object({
  id: v.id("categories"),
  name: v.string(),
  icon: v.string(),
  color: v.string(),
  group: categoryGroupValidator,
});

export const transactionDoc = v.object({
  id: v.id("transactions"),
  accountId: v.id("accounts"),
  type: transactionTypeValidator,
  amount: v.number(),
  categoryId: v.union(v.id("categories"), v.null()),
  description: v.string(),
  date: v.string(),
  isIgnored: v.boolean(),
  recurringId: v.optional(v.id("recurring")),
});

export const budgetDoc = v.object({
  id: v.id("budgets"),
  categoryId: v.id("categories"),
  amount: v.number(),
  month: v.string(),
});

export const goalDoc = v.object({
  id: v.id("goals"),
  name: v.string(),
  icon: v.string(),
  targetAmount: v.number(),
  currentAmount: v.number(),
  status: goalStatusValidator,
  deadline: v.optional(v.string()),
});

export const recurringDoc = v.object({
  id: v.id("recurring"),
  name: v.string(),
  amount: v.number(),
  frequency: recurringFrequencyValidator,
  nextDate: v.string(),
  categoryId: v.id("categories"),
  active: v.boolean(),
});

export const settingsDoc = v.object({
  id: v.literal("default"),
  displayName: v.string(),
  monthlyBudget: v.number(),
  currency: v.string(),
  onboardingComplete: v.boolean(),
  lastSynced: v.string(),
});
