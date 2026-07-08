/**
 * Comma-separated allowlist of emails that may sign in.
 * Example: AUTH_ALLOWED_EMAILS=you@example.com,partner@example.com
 *
 * When unset or empty, all emails are allowed (local/agent development).
 * Set this in production so only the household can authenticate.
 */
export function isEmailAllowed(email: string | undefined | null): boolean {
  if (!email) return false;
  const raw = process.env.AUTH_ALLOWED_EMAILS?.trim();
  if (!raw) return true;
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.includes(email.trim().toLowerCase());
}
