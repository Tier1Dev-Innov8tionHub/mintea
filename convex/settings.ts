import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireHouseholdId } from "./lib/household";
import { settingsDoc } from "./lib/validators";

export const get = query({
  args: {},
  returns: v.union(settingsDoc, v.null()),
  handler: async (ctx) => {
    const { householdId } = await requireHouseholdId(ctx);
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .unique();
    if (!settings) return null;
    return {
      id: "default" as const,
      displayName: settings.displayName,
      monthlyBudget: settings.monthlyBudget,
      currency: settings.currency,
      onboardingComplete: settings.onboardingComplete,
      lastSynced: settings.lastSynced,
    };
  },
});

export const update = mutation({
  args: {
    displayName: v.optional(v.string()),
    monthlyBudget: v.optional(v.number()),
    currency: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { householdId } = await requireHouseholdId(ctx);
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .unique();
    if (!settings) {
      throw new Error("Settings not found");
    }
    const patch: Record<string, unknown> = {
      lastSynced: new Date().toISOString(),
    };
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(settings._id, patch);
    return null;
  },
});
