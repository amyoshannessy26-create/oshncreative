# OSHN Creative — VA Business Dashboard

Branded, integrated business dashboard: clients, leads/onboarding, tasks,
capacity planning, notes, invoices, expenses, and a docs hub — fed by Google
(Drive/Calendar) and Xero.

**Stack**: Next.js (App Router) + TypeScript, Prisma + Postgres (Neon),
Auth.js (Google OAuth), deployed on Vercel.

See [SETUP.md](./SETUP.md) for the full walkthrough — database, OAuth apps,
environment variables, and deployment. Branding lives in
[`config/brand.ts`](./config/brand.ts).

## Local dev

```bash
npm install
cp .env.example .env.local   # then fill in real values, see SETUP.md
npm run db:push
npm run dev
```
