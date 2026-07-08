import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireHouseholdId, touchSync } from "./lib/household";
import { goalDoc, goalStatusValidator } from "./lib/validators";

export const list = query({
  args: {},
  returns: v.array(goalDoc),
  handler: async (ctx) => {
    const { householdId } = await requireHouseholdId(ctx);
    const rows = await ctx.db
      .query("goals")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();
    return rows.map((g) => ({
      id: g._id,
      name: g.name,
      icon: g.icon,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      status: g.status,
      deadline: g.deadline,
    }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    status: goalStatusValidator,
    deadline: v.optional(v.string()),
  },
  returns: v.id("goals"),
  handler: async (ctx, args) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const id = await ctx.db.insert("goals", {
      householdId,
      name: args.name,
      icon: args.icon,
      targetAmount: args.targetAmount,
      currentAmount: args.currentAmount,
      status: args.status,
      deadline: args.deadline,
      createdBy: userId,
    });
    await touchSync(ctx, householdId);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("goals"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    currentAmount: v.optional(v.number()),
    status: v.optional(goalStatusValidator),
    deadline: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { householdId } = await requireHouseholdId(ctx);
    const goal = await ctx.db.get(args.id);
    if (!goal || goal.householdId !== householdId) {
      throw new Error("Goal not found");
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

export const deposit = mutation({
  args: {
    goalId: v.id("goals"),
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { householdId } = await requireHouseholdId(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.householdId !== householdId) {
      throw new Error("Goal not found");
    }
    if (args.amount <= 0) {
      throw new Error("Deposit amount must be positive");
    }
    await ctx.db.patch(args.goalId, {
      currentAmount: goal.currentAmount + args.amount,
    });
    await touchSync(ctx, householdId);
    return null;
  },
});
