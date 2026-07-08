import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireHouseholdId, touchSync } from "./lib/household";
import { transactionDoc, transactionTypeValidator } from "./lib/validators";

export const list = query({
  args: {},
  returns: v.array(transactionDoc),
  handler: async (ctx) => {
    const { householdId } = await requireHouseholdId(ctx);
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_household_and_date", (q) => q.eq("householdId", householdId))
      .order("desc")
      .collect();
    return rows.map((t) => ({
      id: t._id,
      accountId: t.accountId,
      type: t.type,
      amount: t.amount,
      categoryId: t.categoryId,
      description: t.description,
      date: t.date,
      isIgnored: t.isIgnored,
      recurringId: t.recurringId,
    }));
  },
});

export const create = mutation({
  args: {
    accountId: v.id("accounts"),
    type: transactionTypeValidator,
    amount: v.number(),
    categoryId: v.union(v.id("categories"), v.null()),
    description: v.string(),
    date: v.string(),
    isIgnored: v.boolean(),
    recurringId: v.optional(v.id("recurring")),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const account = await ctx.db.get(args.accountId);
    if (!account || account.householdId !== householdId) {
      throw new Error("Account not found");
    }
    if (args.categoryId) {
      const category = await ctx.db.get(args.categoryId);
      if (!category || category.householdId !== householdId) {
        throw new Error("Category not found");
      }
    }
    const id = await ctx.db.insert("transactions", {
      householdId,
      accountId: args.accountId,
      type: args.type,
      amount: args.amount,
      categoryId: args.categoryId,
      description: args.description,
      date: args.date,
      isIgnored: args.isIgnored,
      recurringId: args.recurringId,
      createdBy: userId,
    });
    await touchSync(ctx, householdId);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    accountId: v.optional(v.id("accounts")),
    type: v.optional(transactionTypeValidator),
    amount: v.optional(v.number()),
    categoryId: v.optional(v.union(v.id("categories"), v.null())),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    isIgnored: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { householdId } = await requireHouseholdId(ctx);
    const tx = await ctx.db.get(args.id);
    if (!tx || tx.householdId !== householdId) {
      throw new Error("Transaction not found");
    }
    const { id, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(id, patch);
    await touchSync(ctx, householdId);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { householdId } = await requireHouseholdId(ctx);
    const tx = await ctx.db.get(args.id);
    if (!tx || tx.householdId !== householdId) {
      throw new Error("Transaction not found");
    }
    await ctx.db.delete(args.id);
    await touchSync(ctx, householdId);
    return null;
  },
});
