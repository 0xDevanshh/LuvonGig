/**
 * Runs every exporter in dependency order and writes a manifest.
 *
 * READ-ONLY: this calls query methods only and never updates a canister.
 * It does, however, write real user data — emails and password hashes — to
 * ./exports, which is gitignored and must stay that way.
 *
 *   npm run export
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { config, EXPORT_DIR } from '../config.js';
import { exportUsers } from './users.js';
import { exportMarketplace } from './marketplace.js';
import { exportJobs } from './jobs.js';
import { exportHackquest } from './hackquest.js';
import { exportSideStore } from './sideStore.js';

async function main(): Promise<void> {
  const startedAt = Date.now();

  console.log('LuvonGig canister export');
  console.log(`  host:        ${config.icHost}`);
  console.log(`  user:        ${config.canisters.user}`);
  console.log(`  marketplace: ${config.canisters.marketplace}`);
  console.log(`  jobs:        ${config.canisters.jobMarketplace || '(not configured)'}`);
  console.log(`  hackquest:   ${config.canisters.hackquest || '(not configured)'}`);
  console.log('');

  // Users first: the marketplace booking export iterates over them.
  await exportUsers();
  console.log('');
  await exportMarketplace();
  console.log('');
  await exportJobs();
  console.log('');
  await exportHackquest();
  console.log('');
  await exportSideStore();

  const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);

  await mkdir(EXPORT_DIR, { recursive: true });
  await writeFile(
    join(EXPORT_DIR, 'manifest.json'),
    JSON.stringify({ exportedAt: new Date().toISOString(), elapsedSeconds, source: config.canisters, host: config.icHost }, null, 2),
    'utf8',
  );

  console.log(`\nExport complete in ${elapsedSeconds}s. Files are in ./exports.`);
  console.log('These contain real emails and password hashes — do not commit or share them.');
}

main().catch((err) => {
  console.error('\nExport failed:', err);
  process.exit(1);
});
