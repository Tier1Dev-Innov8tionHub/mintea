# mintea

A personal finance and savings tracker PWA built with Next.js. Track spending, earnings, budgets, savings goals, and recurring bills — all stored locally in your browser.

## Features

- **Dashboard** — Monthly spending overview with chart, accounts summary, and savings goals
- **Spending** — Category breakdown and uncategorized transaction prompts
- **Budgets** — Per-category budgets with progress tracking and history
- **Transactions** — Search, filter, add, and edit income/expense/transfer entries
- **Recurring** — Bills and subscriptions with upcoming calendar view
- **Goals** — Savings goals with deposit tracking and progress bars
- **PWA** — Install on your phone for an app-like experience

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- Dexie.js (IndexedDB) for local storage
- Recharts for data visualization
- `@ducanh2912/next-pwa` for offline support

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Install as App

**iPhone:** Safari → Share → Add to Home Screen  
**Android:** Chrome → Menu → Install app

## Data Privacy

All financial data is stored locally in your browser using IndexedDB. Nothing is sent to any server.

## License

MIT
