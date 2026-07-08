<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# mintea — Cloud Agent notes

## Stack

- Next.js 16 (App Router) frontend
- Convex backend (shared household finance data)
- Clerk authentication (`@clerk/nextjs` + `ConvexProviderWithClerk`)
- PWA installable; data is **cloud-first** (needs connectivity)

## Dev services (two processes)

```bash
# Recommended: both together
npm run dev

# Or separately:
npm run dev:frontend   # next dev → http://localhost:3000
npm run dev:backend    # convex dev (cloud project tools-cc0e0/mintea)
```

Cloud agents may use `CONVEX_AGENT_MODE=anonymous` for an isolated local deployment.

## Env vars

Client (`.env.local`, written by `convex dev` / `clerk env pull`):

- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `CLERK_JWT_ISSUER_DOMAIN` — Clerk Frontend API URL

Convex deployment env (set via `npx convex env set`; use `--prod` for production):

- `CLERK_JWT_ISSUER_DOMAIN` — required for Clerk JWT validation
- `SITE_URL` — app origin (localhost in dev, Vercel URL in prod)
- `AUTH_ALLOWED_EMAILS` — household allowlist (optional locally; set in prod)

## Auth model

- Shared **household** workspace (max 2 members); second allowlisted user auto-joins.
- Clerk + Convex JWT template named `convex`.
- Records may include `createdBy` for attribution.

## Hosting

- Convex cloud: [tools-cc0e0/mintea](https://dashboard.convex.dev/t/tools-cc0e0/mintea)
  - Dev: `combative-rat-605`
  - Prod: `basic-bat-289`
- Vercel: `tier1dev-innov8tionhubs-projects/mintea` → https://mintea.vercel.app
- Build command (`vercel.json`): `npx convex deploy --cmd 'npm run build'`
- Production Vercel needs `CONVEX_DEPLOY_KEY`

## Notes

- Onboarding gates the app after sign-in; settings live in Convex `settings` for the household.
- PWA/service worker is disabled in development (`next.config.ts`); test via `npm run build && npm run start`.
- Unauthenticated routes redirect to `/sign-in` via `middleware.ts`.
