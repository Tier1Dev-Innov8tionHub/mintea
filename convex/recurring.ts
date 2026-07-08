import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getVisibleAccountOrThrow,
  listVisibleAccounts,
} from "./lib/accountAccess";
import {
  requireHouseholdId,
  requireHouseholdIdForQuery,
  touchSync,
} from "./lib/household";
import { recurringDoc, recurringFrequencyValidator } from "./lib/validators";
import {
  addFrequency,
  advanceUntilOnOrAfter,
} from "./lib/recurringDates";
import type { Doc, Id } from "./_generated/dataModel";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function canSeeRecurring(
  item: Doc<"recurring">,
  userId: Id<"users">,
  visibleAccountIds: Set<Id<"accounts">>,
): boolean {
  if (item.accountId) {
    return visibleAccountIds.has(item.accountId);
  }
  // Unassigned: visible to creator (or anyone if no createdBy — legacy)
  if (!item.createdBy) return true;
  return item.createdBy === userId;
}

export const list = query({
  args: {},
  returns: v.array(recurringDoc),
  handler: async (ctx) => {
    const { userId, householdId } = await requireHouseholdIdForQuery(ctx);
    const visible = await listVisibleAccounts(ctx, householdId, userId);
    const visibleIds = new Set(visible.map((a) => a._id));

    const rows = await ctx.db
      .query("recurring")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();

    return rows
      .filter((r) => canSeeRecurring(r, userId, visibleIds))
      .map((r) => ({
        id: r._id,
        name: r.name,
        amount: r.amount,
        frequency: r.frequency,
        nextDate: r.nextDate,
        categoryId: r.categoryId,
        accountId: r.accountId,
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
    accountId: v.optional(v.id("accounts")),
    active: v.boolean(),
  },
  returns: v.id("recurring"),
  handler: async (ctx, args) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const category = await ctx.db.get(args.categoryId);
    if (!category || category.householdId !== householdId) {
      throw new Error("Category not found");
    }
    if (args.accountId) {
      await getVisibleAccountOrThrow(ctx, args.accountId, householdId, userId);
    }
    const id = await ctx.db.insert("recurring", {
      householdId,
      name: args.name,
      amount: args.amount,
      frequency: args.frequency,
      nextDate: args.nextDate,
      categoryId: args.categoryId,
      accountId: args.accountId,
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
    accountId: v.optional(v.union(v.id("accounts"), v.null())),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const item = await ctx.db.get(args.id);
    if (!item || item.householdId !== householdId) {
      throw new Error("Recurring item not found");
    }

    const visible = await listVisibleAccounts(ctx, householdId, userId);
    const visibleIds = new Set(visible.map((a) => a._id));
    if (!canSeeRecurring(item, userId, visibleIds)) {
      throw new Error("Recurring item not found");
    }

    const { id, accountId, ...rest } = args;
    if (accountId !== undefined && accountId !== null) {
      await getVisibleAccountOrThrow(ctx, accountId, householdId, userId);
    }

    const next = {
      name: rest.name ?? item.name,
      amount: rest.amount ?? item.amount,
      frequency: rest.frequency ?? item.frequency,
      nextDate: rest.nextDate ?? item.nextDate,
      categoryId: rest.categoryId ?? item.categoryId,
      active: rest.active ?? item.active,
      accountId:
        accountId === undefined
          ? item.accountId
          : accountId === null
            ? undefined
            : accountId,
    };

    await ctx.db.replace(id, {
      householdId: item.householdId,
      name: next.name,
      amount: next.amount,
      frequency: next.frequency,
      nextDate: next.nextDate,
      categoryId: next.categoryId,
      active: next.active,
      ...(next.accountId ? { accountId: next.accountId } : {}),
      ...(item.createdBy ? { createdBy: item.createdBy } : {}),
    });
    await touchSync(ctx, householdId);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("recurring") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const item = await ctx.db.get(args.id);
    if (!item || item.householdId !== householdId) {
      throw new Error("Recurring item not found");
    }
    const visible = await listVisibleAccounts(ctx, householdId, userId);
    const visibleIds = new Set(visible.map((a) => a._id));
    if (!canSeeRecurring(item, userId, visibleIds)) {
      throw new Error("Recurring item not found");
    }
    await ctx.db.delete(args.id);
    await touchSync(ctx, householdId);
    return null;
  },
});

/**
 * Roll every active bill whose nextDate is before today forward
 * until it is on/after today. Safe to call on every Recurring page visit.
 */
export const advanceOverdue = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const today = todayUtc();
    const visible = await listVisibleAccounts(ctx, householdId, userId);
    const visibleIds = new Set(visible.map((a) => a._id));

    const rows = await ctx.db
      .query("recurring")
      .withIndex("by_household_and_active", (q) =>
        q.eq("householdId", householdId).eq("active", true),
      )
      .collect();

    let updated = 0;
    for (const row of rows) {
      if (!canSeeRecurring(row, userId, visibleIds)) continue;
      if (row.nextDate >= today) continue;
      const nextDate = advanceUntilOnOrAfter(
        row.nextDate,
        row.frequency,
        today,
      );
      if (nextDate === row.nextDate) continue;
      await ctx.db.patch(row._id, { nextDate });
      updated += 1;
    }
    if (updated > 0) await touchSync(ctx, householdId);
    return updated;
  },
});

/**
 * Mark one bill as paid: advance at least one period, catching up
 * past overdue dates so nextDate lands on/after today.
 */
export const markPaid = mutation({
  args: { id: v.id("recurring") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { userId, householdId } = await requireHouseholdId(ctx);
    const item = await ctx.db.get(args.id);
    if (!item || item.householdId !== householdId) {
      throw new Error("Recurring item not found");
    }
    const visible = await listVisibleAccounts(ctx, householdId, userId);
    const visibleIds = new Set(visible.map((a) => a._id));
    if (!canSeeRecurring(item, userId, visibleIds)) {
      throw new Error("Recurring item not found");
    }
    const today = todayUtc();
    let nextDate = addFrequency(item.nextDate, item.frequency);
    while (nextDate < today) {
      nextDate = addFrequency(nextDate, item.frequency);
    }
    await ctx.db.patch(args.id, { nextDate });
    await touchSync(ctx, householdId);
    return nextDate;
  },
});
