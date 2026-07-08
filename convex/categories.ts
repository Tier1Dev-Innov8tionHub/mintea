import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireHouseholdIdForQuery } from "./lib/household";
import { categoryDoc } from "./lib/validators";

export const list = query({
  args: {},
  returns: v.array(categoryDoc),
  handler: async (ctx) => {
    const { householdId } = await requireHouseholdIdForQuery(ctx);
    const rows = await ctx.db
      .query("categories")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();
    return rows.map((c) => ({
      id: c._id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      group: c.group,
    }));
  },
});
