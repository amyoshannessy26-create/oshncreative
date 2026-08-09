# Setup

This is a real, deployed Next.js app — not a prototype. Follow these steps in order;
each one unblocks the next.

## 1. Database — Neon Postgres

Recommended over Supabase here because: it's pure serverless Postgres (no bundled
auth/storage you don't need), scales to zero between requests (cheap for a
single-user internal tool), and its pooled connection string works out of the box
with Vercel's serverless functions.

1. Create a project at https://neon.tech (free tier is plenty for this).
2. In the Neon dashboard, copy two connection strings:
   - **Pooled connection** → `DATABASE_URL`
   - **Direct connection** (toggle "Pooled connection" off) → `DIRECT_URL`
3. Locally: copy `.env.example` to `.env.local` and paste both in.
4. Push the schema:
   ```bash
   npm install
   npm run db:push
   ```
   This creates every table in `prisma/schema.prisma` (Clients, Leads, Tasks,
   Invoices, IntegrationConnection, etc.) with no manual SQL.

## 2. Auth.js secret

```bash
openssl rand -base64 32
```
Put the result in `AUTH_SECRET` (`.env.local` and later in Vercel).

## 3. Token encryption key

Same command, different variable:
```bash
openssl rand -base64 32
```
Put it in `TOKEN_ENCRYPTION_KEY`. This encrypts every OAuth access/refresh token
(Google + Xero) before it's written to the database — see `src/lib/crypto.ts`
(AES-256-GCM). Losing this key means every connected integration needs to be
reconnected; back it up somewhere safe (password manager), not just in Vercel.

## 4. Google Cloud — login + Drive + Calendar

1. https://console.cloud.google.com → create a project (or reuse one).
2. **APIs & Services → Library**: enable the **Google Drive API** and
   **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**: set it up in "External" mode
   (unless you have Google Workspace, then "Internal" is simpler), add your own
   email as a test user while it's unpublished.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
   type **Web application**. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (NextAuth login, local)
   - `http://localhost:3000/api/integrations/google/callback` (Drive/Calendar connect, local)
   - `https://<your-vercel-domain>/api/auth/callback/google` (production)
   - `https://<your-vercel-domain>/api/integrations/google/callback` (production)
5. Copy the Client ID and Client Secret into `GOOGLE_CLIENT_ID` /
   `GOOGLE_CLIENT_SECRET`.

Note the app uses **two separate Google OAuth flows** on purpose:
- Signing in (`/login`) only ever requests your name/email/profile — that's all
  NextAuth needs to know who you are.
- "Connect Google" in **Settings** is a second, explicit consent step that asks
  for read-only Drive + Calendar access and stores the resulting tokens
  (encrypted) in `IntegrationConnection`, separate from your login session. You
  can disconnect it without being signed out.

## 5. Xero — OAuth 2.0 with PKCE

1. https://developer.xero.com/app/manage → **New app** → **Web app**.
2. Redirect URI:
   - `http://localhost:3000/api/integrations/xero/callback` (local)
   - `https://<your-vercel-domain>/api/integrations/xero/callback` (production)
3. Copy the Client ID and Client Secret into `XERO_CLIENT_ID` /
   `XERO_CLIENT_SECRET`.
4. Under the app's API access, make sure **Accounting API** is enabled.

The connect flow (`src/lib/xero.ts`) generates a PKCE `code_verifier` /
`code_challenge` pair per attempt (`S256`), on top of the standard client
secret — this is Xero's recommended flow for web apps. Tokens are refreshed
automatically (Xero rotates the refresh token on every use; the app persists
the new one each time) and synced on a schedule rather than live-fetched, per
the spec — see step 7.

## 6. Deploy to Vercel

1. Push this branch, then in Vercel: **Add New → Project**, import
   `amyoshannessy26-create/oshncreative`.
2. Framework preset: Next.js (auto-detected).
3. Add every variable from `.env.example` under **Settings → Environment
   Variables** (use your real values, not the placeholders) — for both
   Production and Preview.
4. Update the four OAuth redirect URIs above to use your real
   `*.vercel.app` (or custom) domain, and add those to the Google Cloud and
   Xero app configs too.
5. Deploy. Every push to this branch redeploys automatically once the Vercel
   project is connected.

## 7. Scheduled syncs

`vercel.json` defines two cron jobs, once daily (early morning, Sydney time):
- `/api/cron/xero-sync` — pulls invoices + payment status from Xero
- `/api/cron/google-sync` — pulls Drive docs + Calendar events

Once a day is a Vercel **Hobby** (free) plan limit — the original spec asked
for every 15–30 min, which needs a paid Vercel plan to run via Vercel Cron
specifically. If you want closer-to-live syncing without upgrading Vercel,
ask and a free GitHub Actions–based scheduler can call these same routes
every 20 minutes instead.

Both routes check `Authorization: Bearer $CRON_SECRET`, which Vercel sends
automatically once `CRON_SECRET` is set as an environment variable — generate
one more random value for it (`openssl rand -base64 32`) and add it in Vercel.
**Cron jobs only run on Vercel's Production environment**, not Preview
deployments.

## 8. Branding

Everything in `/config/brand.ts` — business name, tagline, logo path, and the
full light-theme color palette. Replace `/public/logo.svg` with your real
logo (same filename, or update `brand.logo.src`) and swap the placeholder HSL
colors for your brand board's values. No component changes needed — see the
comments in `config/brand.ts` and `src/app/globals.css`.

## Local dev

```bash
npm install
npm run db:push   # first time, and after schema.prisma changes
npm run dev
```
