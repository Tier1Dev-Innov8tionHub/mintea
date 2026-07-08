import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { listVisibleAccounts } from "./lib/accountAccess";
import {
  requireHouseholdId,
  requireHouseholdIdForQuery,
  touchSync,
} from "./lib/household";
import { balanceSnapshotDoc } from "./lib/validators";

function computeTotals(
  accounts: Array<{ type: string; balance: number }>,
): { totalAssets: number; totalLiabilities: number; netWorth: number } {
  let totalAssets = 0;
  let totalLiabilities = 0;
  for (const a of accounts) {
    if (a.type === "credit") {
      totalLiabilities += a.balance;
    } else {
      totalAssets += a.balance;
    }
  }
  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}

export const list = query({
  args: {},
  returns: v.array(balanceSnapshotDoc),
  handler: async (ctx) => {
    const { householdId } = await requireHouseholdIdForQuery(ctx);
    const rows = await ctx.db
      .query("balanceSnapshots")
      .withIndex("by_household_and_date", (q) => q.eq("householdId", householdId))
      .order("asc")
      .collect();
    return rows.map((r) => ({
      id: r._id,
      date: r.date,
      netWorth: r.netWorth,
      totalAssets: r.totalAssets,
      totalLiabilities: r.totalLiabilities,
    }));
  },
});

/** Capture today's balances as a snapshot (upserts same-day). */
export const capture = mutation({
  args: {},
  returns: v.id("balanceSnapshots"),
  handler: async (ctx) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const accounts = await listVisibleAccounts(ctx, householdId, userId);
    const totals = computeTotals(accounts);
    const date = new Date().toISOString().slice(0, 10);

    const existing = await ctx.db
      .query("balanceSnapshots")
      .withIndex("by_household_and_date", (q) =>
        q.eq("householdId", householdId).eq("date", date),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        netWorth: totals.netWorth,
        totalAssets: totals.totalAssets,
        totalLiabilities: totals.totalLiabilities,
      });
      await touchSync(ctx, householdId);
      return existing._id;
    }

    const id = await ctx.db.insert("balanceSnapshots", {
      householdId,
      date,
      netWorth: totals.netWorth,
      totalAssets: totals.totalAssets,
      totalLiabilities: totals.totalLiabilities,
      createdBy: userId,
    });
    await touchSync(ctx, householdId);
    return id;
  },
});
