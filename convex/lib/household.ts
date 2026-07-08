import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { isEmailAllowed } from "./allowlist";

type Ctx = QueryCtx | MutationCtx;

/**
 * Look up the Convex user for the current Clerk identity (queries + mutations).
 * Returns null if not signed in or the user row has not been created yet.
 */
export async function getCurrentUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();
}

/**
 * Resolve the authenticated Clerk user to a Convex `users` document.
 * Creates the user on first authenticated mutation.
 */
export async function getOrCreateUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  if (!isEmailAllowed(identity.email)) {
    throw new Error(
      "This email is not allowed to access mintea. Ask the household owner to add you to AUTH_ALLOWED_EMAILS.",
    );
  }

  const existing = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();

  if (existing) {
    const patch: Partial<Doc<"users">> = {};
    if (identity.email && identity.email !== existing.email) {
      patch.email = identity.email;
    }
    if (identity.name && identity.name !== existing.name) {
      patch.name = identity.name;
    }
    if (identity.pictureUrl && identity.pictureUrl !== existing.image) {
      patch.image = identity.pictureUrl;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
      return { ...existing, ...patch };
    }
    return existing;
  }

  const userId = await ctx.db.insert("users", {
    tokenIdentifier: identity.subject,
    email: identity.email,
    name: identity.name,
    image: identity.pictureUrl,
  });
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Failed to create user");
  }
  return user;
}

export async function requireUserId(ctx: MutationCtx): Promise<Id<"users">> {
  const user = await getOrCreateUser(ctx);
  return user._id;
}

export async function requireExistingUserId(ctx: QueryCtx): Promise<Id<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user._id;
}

export async function getMembership(ctx: Ctx, userId: Id<"users">) {
  return await ctx.db
    .query("householdMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

export async function requireHouseholdId(ctx: MutationCtx): Promise<{
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

/** Query-safe household lookup (does not create users). */
export async function requireHouseholdIdForQuery(ctx: QueryCtx): Promise<{
  userId: Id<"users">;
  householdId: Id<"households">;
  membership: Doc<"householdMembers">;
}> {
  const userId = await requireExistingUserId(ctx);
  const membership = await getMembership(ctx, userId);
  if (!membership) {
    throw new Error("No household found. Complete setup first.");
  }
  return { userId, householdId: membership.householdId, membership };
}

export async function assertHouseholdAccess(
  ctx: MutationCtx,
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
