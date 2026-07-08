# mintea

A shared household finance tracker PWA built with Next.js and Convex. Track spending, earnings, budgets, savings goals, and recurring bills — synced across devices for two people.

## Features

- **Dashboard** — Monthly spending overview with chart, accounts summary, and savings goals
- **Spending** — Category breakdown and uncategorized transaction prompts
- **Budgets** — Per-category budgets with progress tracking and history
- **Transactions** — Search, filter, add, and edit income/expense/transfer entries
- **Recurring** — Bills and subscriptions with upcoming calendar view
- **Goals** — Savings goals with deposit tracking and progress bars
- **Auth** — Convex Auth (Google OAuth + email/password) with an email allowlist
- **PWA** — Install on your phone; requires connectivity for data sync

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- Convex (reactive backend + database)
- Convex Auth (`@convex-dev/auth`)
- Recharts for data visualization
- `@ducanh2912/next-pwa` for installability

## Getting Started

```bash
npm install

# Start Convex (anonymous agent mode works without a Convex login)
export CONVEX_AGENT_MODE=anonymous
npx convex dev

# In another terminal (or use npm run dev for both)
npm run dev:frontend
```

Or run both:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

### Auth setup (production / Google)

1. Generate JWT keys (see Convex Auth docs) and set `JWT_PRIVATE_KEY` + `JWKS`.
2. Set `SITE_URL` to your app origin.
3. Create a Google OAuth client; set redirect to `{CONVEX_SITE_URL}/api/auth/callback/google`.
4. `npx convex env set AUTH_GOOGLE_ID …` and `AUTH_GOOGLE_SECRET …`
5. `npx convex env set AUTH_ALLOWED_EMAILS you@example.com,partner@example.com`

Password auth works without Google for local development.

## Data model

One shared **household** (up to two members). Tables: accounts, transactions, categories, budgets, goals, recurring, settings. Analytics in `lib/calculations/*` stay pure functions over arrays.

## Install as App

**iPhone:** Safari → Share → Add to Home Screen  
**Android:** Chrome → Menu → Install app

## License

MIT
