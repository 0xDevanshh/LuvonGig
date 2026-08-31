import pg from 'pg';
import { config } from '../config.js';

const { Pool, types } = pg;

// Match backend_v1: BIGINT and NUMERIC stay strings so nothing rounds.
types.setTypeParser(20, (v) => v);
types.setTypeParser(1700, (v) => v);

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (pool) return pool;
  if (!config.databaseUrl) {
    console.error('DATABASE_URL is not set. Point it at a Neon PREVIEW branch for rehearsals.');
    process.exit(1);
  }
  pool = new Pool({ connectionString: config.databaseUrl, max: 4, connectionTimeoutMillis: 15_000 });
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) { await pool.end(); pool = null; }
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string, params: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params);
}

/**
 * Each importer runs inside one transaction: a partially imported entity is
 * far worse to reason about than one that failed cleanly and can be re-run.
 */
export async function withTransaction<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Per-entity outcome, collected into the final report. */
export class ImportReport {
  readonly inserted = new Map<string, number>();
  readonly skipped: { entity: string; id: string; reason: string }[] = [];
  readonly warnings: string[] = [];

  count(entity: string, n = 1): void {
    this.inserted.set(entity, (this.inserted.get(entity) ?? 0) + n);
  }

  skip(entity: string, id: string, reason: string): void {
    this.skipped.push({ entity, id, reason });
  }

  warn(message: string): void {
    this.warnings.push(message);
  }

  print(): void {
    console.log('\n─── Import summary ───');
    for (const [entity, n] of [...this.inserted.entries()].sort()) {
      console.log(`  ${entity.padEnd(28)} ${n}`);
    }

    if (this.skipped.length > 0) {
      console.log(`\n  Skipped: ${this.skipped.length}`);
      const byReason = new Map<string, number>();
      for (const s of this.skipped) {
        const key = `${s.entity}: ${s.reason}`;
        byReason.set(key, (byReason.get(key) ?? 0) + 1);
      }
      for (const [reason, n] of [...byReason.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`    ${n.toString().padStart(5)}  ${reason}`);
      }
    }

    if (this.warnings.length > 0) {
      console.log(`\n  Warnings: ${this.warnings.length}`);
      for (const w of this.warnings) console.log(`    - ${w}`);
    }
  }

  /** Non-zero exit when anything was dropped, so a rehearsal cannot look clean by accident. */
  get hasProblems(): boolean {
    return this.skipped.length > 0 || this.warnings.length > 0;
  }
}
