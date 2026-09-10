# LuvonGig

A freelance marketplace: clients post jobs and browse services, freelancers
deliver them, escrowed payments release on approval, plus hackathons and
paid 1:1 expert sessions. Originally built on ICP (Internet Computer) Motoko
canisters; the app is being migrated onto a conventional Next.js + Express +
Postgres stack, with Stripe replacing the on-chain payment rail.

## Layout

```
frontend/         Next.js app (App Router). The product UI.
backend_v1/       Express + Neon Postgres API. The new backend.
migration-tools/  One-off scripts that exported data from the ICP canisters.
docs/             API route notes (partially stale, see below).
```

There is no root package manager — `frontend` and `backend_v1` are two
independent Node projects run side by side.

## Quick start

You need both servers running; the frontend proxies most API calls to
`backend_v1` (see [Architecture](#architecture) below).

```bash
# 1. Backend
cd backend_v1
npm install
cp .env.example .env       # fill in DATABASE_URL (Neon, pooled connection string)
npm run migrate            # applies backend_v1/src/db/migrations/*.sql
npm run dev                # http://localhost:4000/health

# 2. Frontend, in a second terminal
cd frontend
npm install
npm run dev                # http://localhost:3000
```

`frontend/.env.local` needs at minimum:

```bash
JWT_SECRET=...              # MUST equal backend_v1's JWT_SECRET — see below
DATABASE_URL=...            # same Neon database as backend_v1
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

**`JWT_SECRET` must be identical on both sides.** Sessions are HS256 JWTs in
an httpOnly `sid` cookie; a token minted by either app has to verify on the
other, which is what lets routes move from Next.js to Express one domain at a
time without logging anyone out.

Stripe is optional in development — payment routes return `503` until
`STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are set on the backend (test-mode
keys from your Stripe dashboard are enough).

## Architecture

The frontend does not talk to Postgres directly. Every `frontend/app/api/**`
route is either:

- a **proxy** (`frontend/lib/api-proxy.ts`) that forwards the request,
  cookies included, straight to `backend_v1` — this is the normal case and
  where new work should go, or
- a handful of legacy routes that still talk to their own tables directly
  (auth-adjacent pieces not yet ported).

The plan (documented in each proxy file's header comment) is to delete the
proxy layer entirely once every domain has moved over and the frontend calls
`backend_v1` directly.

Money is always `amount_minor` (integer, e.g. cents) + a `currency` code,
formatted with `frontend/lib/currency.ts`'s `formatMoney`/`toMajorUnits`/
`toMinorUnits` — never a raw float, and never the old e8s/ICP math.

See `backend_v1/README.md` for the API's internal conventions (response
envelope, ID format, transactions, authorization).

## Status

The core marketplace (services, bookings, payments/escrow, chat, hackathons,
expert sessions) runs on Postgres + Stripe. The UI has been redesigned onto a
shared design-token system (`frontend/app/globals.css`) and shared components
(`frontend/components/ui/`) across the freelancer, client, and shared-shell
surfaces.

Known remaining gaps:
- `/expert/*`'s payment rail was migrated to Stripe/USD, but its visual
  design still predates the design-token system.
- A handful of legacy/orphaned routes and duplicate pages from the
  migration are still being found and removed as they're discovered.
- `migration-tools/` is a one-off ICP-export tool kept only for reference;
  its own README says it's safe to delete once the migration it supported is
  complete.
- Several root-level `*.md` files (e.g. `ICPAY_*`, `REFUND_*`) document the
  retired ICP/ICPay payment rail and are historical, not current.

## Contributing

No CI-enforced style guide beyond each project's own linter
(`frontend`: Biome via `npm run lint`; `backend_v1`: `npm run typecheck` and
`npm run test`, which runs against a real database — see its README).
