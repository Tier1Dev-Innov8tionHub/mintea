import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type AccountPurpose = "personal" | "joint" | "business";
export type AccountVisibility = "private" | "shared";

export type NormalizedAccount = Doc<"accounts"> & {
  ownerId: Id<"users">;
  purpose: AccountPurpose;
  visibility: AccountVisibility;
};

/** Defaults for pre-migration rows: treat as joint/shared. */
export function normalizeAccount(
  account: Doc<"accounts">,
  fallbackOwnerId: Id<"users">,
): NormalizedAccount {
  const ownerId = account.ownerId ?? account.createdBy ?? fallbackOwnerId;
  const purpose = account.purpose ?? "joint";
  const visibility =
    account.visibility ??
    (purpose === "personal" ? "private" : "shared");
  return { ...account, ownerId, purpose, visibility };
}

export function defaultVisibilityForPurpose(
  purpose: AccountPurpose,
): AccountVisibility {
  return purpose === "personal" ? "private" : "shared";
}

export function canSeeAccount(
  userId: Id<"users">,
  account: Pick<NormalizedAccount, "ownerId" | "visibility">,
): boolean {
  return account.visibility === "shared" || account.ownerId === userId;
}

/** Private accounts: owner only. Shared: any household member. */
export function canEditAccount(
  userId: Id<"users">,
  account: Pick<NormalizedAccount, "ownerId" | "visibility">,
): boolean {
  if (account.visibility === "private") {
    return account.ownerId === userId;
  }
  return true;
}

export function assertCanEditAccount(
  userId: Id<"users">,
  account: Pick<NormalizedAccount, "ownerId" | "visibility">,
): void {
  if (!canEditAccount(userId, account)) {
    throw new Error("You can only edit your own private accounts");
  }
}

export async function listVisibleAccounts(
  ctx: QueryCtx | MutationCtx,
  householdId: Id<"households">,
  userId: Id<"users">,
): Promise<NormalizedAccount[]> {
  const rows = await ctx.db
    .query("accounts")
    .withIndex("by_household", (q) => q.eq("householdId", householdId))
    .collect();
  return rows
    .map((a) => normalizeAccount(a, userId))
    .filter((a) => canSeeAccount(userId, a));
}

export async function getVisibleAccountOrThrow(
  ctx: QueryCtx | MutationCtx,
  accountId: Id<"accounts">,
  householdId: Id<"households">,
  userId: Id<"users">,
): Promise<NormalizedAccount> {
  const account = await ctx.db.get(accountId);
  if (!account || account.householdId !== householdId) {
    throw new Error("Account not found");
  }
  const normalized = normalizeAccount(account, userId);
  if (!canSeeAccount(userId, normalized)) {
    throw new Error("Account not found");
  }
  return normalized;
}

export function resolvePurposeAndVisibility(args: {
  purpose: AccountPurpose;
  visibility?: AccountVisibility;
}): { purpose: AccountPurpose; visibility: AccountVisibility } {
  const purpose = args.purpose;
  if (purpose === "personal") {
    return {
      purpose,
      visibility: args.visibility ?? "private",
    };
  }
  return { purpose, visibility: "shared" };
}
