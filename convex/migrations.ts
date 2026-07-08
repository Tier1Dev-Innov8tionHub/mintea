import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Backfill ownerId / purpose / visibility on existing accounts.
 * Existing rows become joint + shared so both partners keep full visibility.
 */
export const backfillAccountVisibility = internalMutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const accounts = await ctx.db.query("accounts").collect();
    let updated = 0;
    let skipped = 0;

    for (const account of accounts) {
      if (
        account.ownerId !== undefined &&
        account.purpose !== undefined &&
        account.visibility !== undefined
      ) {
        skipped += 1;
        continue;
      }

      let ownerId = account.ownerId ?? account.createdBy;
      if (!ownerId) {
        const member = await ctx.db
          .query("householdMembers")
          .withIndex("by_household", (q) =>
            q.eq("householdId", account.householdId),
          )
          .first();
        ownerId = member?.userId;
      }
      if (!ownerId) {
        skipped += 1;
        continue;
      }

      await ctx.db.patch(account._id, {
        ownerId,
        purpose: account.purpose ?? "joint",
        visibility: account.visibility ?? "shared",
      });
      updated += 1;
    }

    return { updated, skipped };
  },
});
