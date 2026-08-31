/**
 * Minimal forward-only SQL migration runner.
 *
 * Files live in `src/db/migrations` and are named `NNN_description.sql`. They
 * run once each, in filename order, every one inside a transaction. Applied
 * migrations are recorded in `_migrations` along with a checksum, so editing a
 * file that has already run is caught rather than silently ignored.
 *
 *   npm run migrate          apply everything pending
 *   npm run migrate:status   show applied / pending
 *
 * Forward-only on purpose: `CREATE TABLE IF NOT EXISTS` scattered through the
 * app (the pattern in frontend/lib/db/chat-db.ts) can't express column changes
 * and leaves no record of what ran. To undo, write a new migration.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { env } from '../config/env.js';

const { Client } = pg;
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

// Any Postgres session can take this; a second migrator blocks until the first
// finishes rather than both racing to create the same table.
const ADVISORY_LOCK_KEY = 4_827_301;

interface MigrationFile {
  name: string;
  sql: string;
  checksum: string;
}

interface AppliedRow {
  name: string;
  checksum: string;
  applied_at: Date;
}

async function loadMigrations(): Promise<MigrationFile[]> {
  let entries: string[];
  try {
    entries = await readdir(MIGRATIONS_DIR);
  } catch {
    return [];
  }

  const files = entries.filter((f) => f.endsWith('.sql')).sort();

  return Promise.all(
    files.map(async (name) => {
      const sql = await readFile(join(MIGRATIONS_DIR, name), 'utf8');
      return { name, sql, checksum: createHash('sha256').update(sql).digest('hex').slice(0, 16) };
    }),
  );
}

async function connect(): Promise<pg.Client> {
  // Session mode, not the pooler: advisory locks must outlive a single statement.
  const client = new Client({ connectionString: env.migrationDatabaseUrl });
  await client.connect();
  return client;
}

async function ensureMigrationsTable(client: pg.Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY,
      checksum   TEXT        NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function getApplied(client: pg.Client): Promise<Map<string, AppliedRow>> {
  const { rows } = await client.query<AppliedRow>('SELECT name, checksum, applied_at FROM _migrations');
  return new Map(rows.map((r) => [r.name, r]));
}

async function up(): Promise<void> {
  const client = await connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);
    await ensureMigrationsTable(client);

    const migrations = await loadMigrations();
    const applied = await getApplied(client);

    for (const migration of migrations) {
      const record = applied.get(migration.name);
      if (record) {
        if (record.checksum !== migration.checksum) {
          throw new Error(
            `Migration "${migration.name}" changed after it was applied ` +
              `(recorded ${record.checksum}, file is ${migration.checksum}). ` +
              `Migrations are immutable once run — add a new one instead.`,
          );
        }
        continue;
      }

      process.stdout.write(`  applying ${migration.name} ... `);
      try {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query('INSERT INTO _migrations (name, checksum) VALUES ($1, $2)', [
          migration.name,
          migration.checksum,
        ]);
        await client.query('COMMIT');
        process.stdout.write('ok\n');
      } catch (err) {
        await client.query('ROLLBACK');
        process.stdout.write('failed\n');
        throw err;
      }
    }

    const pending = migrations.filter((m) => !applied.has(m.name)).length;
    console.log(pending === 0 ? 'Already up to date.' : `Applied ${pending} migration(s).`);
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]).catch(() => {});
    await client.end();
  }
}

async function status(): Promise<void> {
  const client = await connect();
  try {
    await ensureMigrationsTable(client);
    const migrations = await loadMigrations();
    const applied = await getApplied(client);

    if (migrations.length === 0) {
      console.log('No migration files found in src/db/migrations.');
      return;
    }

    for (const migration of migrations) {
      const record = applied.get(migration.name);
      if (!record) {
        console.log(`  pending   ${migration.name}`);
      } else if (record.checksum !== migration.checksum) {
        console.log(`  MODIFIED  ${migration.name}  (checksum mismatch)`);
      } else {
        console.log(`  applied   ${migration.name}  ${record.applied_at.toISOString()}`);
      }
    }

    const orphans = [...applied.keys()].filter((n) => !migrations.some((m) => m.name === n));
    for (const name of orphans) {
      console.log(`  MISSING   ${name}  (recorded as applied, file is gone)`);
    }
  } finally {
    await client.end();
  }
}

const command = process.argv[2] ?? 'up';

const run = command === 'status' ? status : command === 'up' ? up : null;

if (!run) {
  console.error(`Unknown command "${command}". Use "up" or "status".`);
  process.exit(1);
}

run().catch((err) => {
  console.error(`\nMigration ${command} failed:\n`, err instanceof Error ? err.message : err);
  process.exit(1);
});
