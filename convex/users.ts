import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser, getMembership } from "./lib/household";

export const viewer = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      userId: v.id("users"),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      householdId: v.union(v.id("households"), v.null()),
      role: v.union(v.literal("owner"), v.literal("member"), v.null()),
    }),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const membership = await getMembership(ctx, user._id);
    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      image: user.image,
      householdId: membership?.householdId ?? null,
      role: membership?.role ?? null,
    };
  },
});
