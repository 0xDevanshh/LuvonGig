/**
 * Reports what the escrow canister still holds, and writes it to ./exports.
 *
 * READ-ONLY. It calls `get`, `get_deposit_account`, `get_treasury` and the
 * ledger's `icrc1_balance_of` — nothing that moves money or mutates state. The
 * escrow IDL in ../idl/escrow.did.js deliberately omits release and refund so
 * this cannot be pointed at them by accident.
 *
 *   npm run export:escrow                    ids from ./exports/marketplace.json
 *   npm run export:escrow -- --ids a:0,b:1   explicit ids
 *   npm run export:escrow -- --probe SVC_123 sweep SVC_123:0 .. :19
 *
 * WHY THIS IS AWKWARD: escrow.mo has no bulk query. `get` takes one id and
 * traps when it misses, and there is no `list`. Worse, the canister never
 * recorded an escrow id on the booking — the frontend reconstructed one as
 * `serviceId:N` and probed. So enumeration here means guessing the same way,
 * and an escrow whose project id we never learn is invisible to this script.
 * Treat a clean report as "nothing found among the ids we could name", not as
 * proof the canister is empty.
 *
 * Run this BEFORE the canisters are stopped. Afterwards there is nothing to
 * ask.
 */
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config, EXPORT_DIR } from '../config.js';
import { writeExport, readExport } from '../lib/output.js';
import { idlFactory as escrowIdl, ledgerIdlFactory } from '../idl/escrow.did.js';

/** ICP ledger. The same default escrow.mo compiles in. */
const ICP_LEDGER = 'ryjl3-tyaaa-aaaaa-aaaba-cai';

/** How far to sweep `projectId:N` when probing. Matches the old frontend. */
const PROBE_DEPTH = 20;

const E8S_PER_ICP = 100_000_000n;

export interface EscrowFinding {
  escrowId: string;
  projectId: string;
  status: string | null;
  client: string;
  freelancer: string;
  expectedE8s: string;
  /** What the ledger says is actually sitting in this escrow's subaccount. */
  balanceE8s: string;
  fundedAt: string | null;
  releasedAt: string | null;
  ledgerBlockIndex: string | null;
  plan: string | null;
}

function icp(e8s: bigint): string {
  const whole = e8s / E8S_PER_ICP;
  const frac = (e8s % E8S_PER_ICP).toString().padStart(8, '0');
  return `${whole}.${frac} ICP`;
}

function tag(variant: unknown): string | null {
  if (!variant || typeof variant !== 'object') return null;
  const keys = Object.keys(variant as Record<string, unknown>);
  return keys.length > 0 ? keys[0]! : null;
}

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : null;
}

/**
 * Candidate escrow ids, widest net we can cast.
 *
 * A booking's paymentId or transactionId sometimes IS the escrow id (they hold
 * `serviceId:N` when the booking was paid through escrow), so those are tried
 * verbatim; every service and booking id is then swept as `id:0 .. id:19`.
 */
