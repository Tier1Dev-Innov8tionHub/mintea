<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# mintea — Cloud Agent notes

## Stack

- Next.js 16 (App Router) frontend
- Convex backend (shared household finance data + Convex Auth)
- PWA installable; data is **cloud-first** (needs connectivity)

## Dev services (two processes)

```bash
# Recommended: both together
npm run dev

# Or separately:
npm run dev:frontend   # next dev → http://localhost:3000
npm run dev:backend    # CONVEX_AGENT_MODE=anonymous convex dev
```

Cloud agents should use `CONVEX_AGENT_MODE=anonymous` so `convex dev` uses an isolated local anonymous deployment (see `.env.local`).

## Env vars

Client (`.env.local`, written by `npx convex init` / `convex dev`):

- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`

Convex deployment env (set via `npx convex env set`):

- `SITE_URL` — e.g. `http://localhost:3000`
- `JWT_PRIVATE_KEY` / `JWKS` — Convex Auth signing keys
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth (optional for local password auth)
- `AUTH_ALLOWED_EMAILS` — `moniquemcintosh1234@gmail.com,mgrant90@gmail.com` (empty = allow all; use `.env.defaults`)

## Auth model

- Shared **household** workspace (max 2 members); second allowlisted user auto-joins.
- Convex Auth with Google OAuth + Password (password helps local/agent testing without Google credentials).
- Records may include `createdBy` for attribution.
