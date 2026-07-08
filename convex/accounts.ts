import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireHouseholdId,
  requireHouseholdIdForQuery,
  touchSync,
} from "./lib/household";
import { accountDoc, accountTypeValidator } from "./lib/validators";

const ACCOUNT_COLORS = [
  "#059669",
  "#0D9488",
  "#6366F1",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#EF4444",
];

function normalizeLast4(last4: string | undefined): string | undefined {
  if (last4 === undefined) return undefined;
  const digits = last4.replace(/\D/g, "").slice(-4);
  return digits.length === 4 ? digits : undefined;
}

export const list = query({
  args: {},
  returns: v.array(accountDoc),
  handler: async (ctx) => {
    const { householdId } = await requireHouseholdIdForQuery(ctx);
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
      last4: a.last4 && a.last4.length === 4 ? a.last4 : undefined,
    }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: accountTypeValidator,
    balance: v.number(),
    color: v.optional(v.string()),
    last4: v.optional(v.string()),
  },
  returns: v.id("accounts"),
  handler: async (ctx, args) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const name = args.name.trim();
    if (!name) throw new Error("Account name is required");

    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();
    const color =
      args.color ?? ACCOUNT_COLORS[existing.length % ACCOUNT_COLORS.length]!;

    const id = await ctx.db.insert("accounts", {
      householdId,
      name,
      type: args.type,
      balance: args.balance,
      color,
      last4: normalizeLast4(args.last4),
      createdBy: userId,
    });
    await touchSync(ctx, householdId);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("accounts"),
    name: v.optional(v.string()),
    type: v.optional(accountTypeValidator),
    balance: v.optional(v.number()),
    color: v.optional(v.string()),
    last4: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { householdId } = await requireHouseholdId(ctx);
    const account = await ctx.db.get(args.id);
    if (!account || account.householdId !== householdId) {
      throw new Error("Account not found");
    }

    const patch: Record<string, string | number | undefined> = {};

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) throw new Error("Account name is required");
      patch.name = name;
    }
    if (args.type !== undefined) patch.type = args.type;
    if (args.balance !== undefined) patch.balance = args.balance;
    if (args.color !== undefined) patch.color = args.color;
    if (args.last4 !== undefined) {
      // Empty string clears the optional field for display purposes.
      patch.last4 =
        args.last4 === null ? "" : (normalizeLast4(args.last4) ?? "");
    }

    await ctx.db.patch(args.id, patch);
    await touchSync(ctx, householdId);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("accounts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { householdId } = await requireHouseholdId(ctx);
    const account = await ctx.db.get(args.id);
    if (!account || account.householdId !== householdId) {
      throw new Error("Account not found");
    }

    const linked = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.id))
      .first();
    if (linked) {
      throw new Error(
        "This account has transactions. Move or delete them before removing the account.",
      );
    }

    await ctx.db.delete(args.id);
    await touchSync(ctx, householdId);
    return null;
  },
});
