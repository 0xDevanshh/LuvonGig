# migration-tools

One-off tooling to move LuvonGig off the ICP canisters in [`../backend`](../backend)
and into the Neon Postgres schema owned by [`../backend_v1`](../backend_v1).

**This package is temporary.** It exists only to carry data across, and holds
the only `@dfinity/*` dependencies left in the project — deliberately kept out
of `backend_v1` so the new backend never depends on IC. Delete the whole
directory at Phase 8.

## Setup

```bash
cd migration-tools
npm install
cp .env.example .env    # canister IDs are pre-filled from ../backend/canister_ids.json
```

## Export

```bash
npm run export              # everything, in dependency order
npm run export:users        # or one source at a time
npm run export:marketplace
npm run export:jobs
npm run export:hackquest
npm run export:sidestore
```

The escrow canister is not in this list — see [Escrow](#escrow) below.

Reads canister query methods only — nothing is ever written back to a canister.

Output lands in `./exports`, which is gitignored and **must stay that way**:
`users.json` contains real email addresses and argon2id password hashes.

Run the export **before** the canisters are stopped in Phase 8. Once they are
gone the data is unrecoverable.

### Order matters

`marketplace` needs `users.json` to already exist — bookings have no bulk
endpoint, so they are gathered by iterating users in both roles and deduping.
`npm run export` handles this; running the steps by hand does not.

## Escrow

```bash
npm run export:escrow                     # ids from ./exports (run the export first)
npm run export:escrow -- --ids SVC_1:0    # or name them
npm run export:escrow -- --probe SVC_1    # or sweep SVC_1:0 .. :19
```

Deliberately **not** part of `npm run export`, and it answers a different
question: not "what records are here" but "is there still money here". Deleting
the escrow canister with ICP inside strands those funds permanently, and the
application no longer has a refund path — the escrow routes were removed in
Phase 8. Writes `escrows.json` and `escrow_summary.json`.

Read-only, and structurally so: `src/idl/escrow.did.js` declares only the query
methods, so `release` and `refund` are not reachable from this package at all.

Its enumeration is a best effort, because escrow.mo has no bulk query — `get`
takes one id and traps when it misses. The canister also never stored an escrow
id on the booking, so ids have to be guessed from booking and service ids the
same way the old frontend guessed them. **A clean report means "nothing found
among the ids we could name", not "the canister is empty."**

## Import

Reads `./exports` and upserts into the schema, keyed on the original canister
IDs, so re-running is safe and existing URLs keep resolving.

```bash
npm run import              # rehearse; exits non-zero if anything was skipped
npm run import -- --confirm # required unless DATABASE_URL is a preview branch
npm run reconcile           # compare row counts against the exports
```

## What the exporters handle

**Optionals.** Candid encodes `?T` as `[value] | []`. Unwrapped once in
`lib/candid.ts` instead of the `Array.isArray(x) ? x[0] : x` scattered through
the frontend today.

**Timestamps.** Motoko `Time.now()` is nanoseconds. Converted to ISO strings,
with two rejections: the `0` sentinel the canisters used where they needed a
real optional, and values that are actually milliseconds or seconds sitting in
a nanosecond field — those land in 1970 and are corrupt, not merely old.

**BigInt.** `JSON.stringify` throws on it; amounts are serialised as strings so
nothing is rounded through a float.

**Money is NOT converted.** Amounts are exported as raw e8s. There is no
honest exchange rate between "5 ICP" and the price a freelancer meant in
dollars, so the import flags these rows `price_needs_review` for their owner to
confirm. `job_marketplace` is worse: its `budgetAmount` is a bare `Nat` with no
recorded unit at all.

**Principals.** hackquest keys organisers, team leaders and members by
Principal, which stops meaning anything once the canisters are gone. Each is
exported as text alongside `hackathon_principal_map.json`, resolving them to
emails via the `Participant` records. Principals with no participant record
cannot be mapped and are reported rather than silently dropped.

## Two things the exporters correct

`src/idl/job_marketplace.did.js` adds the `isPaid` field that
`frontend/lib/job-marketplace-agent.ts` omits. Candid subtyping drops unknown
fields silently, so without this every job would import as unpaid.

`src/export/sideStore.ts` captures `frontend/tmp/service-data/services.json` —
FAQs, client questions, tier mode and cover images that exist in no canister,
written to a filesystem that does not persist on Vercel. If the file is
missing, that content is already lost and the import proceeds without it.

## Verification

`npm test` covers the Candid conversions against fixtures; `npm run typecheck`
covers the rest. The exporters have **not** been run against mainnet — that is
deliberate, and is yours to do when you are ready to test.
