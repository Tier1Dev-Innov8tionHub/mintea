import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function requireUserId(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export async function getMembership(ctx: Ctx, userId: Id<"users">) {
  return await ctx.db
    .query("householdMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

export async function requireHouseholdId(ctx: Ctx): Promise<{
  userId: Id<"users">;
  householdId: Id<"households">;
  membership: Doc<"householdMembers">;
}> {
  const userId = await requireUserId(ctx);
  const membership = await getMembership(ctx, userId);
  if (!membership) {
    throw new Error("No household found. Complete setup first.");
  }
  return { userId, householdId: membership.householdId, membership };
}

export async function assertHouseholdAccess(
  ctx: Ctx,
  householdId: Id<"households">,
): Promise<Id<"users">> {
  const userId = await requireUserId(ctx);
  const membership = await ctx.db
    .query("householdMembers")
    .withIndex("by_household_and_user", (q) =>
      q.eq("householdId", householdId).eq("userId", userId),
    )
    .unique();
  if (!membership) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function touchSync(
  ctx: MutationCtx,
  householdId: Id<"households">,
): Promise<void> {
  const settings = await ctx.db
    .query("settings")
    .withIndex("by_household", (q) => q.eq("householdId", householdId))
    .unique();
  if (settings) {
    await ctx.db.patch(settings._id, {
      lastSynced: new Date().toISOString(),
    });
  }
}
