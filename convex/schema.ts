import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const accountType = v.union(
  v.literal("checking"),
  v.literal("savings"),
  v.literal("credit"),
  v.literal("cash"),
  v.literal("investment"),
);

const accountPurpose = v.union(
  v.literal("personal"),
  v.literal("joint"),
  v.literal("business"),
);

const accountVisibility = v.union(
  v.literal("private"),
  v.literal("shared"),
);

const transactionType = v.union(
  v.literal("income"),
  v.literal("expense"),
  v.literal("transfer"),
);

const categoryGroup = v.union(
  v.literal("spending"),
  v.literal("income"),
  v.literal("bills"),
  v.literal("savings"),
);

const goalStatus = v.union(v.literal("active"), v.literal("paused"));

const recurringFrequency = v.union(
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("yearly"),
);

export default defineSchema({
  users: defineTable({
    // Clerk subject (`identity.subject`) — stable per user
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  households: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }),

  householdMembers: defineTable({
    householdId: v.id("households"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_household", ["householdId"])
    .index("by_household_and_user", ["householdId", "userId"]),

  accounts: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    type: accountType,
    balance: v.number(),
    color: v.string(),
    /** Last 4 digits of the account/card number (optional). */
    last4: v.optional(v.string()),
    /** Member who owns/manages this account. */
    ownerId: v.optional(v.id("users")),
    /** personal | joint | business — drives default visibility. */
    purpose: v.optional(accountPurpose),
    /** private = owner only; shared = both household members. */
    visibility: v.optional(accountVisibility),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_household", ["householdId"])
    .index("by_household_and_owner", ["householdId", "ownerId"])
    .index("by_household_and_visibility", ["householdId", "visibility"]),

  categories: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    group: categoryGroup,
    createdBy: v.optional(v.id("users")),
  })
    .index("by_household", ["householdId"])
    .index("by_household_and_group", ["householdId", "group"]),

  transactions: defineTable({
    householdId: v.id("households"),
    accountId: v.id("accounts"),
    type: transactionType,
    amount: v.number(),
    categoryId: v.union(v.id("categories"), v.null()),
    description: v.string(),
    date: v.string(),
    isIgnored: v.boolean(),
    /** Optional freeform notes (Rocket Money–style detail). */
    notes: v.optional(v.string()),
    /** Manual pending flag — not bank-synced. */
    isPending: v.optional(v.boolean()),
    recurringId: v.optional(v.id("recurring")),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_household", ["householdId"])
    .index("by_household_and_date", ["householdId", "date"])
    .index("by_account", ["accountId"])
    .index("by_category", ["categoryId"]),

  budgets: defineTable({
    householdId: v.id("households"),
    categoryId: v.id("categories"),
    amount: v.number(),
    month: v.string(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_household", ["householdId"])
    .index("by_household_and_month", ["householdId", "month"])
    .index("by_household_category_month", ["householdId", "categoryId", "month"]),

  goals: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    icon: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    status: goalStatus,
    deadline: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_household", ["householdId"])
    .index("by_household_and_status", ["householdId", "status"]),

  recurring: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    amount: v.number(),
    frequency: recurringFrequency,
    nextDate: v.string(),
    categoryId: v.id("categories"),
    /** Optional payment account for this bill. */
    accountId: v.optional(v.id("accounts")),
    active: v.boolean(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_household", ["householdId"])
    .index("by_household_and_active", ["householdId", "active"]),

  /** Point-in-time net worth / balance snapshots for history charts. */
  balanceSnapshots: defineTable({
    householdId: v.id("households"),
    date: v.string(),
    netWorth: v.number(),
    totalAssets: v.number(),
    totalLiabilities: v.number(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_household", ["householdId"])
    .index("by_household_and_date", ["householdId", "date"]),

  settings: defineTable({
    householdId: v.id("households"),
    displayName: v.string(),
    monthlyBudget: v.number(),
    currency: v.string(),
    onboardingComplete: v.boolean(),
    lastSynced: v.string(),
  }).index("by_household", ["householdId"]),
});
