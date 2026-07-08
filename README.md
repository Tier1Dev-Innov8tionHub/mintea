# mintea

A shared workspace for two people — with private personal accounts when you need them. Track spending, earnings, budgets, savings goals, and recurring bills. Built with Next.js, Convex, and Clerk.

## Features

- **Personal / shared accounts** — Personal accounts are private by default; mark them shared, or use joint/business accounts that both partners always see
- **Dashboard** — Monthly spending overview with chart, accounts summary, and savings goals
- **Accounts / Net worth** — Manual balances by type, with snapshot history
- **Spending** — Category breakdown and uncategorized transaction prompts
- **Budgets** — Per-category budgets with progress tracking and history
- **Transactions** — Search, filter, add, and edit income/expense/transfer entries
- **Recurring** — Bills and subscriptions with upcoming calendar view
- **Goals** — Savings goals with deposit tracking and progress bars
- **Auth** — Clerk (Google / email) + Convex, with an email allowlist
- **PWA** — Install on your phone; requires connectivity for data sync

## Screens

| Route | Description |
| --- | --- |
| `/sign-in` | Sign in |
| `/sign-up` | Sign up (disable in Clerk for production) |
| `/` | Dashboard / home overview |
| `/accounts` | Manual account balances |
| `/net-worth` | Assets, liabilities, history |
| `/spending` | Spending breakdown by category |
| `/budgets` | Category budgets and progress |
| `/transactions` | Full transaction list with search and filters |
| `/recurring` | Recurring bills and subscriptions |
| `/goals` | Savings goals |
| `/more` | Secondary navigation |
| `/settings` | Preferences, sign out, clear household data |
| `/onboarding` | First-run personalization |
| `/offline` | Offline fallback page |

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- Convex (reactive backend + database)
- Clerk (`@clerk/nextjs` + `ConvexProviderWithClerk`)
- Recharts for data visualization
- `@ducanh2912/next-pwa` for installability

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with an allowlisted account.

### Auth setup (production)

1. Create a Clerk application; enable Google (and/or email) as needed.
2. In Clerk, create a JWT template named **`convex`**.
3. Set Vercel env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOY_KEY`.
4. Set Convex prod env:
   - `CLERK_JWT_ISSUER_DOMAIN` — Clerk Frontend API URL (e.g. `https://xxx.clerk.accounts.dev`)
   - `AUTH_ALLOWED_EMAILS` — comma-separated household emails (**required in prod**)
5. In Clerk Dashboard → User & Authentication → restrict or disable public sign-ups (invitation-only recommended).

### Go-live checklist

- [ ] `AUTH_ALLOWED_EMAILS` set on Convex **prod**
- [ ] `CLERK_JWT_ISSUER_DOMAIN` set on Convex **prod**
- [ ] Clerk JWT template `convex` exists
- [ ] Public sign-up disabled (or invitation-only) in Clerk
- [ ] `CONVEX_DEPLOY_KEY` on Vercel; first deploy runs `npx convex deploy`
- [ ] Smoke-test PWA with `npm run build && npm run start` (service worker is off in dev)
- [ ] Confirm both household members can sign in and share data

## Data model

One **household** workspace (up to two members). Accounts have an owner and purpose (`personal` | `joint` | `business`). Personal accounts default to private; joint and business are always shared. Transactions and recurring bills follow the account they belong to. Categories, budgets, and goals stay household-wide. Tables: accounts, transactions, categories, budgets, goals, recurring, settings, balanceSnapshots. Analytics in `lib/calculations/*` stay pure functions over arrays.

Balances are **manual** — there is no bank linking.

## Install as App

**iPhone:** Safari → Share → Add to Home Screen  
**Android:** Chrome → Menu → Install app

## License

MIT
