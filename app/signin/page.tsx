import { redirect } from "next/navigation";

/** Legacy Convex Auth route — keep for bookmarks/middleware redirects. */
export default function LegacySignInRedirect() {
  redirect("/sign-in");
}
