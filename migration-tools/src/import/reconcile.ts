/**
 * Compares what was exported against what landed in Postgres.
 *
 * A row count alone would not catch the failure that matters most here —
 * rows that arrived but lost a relationship, or money that came across with
 * no reviewable flag — so this also reports orphans and unpriced rows.
 *
 *   npm run reconcile
 */
import { query, closePool } from './db.js';
import { readExport } from '../lib/output.js';

interface Row { n: string }

async function count(sql: string): Promise<number> {
  const { rows } = await query<Row>(sql);
  return Number(rows[0]?.n ?? 0);
}

async function exportedCount(name: string): Promise<number | null> {
  try {
    return (await readExport<unknown>(name)).count;
  } catch {
    return null;
  }
}

function line(label: string, exported: number | null, imported: number): void {
  const exp = exported === null ? '   —' : String(exported).padStart(6);
  const imp = String(imported).padStart(6);
  let verdict = '';
  if (exported !== null) {
    const delta = imported - exported;
    verdict = delta === 0 ? 'ok' : delta < 0 ? `MISSING ${-delta}` : `+${delta} (upsert or derived)`;
  }
  console.log(`  ${label.padEnd(28)} ${exp} ${imp}   ${verdict}`);
}

async function main(): Promise<void> {
  console.log('Reconciliation\n');
  console.log(`  ${'entity'.padEnd(28)} ${'export'.padStart(6)} ${'db'.padStart(6)}   verdict`);
  console.log(`  ${'-'.repeat(28)} ${'-'.repeat(6)} ${'-'.repeat(6)}   ${'-'.repeat(24)}`);

  line('users', await exportedCount('users'), await count('SELECT count(*)::text n FROM users'));
  line('user_profiles', null, await count('SELECT count(*)::text n FROM user_profiles'));
  line('experiences', null, await count('SELECT count(*)::text n FROM experiences'));
  line('educations', null, await count('SELECT count(*)::text n FROM educations'));
  line('services', await exportedCount('services'), await count('SELECT count(*)::text n FROM services'));
  line('service_packages', await exportedCount('packages'), await count('SELECT count(*)::text n FROM service_packages'));
  line('bookings', await exportedCount('bookings'), await count('SELECT count(*)::text n FROM bookings'));
  line('reviews', null, await count('SELECT count(*)::text n FROM reviews'));
  line('job_posts', await exportedCount('jobs'), await count('SELECT count(*)::text n FROM job_posts'));
  line('proposals', await exportedCount('proposals'), await count('SELECT count(*)::text n FROM proposals'));
  line('hackathons', await exportedCount('hackathons'), await count('SELECT count(*)::text n FROM hackathons'));
  line('hackathon_categories', await exportedCount('hackathon_categories'), await count('SELECT count(*)::text n FROM hackathon_categories'));
  line('hackathon_rewards', await exportedCount('hackathon_rewards'), await count('SELECT count(*)::text n FROM hackathon_rewards'));
  line('hackathon_teams', await exportedCount('hackathon_teams'), await count('SELECT count(*)::text n FROM hackathon_teams'));
  line('hackathon_submissions', await exportedCount('hackathon_submissions'), await count('SELECT count(*)::text n FROM hackathon_submissions'));

  console.log('\nNeeds attention before go-live\n');

  const pricedServices = await count(
    'SELECT count(*)::text n FROM services WHERE price_needs_review');
  const pricedPackages = await count(
    'SELECT count(*)::text n FROM service_packages WHERE price_needs_review');
  const pricedJobs = await count(
    'SELECT count(*)::text n FROM job_posts WHERE price_needs_review');

  console.log(`  services awaiting a price      ${String(pricedServices).padStart(6)}`);
  console.log(`  packages awaiting a price      ${String(pricedPackages).padStart(6)}`);
  console.log(`  job posts awaiting a budget    ${String(pricedJobs).padStart(6)}`);
  console.log(`  (all hold their original amount in legacy_*; minor columns are 0)`);

  const pausedForPrice = await count(
    `SELECT count(*)::text n FROM services WHERE status = 'paused' AND price_needs_review`);
  console.log(`  services paused pending repricing ${String(pausedForPrice).padStart(3)}`);

  console.log('\nIntegrity\n');

  const servicesNoPackages = await count(
    `SELECT count(*)::text n FROM services s
      WHERE NOT EXISTS (SELECT 1 FROM service_packages p WHERE p.service_id = s.id)`);
  const usersNoProfile = await count(
    `SELECT count(*)::text n FROM users u
      WHERE NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.user_id = u.id)`);
  const teamsNoMembers = await count(
    `SELECT count(*)::text n FROM hackathon_teams t
      WHERE NOT EXISTS (SELECT 1 FROM hackathon_team_members m WHERE m.team_id = t.id)`);
  const unverified = await count(
    `SELECT count(*)::text n FROM users WHERE NOT is_verified`);

  console.log(`  services with no packages      ${String(servicesNoPackages).padStart(6)}`);
  console.log(`  users with no profile          ${String(usersNoProfile).padStart(6)}`);
  console.log(`  teams with no members          ${String(teamsNoMembers).padStart(6)}`);
  console.log(`  unverified users               ${String(unverified).padStart(6)}`);

  // Password hashes are the migration's load-bearing assumption: if any row
  // is not argon2id, that person cannot log in.
  const badHashes = await count(
    `SELECT count(*)::text n FROM users WHERE password_hash NOT LIKE '$argon2id$%'`);
  console.log(`\n  users whose hash is NOT argon2id ${String(badHashes).padStart(4)}` +
    (badHashes > 0 ? '   <-- these people cannot log in; investigate' : '   (all can log in)'));

  await closePool();
}

main().catch(async (err) => {
  console.error('Reconciliation failed:', err);
  await closePool();
  process.exit(1);
});
