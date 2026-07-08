import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireHouseholdId, touchSync } from "./lib/household";
import { accountDoc, accountTypeValidator } from "./lib/validators";

export const list = query({
  args: {},
  returns: v.array(accountDoc),
  handler: async (ctx) => {
    const { householdId } = await requireHouseholdId(ctx);
    const rows = await ctx.db
      .query("accounts")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();
    return rows.map((a) => ({
      id: a._id,
      name: a.name,
      type: a.type,
      balance: a.balance,
      color: a.color,
    }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: accountTypeValidator,
    balance: v.number(),
    color: v.string(),
  },
  returns: v.id("accounts"),
  handler: async (ctx, args) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const id = await ctx.db.insert("accounts", {
      householdId,
      name: args.name,
      type: args.type,
      balance: args.balance,
      color: args.color,
      createdBy: userId,
    });
    await touchSync(ctx, householdId);
    return id;
  },
});
