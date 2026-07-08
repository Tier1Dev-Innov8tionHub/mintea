import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  canSeeAccount,
  getVisibleAccountOrThrow,
  listVisibleAccounts,
  normalizeAccount,
} from "./lib/accountAccess";
import {
  requireHouseholdId,
  requireHouseholdIdForQuery,
  touchSync,
} from "./lib/household";
import { transactionDoc, transactionTypeValidator } from "./lib/validators";

export const list = query({
  args: {},
  returns: v.array(transactionDoc),
  handler: async (ctx) => {
    const { userId, householdId } = await requireHouseholdIdForQuery(ctx);
    const visible = await listVisibleAccounts(ctx, householdId, userId);
    const visibleIds = new Set(visible.map((a) => a._id));

    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_household_and_date", (q) => q.eq("householdId", householdId))
      .order("desc")
      .collect();

    return rows
      .filter((t) => visibleIds.has(t.accountId))
      .map((t) => ({
        id: t._id,
        accountId: t.accountId,
        type: t.type,
        amount: t.amount,
        categoryId: t.categoryId,
        description: t.description,
        date: t.date,
        isIgnored: t.isIgnored,
        notes: t.notes,
        isPending: t.isPending,
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
    notes: v.optional(v.string()),
    isPending: v.optional(v.boolean()),
    recurringId: v.optional(v.id("recurring")),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    await getVisibleAccountOrThrow(ctx, args.accountId, householdId, userId);
    if (args.categoryId) {
      const category = await ctx.db.get(args.categoryId);
      if (!category || category.householdId !== householdId) {
        throw new Error("Category not found");
      }
    }
    const notes = args.notes?.trim();
    const id = await ctx.db.insert("transactions", {
      householdId,
      accountId: args.accountId,
      type: args.type,
      amount: args.amount,
      categoryId: args.categoryId,
      description: args.description,
      date: args.date,
      isIgnored: args.isIgnored,
      notes: notes || undefined,
      isPending: args.isPending ?? false,
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
    notes: v.optional(v.union(v.string(), v.null())),
    isPending: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const tx = await ctx.db.get(args.id);
    if (!tx || tx.householdId !== householdId) {
      throw new Error("Transaction not found");
    }

    const currentAccount = await ctx.db.get(tx.accountId);
    if (!currentAccount || currentAccount.householdId !== householdId) {
      throw new Error("Transaction not found");
    }
    const currentNormalized = normalizeAccount(currentAccount, userId);
    if (!canSeeAccount(userId, currentNormalized)) {
      throw new Error("Transaction not found");
    }

    if (args.accountId !== undefined) {
      await getVisibleAccountOrThrow(ctx, args.accountId, householdId, userId);
    }

    const { id, notes, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }
    if (notes !== undefined) {
      const trimmed = notes === null ? "" : notes.trim();
      patch.notes = trimmed || undefined;
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
    const { userId, householdId } = await requireHouseholdId(ctx);
    const tx = await ctx.db.get(args.id);
    if (!tx || tx.householdId !== householdId) {
      throw new Error("Transaction not found");
    }
    const account = await ctx.db.get(tx.accountId);
    if (!account || account.householdId !== householdId) {
      throw new Error("Transaction not found");
    }
    const normalized = normalizeAccount(account, userId);
    if (!canSeeAccount(userId, normalized)) {
      throw new Error("Transaction not found");
    }
    await ctx.db.delete(args.id);
    await touchSync(ctx, householdId);
    return null;
  },
});
