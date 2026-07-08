<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

`mintea` is a **client-only** Next.js 16 PWA. All data is stored in the browser (IndexedDB via Dexie) — there is no backend server, database, or external service to run, and no secrets/env vars are required. The single dev service is the Next.js dev server.

- Run the app: `npm run dev` (serves http://localhost:3000). Scripts: `dev`, `build`, `start`, `lint` (see `package.json`).
- Onboarding gates the app: a fresh browser profile redirects `/` to `/onboarding`. State lives in IndexedDB, so clearing site data / using a fresh profile resets onboarding. Use "Skip for now" to bypass setup quickly.
- Data persistence is per-browser-profile only; it does not survive across different browsers or cleared storage, and nothing syncs to a server.
- PWA/service worker is **disabled in development** (`disable: process.env.NODE_ENV === "development"` in `next.config.ts`); it only activates in a production build. Test offline/PWA behavior via `npm run build && npm run start`.
- `npm run lint` currently reports pre-existing `react-hooks/set-state-in-effect` errors in the transaction sheet components; these are unrelated to environment setup.
