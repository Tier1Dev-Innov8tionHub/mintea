import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { isEmailAllowed } from "./lib/allowlist";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google, Password],
  callbacks: {
    async beforeSessionCreation(ctx, { userId }) {
      const user = await ctx.db.get(userId);
      if (!isEmailAllowed(user?.email)) {
        throw new Error(
          "This email is not allowed to access mintea. Ask the household owner to add you to AUTH_ALLOWED_EMAILS.",
        );
      }
    },
  },
});
