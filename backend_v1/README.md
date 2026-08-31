# LuvonGig API (`backend_v1`)

Node + Express + Neon Postgres. Replaces the ICP Motoko canisters in [`../backend`](../backend),
which stay in the repo as the reference for behaviour being ported.

> **`../backend` is the spec, this is the implementation.** When porting a
> feature, read the corresponding `.mo` actor first — it is the only place the
> current business rules are written down.

## Setup

```bash
cd backend_v1
npm install
cp .env.example .env      # then fill in DATABASE_URL and JWT_SECRET
npm run migrate
npm run dev               # http://localhost:4000/health
```

`JWT_SECRET` **must** equal the frontend's `JWT_SECRET`. Sessions are HS256
JWTs in an httpOnly `sid` cookie, identical in shape to
`frontend/lib/auth.ts`, so a token minted by either side verifies on the other.
That is what allows routes to move over one domain at a time without logging
anyone out.

## Neon

Use the **pooled** connection string (host contains `-pooler`) for `DATABASE_URL`.
Set `DATABASE_URL_UNPOOLED` to the direct URL as well — the migration runner
takes a session-level advisory lock, which the pooler cannot hold.

## Layout

```
src/
  config/env.ts        zod-validated environment; exits on misconfiguration
  db/pool.ts           pg pool, query/queryOne/withTransaction helpers
  db/migrate.ts        forward-only SQL runner (npm run migrate / migrate:status)
  db/migrations/       NNN_description.sql, immutable once applied
  lib/                 session (JWT), errors, ids, money, logger, http envelope
  middleware/          requireAuth, validate, errorHandler
  modules/<domain>/    routes → controller → service → repo
```

One folder per domain under `modules/`. Routers mount in `src/app.ts`.

## Conventions

**Response envelope** is `{ success: true, data }` / `{ success: false, error, code }`,
matching what the Next.js pages already parse. Do not change it until the
frontend is migrated off it.

**IDs** keep the canister format — `svc_`, `pkg_`, `bk_`, `user_` plus 21 base62
characters (`lib/ids.ts`). Migrated rows and new rows are indistinguishable, and
existing URLs such as `/freelancer/update-service/{id}/overview` keep resolving.

**Money** is `amount_minor BIGINT` + `currency TEXT`, never a float. `lib/money.ts`
has the conversions, the 5% platform-fee split, and the legacy e8s helper used
only by the import scripts.

**Timestamps** are `TIMESTAMPTZ`. The canisters stored nanosecond `Int`s, which
is why the frontend is full of `if (t > 1e15) t / 1e6` guessing — none of that
should survive the port.

**Optionals** are nullable columns. Candid encoded `?T` as `[value] | []`,
hence the `Array.isArray(x) ? x[0] : x` unwrapping everywhere. Also should not
survive.

**Transactions**: anything touching more than one table goes through
`withTransaction`. The actor model gave the canisters atomicity for free;
Postgres needs it asked for.

**Authorization**: `requireAuth` proves who someone is. It does not prove they
own the row — always scope mutations by `req.user.userId`. The canisters had no
ownership checks at all (`deleteService` deleted by ID for any caller); do not
carry that forward.

## Migrations

Forward-only. Files run once each in filename order, inside a transaction, and
are checksummed — editing one after it has run is an error. To change something,
add a new migration.

```bash
npm run migrate          # apply pending
npm run migrate:status   # applied / pending / modified
```

## Status

Phase 0 complete: scaffold, config, pool, migration runner, error handling,
session + auth middleware, health checks.

Next: Phase 1 — schema translated from the Motoko types, plus canister export
scripts (`getAllUsers()` in `../backend/canisters/user_v2.mo`, `getAllServices()`
in `../backend/canisters/marketplace.mo`).
