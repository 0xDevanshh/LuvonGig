/**
 * Runs every importer in FK order against the Neon schema.
 *
 *   npm run import              rehearse (default) — rolls nothing back, but
 *                               exits non-zero if anything was skipped
 *   npm run import -- --confirm required when the target is NOT a Neon
 *                               preview branch
 *
 * Every importer is individually transactional and every write is an upsert
 * keyed on the original canister id, so the whole thing is safe to re-run.
 */
import { config } from '../config.js';
import { ImportReport, closePool, query } from './db.js';
import { importUsers } from './users.js';
import { importServices, importBookings } from './marketplace.js';
import { importJobs } from './jobs.js';
import { importHackquest } from './hackquest.js';

function describeTarget(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return '(unparseable DATABASE_URL)';
  }
}

/** Neon preview branches carry a distinct endpoint id; anything else is treated as precious. */
function looksLikePreview(url: string): boolean {
  return /preview|staging|-dev|test/i.test(url);
}

async function main(): Promise<void> {
  const confirmed = process.argv.includes('--confirm');
  const target = describeTarget(config.databaseUrl);

  console.log('LuvonGig canister -> Postgres import');
  console.log(`  target:   ${target}`);
  console.log(`  currency: ${config.importCurrency} (amounts are NOT converted — see README)`);
  console.log('');

  if (!looksLikePreview(config.databaseUrl) && !confirmed) {
    console.error('Refusing to run: DATABASE_URL does not look like a preview/staging branch.');
    console.error('Rehearse against a Neon preview branch first. To proceed anyway, pass --confirm.');
    process.exit(1);
  }

  const existing = await query<{ n: string }>('SELECT count(*)::text AS n FROM users');
  if (Number(existing.rows[0]?.n ?? 0) > 0) {
    console.log(`  note: ${existing.rows[0]?.n} user(s) already present — this run will upsert.\n`);
  }

  const report = new ImportReport();
  const startedAt = Date.now();

  // Order is dictated by foreign keys.
  await importUsers(report);
  await importServices(report);
  await importBookings(report);
  await importJobs(report);
  await importHackquest(report);

  report.print();
  console.log(`\nCompleted in ${Math.round((Date.now() - startedAt) / 1000)}s.`);

  if (report.hasProblems) {
    console.log(
      '\nSome records were skipped or adjusted. Review the summary above before\n' +
        'treating this import as complete, then run: npm run reconcile',
    );
  }

  await closePool();
  process.exit(report.hasProblems ? 1 : 0);
}

main().catch(async (err) => {
  console.error('\nImport failed:', err);
  await closePool();
  process.exit(1);
});
