import type {
  Account,
  AccountViewFilter,
  Recurring,
  Transaction,
} from "@/lib/db/schema";

export function filterAccountsByView(
  accounts: Account[],
  userId: string | undefined,
  view: AccountViewFilter,
): Account[] {
  if (!userId || view === "all") return accounts;
  if (view === "mine") {
    return accounts.filter((a) => a.ownerId === userId);
  }
  return accounts.filter((a) => a.visibility === "shared");
}

export function filterTransactionsByAccountView(
  transactions: Transaction[],
  accounts: Account[],
  userId: string | undefined,
  view: AccountViewFilter,
): Transaction[] {
  const visible = filterAccountsByView(accounts, userId, view);
  const ids = new Set(visible.map((a) => a.id));
  return transactions.filter((t) => ids.has(t.accountId));
}

export function filterRecurringByAccountView(
  items: Recurring[],
  accounts: Account[],
  userId: string | undefined,
  view: AccountViewFilter,
): Recurring[] {
  const visible = filterAccountsByView(accounts, userId, view);
  const ids = new Set(visible.map((a) => a.id));
  return items.filter((r) => {
    if (r.accountId) return ids.has(r.accountId);
    // Unassigned bills: show under Mine when filtering, or All
    if (view === "shared") return false;
    return true;
  });
}

export function purposeLabel(purpose: Account["purpose"]): string {
  switch (purpose) {
    case "personal":
      return "Personal";
    case "business":
      return "Business";
    default:
      return "Joint";
  }
}
