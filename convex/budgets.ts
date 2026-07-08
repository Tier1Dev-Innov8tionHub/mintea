import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireHouseholdId,
  requireHouseholdIdForQuery,
  touchSync,
} from "./lib/household";
import { budgetDoc } from "./lib/validators";

export const list = query({
  args: {},
  returns: v.array(budgetDoc),
  handler: async (ctx) => {
    const { householdId } = await requireHouseholdIdForQuery(ctx);
    const rows = await ctx.db
      .query("budgets")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();
    return rows.map((b) => ({
      id: b._id,
      categoryId: b.categoryId,
      amount: b.amount,
      month: b.month,
    }));
  },
});

export const updateAmount = mutation({
  args: {
    id: v.id("budgets"),
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { householdId } = await requireHouseholdId(ctx);
    const budget = await ctx.db.get(args.id);
    if (!budget || budget.householdId !== householdId) {
      throw new Error("Budget not found");
    }
    await ctx.db.patch(args.id, { amount: args.amount });
    await touchSync(ctx, householdId);
    return null;
  },
});

export const upsert = mutation({
  args: {
    categoryId: v.id("categories"),
    month: v.string(),
    amount: v.number(),
  },
  returns: v.id("budgets"),
  handler: async (ctx, args) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const category = await ctx.db.get(args.categoryId);
    if (!category || category.householdId !== householdId) {
      throw new Error("Category not found");
    }

    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_household_category_month", (q) =>
        q
          .eq("householdId", householdId)
          .eq("categoryId", args.categoryId)
          .eq("month", args.month),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { amount: args.amount });
      await touchSync(ctx, householdId);
      return existing._id;
    }

    const id = await ctx.db.insert("budgets", {
      householdId,
      categoryId: args.categoryId,
      month: args.month,
      amount: args.amount,
      createdBy: userId,
    });
    await touchSync(ctx, householdId);
    return id;
  },
});
