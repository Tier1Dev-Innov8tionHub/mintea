import { describe, expect, it } from "vitest";
import {
  filterAccountsByView,
  filterTransactionsByAccountView,
  filterRecurringByAccountView,
  purposeLabel,
} from "@/lib/account-view";
import type { Account, Recurring, Transaction } from "@/lib/db/schema";

const mine = "me";
const partner = "partner";

const accounts: Account[] = [
  { id: "a1", name: "My private", type: "checking", balance: 0, color: "#0", ownerId: mine, purpose: "personal", visibility: "private" },
  { id: "a2", name: "Joint", type: "checking", balance: 0, color: "#0", ownerId: mine, purpose: "joint", visibility: "shared" },
  { id: "a3", name: "Partner private", type: "checking", balance: 0, color: "#0", ownerId: partner, purpose: "personal", visibility: "private" },
];

describe("filterAccountsByView", () => {
  it("returns all accounts for the 'all' view", () => {
    expect(filterAccountsByView(accounts, mine, "all")).toHaveLength(3);
  });
  it("returns everything when userId is missing", () => {
    expect(filterAccountsByView(accounts, undefined, "mine")).toHaveLength(3);
  });
  it("'mine' returns only accounts the user owns", () => {
    expect(filterAccountsByView(accounts, mine, "mine").map((a) => a.id)).toEqual(["a1", "a2"]);
  });
  it("'shared' returns only shared accounts", () => {
    expect(filterAccountsByView(accounts, mine, "shared").map((a) => a.id)).toEqual(["a2"]);
  });
});

describe("filterTransactionsByAccountView", () => {
  const transactions: Transaction[] = [
    { id: "t1", accountId: "a1", type: "expense", amount: 1, categoryId: null, description: "", date: "2024-06-01", isIgnored: false },
    { id: "t2", accountId: "a2", type: "expense", amount: 1, categoryId: null, description: "", date: "2024-06-01", isIgnored: false },
    { id: "t3", accountId: "a3", type: "expense", amount: 1, categoryId: null, description: "", date: "2024-06-01", isIgnored: false },
  ];
  it("keeps only transactions on visible accounts", () => {
    expect(filterTransactionsByAccountView(transactions, accounts, mine, "shared").map((t) => t.id)).toEqual(["t2"]);
  });
});

describe("filterRecurringByAccountView", () => {
  const items: Recurring[] = [
    { id: "r1", name: "Joint bill", amount: 1, frequency: "monthly", nextDate: "2024-06-01", categoryId: "c", accountId: "a2", active: true },
    { id: "r2", name: "Unassigned", amount: 1, frequency: "monthly", nextDate: "2024-06-01", categoryId: "c", active: true },
    { id: "r3", name: "Partner private bill", amount: 1, frequency: "monthly", nextDate: "2024-06-01", categoryId: "c", accountId: "a3", active: true },
  ];
  it("'shared' hides unassigned bills and private-account bills", () => {
    expect(filterRecurringByAccountView(items, accounts, mine, "shared").map((r) => r.id)).toEqual(["r1"]);
  });
  it("'mine' keeps unassigned bills alongside owned-account bills", () => {
    expect(filterRecurringByAccountView(items, accounts, mine, "mine").map((r) => r.id)).toEqual(["r1", "r2"]);
  });
});

describe("purposeLabel", () => {
  it("maps purposes to labels with joint fallback", () => {
    expect(purposeLabel("personal")).toBe("Personal");
    expect(purposeLabel("business")).toBe("Business");
    expect(purposeLabel("joint")).toBe("Joint");
  });
});