async function candidateIds(): Promise<string[]> {
  const explicit = argValue('--ids');
  if (explicit) return explicit.split(',').map((s) => s.trim()).filter(Boolean);

  const probe = argValue('--probe');
  if (probe) {
    return Array.from({ length: PROBE_DEPTH }, (_, i) => `${probe}:${i}`);
  }

  let bookings: Array<Record<string, unknown>>;
  let services: Array<Record<string, unknown>>;
  try {
    bookings = (await readExport<Record<string, unknown>>('bookings')).records;
    services = (await readExport<Record<string, unknown>>('services')).records;
  } catch (err) {
    console.error(
      `${String(err)}\n\n` +
        'Run `npm run export` first, or name ids with --ids / --probe.',
    );
    process.exit(1);
  }

  const ids = new Set<string>();
  const seeds = new Set<string>();

  for (const b of bookings) {
    for (const key of ['paymentId', 'transactionId']) {
      const value = b[key];
      // Only an id shaped like the canister's escrow ids is worth trying as one.
      if (typeof value === 'string' && value.includes(':')) ids.add(value);
    }
    for (const key of ['serviceId', 'id']) {
      if (typeof b[key] === 'string') seeds.add(b[key] as string);
    }
  }
  for (const s of services) {
    if (typeof s.id === 'string') seeds.add(s.id);
  }

  for (const seed of seeds) {
    for (let i = 0; i < PROBE_DEPTH; i++) ids.add(`${seed}:${i}`);
  }

  return [...ids];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function exportEscrow(): Promise<void> {
  const canisterId = process.env.ESCROW_CANISTER_ID;
  if (!canisterId) {
    console.error(
      'ESCROW_CANISTER_ID is not set. Add it to migration-tools/.env\n' +
        '(the mainnet id is in ../backend/canister_ids.json under "escrow").',
    );
    process.exit(1);
  }

  const agent = new HttpAgent({ host: config.icHost });
  if (config.icHost.includes('localhost') || config.icHost.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }

  const escrow: any = Actor.createActor(escrowIdl as never, {
    agent,
    canisterId: Principal.fromText(canisterId),
  });
  const ledger: any = Actor.createActor(ledgerIdlFactory as never, {
    agent,
    canisterId: Principal.fromText(ICP_LEDGER),
  });

  console.log('Escrow canister inspection (read-only)');
  console.log(`  host:     ${config.icHost}`);
  console.log(`  escrow:   ${canisterId}`);
  console.log(`  ledger:   ${ICP_LEDGER}`);

  const treasury: Principal = await escrow.get_treasury();
  console.log(`  treasury: ${treasury.toText()}`);

  // The canister's own default account. Escrow deposits live in per-escrow
  // subaccounts, so this is usually zero — a non-zero value here is money that
  // belongs to no escrow and would be stranded by deletion.
  const unattributed: bigint = await ledger.icrc1_balance_of({
    owner: Principal.fromText(canisterId),
    subaccount: [],
  });
  console.log(`  default account: ${icp(unattributed)}`);

  const ids = await candidateIds();
  console.log(`\nProbing ${ids.length} candidate escrow id(s)...\n`);

  const findings: EscrowFinding[] = [];
  let probed = 0;

  for (const escrowId of ids) {
    probed++;
    if (probed % 100 === 0) console.log(`  ...${probed}/${ids.length}`);

    let record: any;
    try {
      record = await escrow.get(escrowId);
    } catch {
      // `get` traps when the id is unknown, which is the common case here.
      continue;
    }

    let balanceE8s = 0n;
    try {
      const account = await escrow.get_deposit_account(escrowId);
      balanceE8s = await ledger.icrc1_balance_of(account);
    } catch (err) {
      console.warn(`  ${escrowId}: found, but its balance could not be read — ${String(err)}`);
    }

    const status = tag(record.status);
    findings.push({
      escrowId,
      projectId: record.projectId,
      status,
      client: record.client.toText(),
      freelancer: record.freelancer.toText(),
      expectedE8s: String(record.expectedE8s),
      balanceE8s: String(balanceE8s),
      fundedAt: record.fundedAtNs?.[0] ? String(record.fundedAtNs[0]) : null,
      releasedAt: record.releaseAtNs?.[0] ? String(record.releaseAtNs[0]) : null,
      ledgerBlockIndex: record.ledgerBlockIndex?.[0] ? String(record.ledgerBlockIndex[0]) : null,
      plan: tag(record.plan),
    });

    console.log(`  ${escrowId}  ${status ?? 'unknown'}  holding ${icp(balanceE8s)}`);
  }

  const held = findings.filter((f) => BigInt(f.balanceE8s) > 0n);
  const totalHeld = held.reduce((sum, f) => sum + BigInt(f.balanceE8s), 0n);

  await writeExport('escrows', {
    canister: 'escrow',
    canisterId,
    host: config.icHost,
  }, findings);

  // The canister-level facts have no place in the per-record export file, and
  // they are the ones that decide whether deletion is safe.
  await writeFile(
    join(EXPORT_DIR, 'escrow_summary.json'),
    JSON.stringify({
      inspectedAt: new Date().toISOString(),
      canisterId,
      host: config.icHost,
      treasury: treasury.toText(),
      unattributedBalanceE8s: String(unattributed),
      candidatesProbed: ids.length,
      escrowsFound: findings.length,
      stillHoldingFunds: held.length,
      totalHeldE8s: String(totalHeld),
    }, null, 2),
    'utf8',
  );

  console.log('\n--- Summary ---');
  console.log(`  escrows found:        ${findings.length}`);
  console.log(`  still holding funds:  ${held.length}`);
  console.log(`  total still held:     ${icp(totalHeld)}`);
  console.log(`  unattributed:         ${icp(unattributed)}`);
  console.log('\nWritten to ./exports/escrows.json and ./exports/escrow_summary.json');

  if (totalHeld + unattributed > 0n) {
    console.log(
      '\nTHERE IS STILL ICP IN THIS CANISTER.\n' +
        'Deleting it strands these funds, and the application no longer has a\n' +
        'refund path — the escrow routes are gone. Drain it via dfx first.',
    );
  } else {
    console.log(
      '\nNo balance found among the ids probed. Note the caveat at the top of\n' +
        'this file: an escrow whose project id never appeared in the export is\n' +
        'not visible here.',
    );
  }
}

// Only run when invoked directly, so `npm run export` can import it instead.
if (import.meta.url === `file://${process.argv[1]}`) {
  exportEscrow().catch((err) => {
    console.error('\nEscrow inspection failed:', err);
    process.exit(1);
  });
}
