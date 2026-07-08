import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireHouseholdId,
  requireHouseholdIdForQuery,
  touchSync,
} from "./lib/household";
import { recurringDoc, recurringFrequencyValidator } from "./lib/validators";

export const list = query({
  args: {},
  returns: v.array(recurringDoc),
  handler: async (ctx) => {
    const { householdId } = await requireHouseholdIdForQuery(ctx);
    const rows = await ctx.db
      .query("recurring")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();
    return rows.map((r) => ({
      id: r._id,
      name: r.name,
      amount: r.amount,
      frequency: r.frequency,
      nextDate: r.nextDate,
      categoryId: r.categoryId,
      active: r.active,
    }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    frequency: recurringFrequencyValidator,
    nextDate: v.string(),
    categoryId: v.id("categories"),
    active: v.boolean(),
  },
  returns: v.id("recurring"),
  handler: async (ctx, args) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const category = await ctx.db.get(args.categoryId);
    if (!category || category.householdId !== householdId) {
      throw new Error("Category not found");
    }
    const id = await ctx.db.insert("recurring", {
      householdId,
      name: args.name,
      amount: args.amount,
      frequency: args.frequency,
      nextDate: args.nextDate,
      categoryId: args.categoryId,
      active: args.active,
      createdBy: userId,
    });
    await touchSync(ctx, householdId);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("recurring"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    frequency: v.optional(recurringFrequencyValidator),
    nextDate: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { householdId } = await requireHouseholdId(ctx);
    const item = await ctx.db.get(args.id);
    if (!item || item.householdId !== householdId) {
      throw new Error("Recurring item not found");
    }
    const { id, ...rest } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(id, patch);
    await touchSync(ctx, householdId);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("recurring") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { householdId } = await requireHouseholdId(ctx);
    const item = await ctx.db.get(args.id);
    if (!item || item.householdId !== householdId) {
      throw new Error("Recurring item not found");
    }
    await ctx.db.delete(args.id);
    await touchSync(ctx, householdId);
    return null;
  },
});
