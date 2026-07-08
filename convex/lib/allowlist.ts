/**
 * Comma-separated allowlist of emails that may sign in.
 * Example: AUTH_ALLOWED_EMAILS=moniquemcintosh1234@gmail.com,mgrant90@gmail.com
 *
 * When unset or empty, all emails are allowed (local/agent development).
 * Set this in production so only the household can authenticate.
 */
export function isEmailAllowed(email: string | undefined | null): boolean {
  const raw = process.env.AUTH_ALLOWED_EMAILS?.trim();
  // No allowlist configured → open access (local/agent development).
  if (!raw) return true;

  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;

  // Allowlist is set → email claim is required.
  if (!email) return false;
  return allowed.includes(email.trim().toLowerCase());
}
