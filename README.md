# mintea

A personal finance and savings tracker PWA built with Next.js 16. Track spending, income, budgets, savings goals, and recurring bills — all stored locally in your browser, with no account or server required.

mintea is **local-first**: every byte of your financial data lives in your browser's IndexedDB. Nothing is sent to any server, and the app works offline once installed.

## Table of Contents

- [Features](#features)
- [Screens](#screens)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Demo Data & Resetting](#demo-data--resetting)
- [PWA & Offline Support](#pwa--offline-support)
- [Install as an App](#install-as-an-app)
- [Data & Privacy](#data--privacy)
- [Deployment](#deployment)
- [License](#license)

## Features

- **Dashboard** — Monthly spending overview with a cumulative-spend chart, accounts summary, savings goals, and recent transactions.
- **Spending** — Category breakdown for the month, category history, and prompts to categorize uncategorized transactions.
- **Budgets** — Per-category monthly budgets with progress tracking, remaining amounts, and month-over-month history.
- **Transactions** — Search, filter, add, edit, and delete income / expense / transfer entries. Transactions can be marked "ignored" so they are excluded from spending totals.
- **Recurring** — Bills and subscriptions with an upcoming calendar view (this week vs. later) and weekly/monthly/yearly frequencies.
- **Goals** — Savings goals with deposit tracking, progress bars, optional deadlines, and active/paused states.
- **Settings** — Update your display name and monthly budget target, learn how to install the app, and clear all data.
- **Onboarding** — A short introductory flow that personalizes your name and monthly budget target on first launch.
- **PWA** — Installable on mobile and desktop with offline support and an app-like standalone experience.
- **Reactive UI** — Views update live as the underlying data changes, powered by Dexie live queries.

## Screens

The app is a mobile-first single-page experience with bottom-tab navigation on small screens and a sidebar on larger screens:

| Route | Description |
| --- | --- |
| `/` | Dashboard / home overview |
| `/spending` | Spending breakdown by category |
| `/budgets` | Category budgets and progress |
| `/transactions` | Full transaction list with search and filters |
| `/recurring` | Recurring bills and subscriptions |
| `/goals` | Savings goals |
| `/more` | Secondary navigation (goals, budgets, settings) |
| `/settings` | App preferences and data management |
| `/onboarding` | First-run personalization flow |
| `/offline` | Offline fallback page (shown by the service worker) |

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** (App Router) with Turbopack
- **[React 19](https://react.dev/)** + **TypeScript**
- **[Tailwind CSS 4](https://tailwindcss.com/)** for styling
- **[Dexie.js](https://dexie.org/)** (IndexedDB wrapper) + **dexie-react-hooks** for local, reactive storage
- **[Recharts](https://recharts.org/)** for data visualization
- **[date-fns](https://date-fns.org/)** for date math
- **[lucide-react](https://lucide.dev/)** for icons
- **[@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa)** for service-worker / offline support
- **[class-variance-authority](https://cva.style/)**, **clsx**, and **tailwind-merge** for component styling utilities

## Prerequisites

- **Node.js 20+** (developed and verified on Node 22)
- **npm** (a `package-lock.json` is committed; use npm for reproducible installs)

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first launch you'll be routed through a brief onboarding flow, and the database is automatically seeded with demo data so you have something to explore.

To create and serve an optimized production build (this also enables the PWA/service worker, which is disabled in development):

```bash
npm run build
npm run start
```

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server at `http://localhost:3000`. |
| `npm run build` | Create an optimized production build. |
| `npm run start` | Serve the production build (run `npm run build` first). |
| `npm run lint` | Run ESLint (`eslint-config-next` with core-web-vitals + TypeScript rules). |

## Project Structure

```
mintea/
├── app/                    # Next.js App Router routes (one folder per screen)
│   ├── layout.tsx          # Root layout: fonts, metadata, providers
│   ├── page.tsx            # Dashboard
│   ├── budgets/            # Budgets screen
│   ├── goals/              # Savings goals screen
│   ├── recurring/          # Recurring bills screen
│   ├── spending/           # Spending breakdown screen
│   ├── transactions/       # Transactions list screen
│   ├── more/               # Secondary navigation
│   ├── settings/           # Settings & data management
│   ├── onboarding/         # First-run flow
│   ├── offline/            # PWA offline fallback
│   └── globals.css         # Tailwind + global styles
├── components/
│   ├── layout/             # App shell: providers, sidebar, bottom nav, onboarding guard
│   ├── dashboard/          # Dashboard cards
│   ├── transactions/       # Add / edit transaction sheets
│   ├── charts/             # Recharts wrappers
│   ├── icons/              # Category icon mapping
│   └── ui/                 # Reusable primitives (button, card, input, modal, sheet)
├── lib/
│   ├── db/                 # Dexie database
│   │   ├── schema.ts       # TypeScript entity types + table types
│   │   ├── index.ts        # Dexie database definition & indexes
│   │   ├── seed.ts         # Seeding, settings, and data-clearing helpers
│   │   └── hooks.ts        # Live-query React hooks + CRUD helpers
│   ├── calculations/       # Pure functions for spend/budget/goal analytics
│   ├── format.ts           # Currency / date formatting helpers
│   └── utils.ts            # Misc utilities (e.g. `cn` class merger)
├── public/                 # Static assets, PWA manifest & icons
├── next.config.ts          # Next.js + PWA configuration
├── eslint.config.mjs       # ESLint flat config
└── tsconfig.json           # TypeScript configuration
```

## Architecture

mintea is a fully client-side application — there is no API layer, backend, or external database.

- **Storage:** A single Dexie (IndexedDB) database named `mintea` holds all data across seven tables: `accounts`, `transactions`, `categories`, `budgets`, `goals`, `recurring`, and `settings` (see `lib/db/index.ts`).
- **Reactivity:** UI components read data through Dexie live-query hooks in `lib/db/hooks.ts` (e.g. `useTransactions`, `useAccounts`, `useGoals`). Any write automatically re-renders the relevant views.
- **Writes:** CRUD helpers in `lib/db/hooks.ts` (e.g. `addTransaction`, `updateBudget`, `depositToGoal`, `upsertBudget`) wrap Dexie operations and touch a "last synced" timestamp.
- **Derived data:** All analytics (monthly spend, budget status, spending-by-category, daily spend chart, goal progress, recurring upcoming, income allocation, etc.) are computed by pure functions in `lib/calculations/index.ts`, keeping components thin and logic testable.
- **App shell:** `components/layout/app-provider.tsx` initializes/seeds the database and renders the responsive shell (sidebar on desktop, bottom nav on mobile). `components/layout/onboarding-guard.tsx` redirects first-time users to onboarding.

## Data Model

Defined in `lib/db/schema.ts`:

- **Account** — `checking` / `savings` / `credit` / `cash`, with a balance and color.
- **Category** — Grouped as `spending`, `income`, `bills`, or `savings`, each with an icon and color.
- **Transaction** — An `income` / `expense` / `transfer` tied to an account and (optionally) a category; supports an `isIgnored` flag and an optional `recurringId` link.
- **Budget** — A per-category, per-month (`YYYY-MM`) budget amount.
- **Goal** — A savings goal with target/current amounts, `active` / `paused` status, and an optional deadline.
- **Recurring** — A recurring bill/subscription with a `weekly` / `monthly` / `yearly` frequency and next due date.
- **Settings** — Display name, monthly budget, currency, onboarding state, and last-synced timestamp.

## Demo Data & Resetting

On first run, `seedDatabase()` (in `lib/db/seed.ts`) populates the database with sample accounts, categories, budgets, goals, recurring bills, and a few weeks of transactions so the charts and screens are immediately meaningful. Seeding only runs when the database is empty.

To start fresh, open **Settings → Clear All Data**. This wipes every table and then re-seeds the demo data, returning you to a clean slate.

## PWA & Offline Support

The app is configured as a Progressive Web App via `@ducanh2912/next-pwa` in `next.config.ts`:

- The service worker is **disabled in development** and only active in production builds. To test offline behavior locally, run `npm run build && npm run start`.
- When offline and navigating to an uncached route, the service worker falls back to the `/offline` page.
- The web app manifest lives at `public/manifest.json` with maskable icons in `public/icons/`.

## Install as an App

- **iPhone (Safari):** Share → Add to Home Screen
- **Android (Chrome):** Menu → Install app
- **Desktop (Chrome/Edge):** Use the install icon in the address bar

## Data & Privacy

All financial data is stored locally in your browser using IndexedDB. Nothing is transmitted to or stored on any server. Because data is scoped to a single browser profile, it does not sync across browsers or devices, and clearing your browser's site data (or using the in-app **Clear All Data** action) will remove it.

## Deployment

As a standard Next.js app, mintea deploys to any platform that supports Next.js (e.g. [Vercel](https://vercel.com/)). Build with `npm run build`; the output is fully static/client-rendered and requires no server-side environment variables.

## License

MIT
