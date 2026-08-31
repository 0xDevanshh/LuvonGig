import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

const { Pool, types } = pg;

// BIGINT (oid 20) arrives as a JS string by default, which is correct — Number
// would silently lose precision past 2^53. Money and timestamps stay strings
// until a repository converts them deliberately.
types.setTypeParser(20, (value) => value);

// NUMERIC (oid 1700) likewise stays a string.
types.setTypeParser(1700, (value) => value);

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (pool) return pool;

  pool = new Pool({
    connectionString: env.DATABASE_URL,
    // Neon's pooler multiplexes for us, so each instance needs far fewer
    // client connections than a direct Postgres would.
    max: env.isProduction ? 10 : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // Neon closes idle connections; keepalive avoids surfacing that as an error.
    keepAlive: true,
  });

  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected error on idle database client');
  });

  return pool;
}

export type QueryParams = ReadonlyArray<unknown>;

/** Run a single query on a pooled connection. */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: QueryParams = [],
): Promise<pg.QueryResult<T>> {
  const startedAt = performance.now();
  try {
    return await getPool().query<T>(text, params as unknown[]);
  } finally {
    const durationMs = performance.now() - startedAt;
    if (durationMs > 500) {
      logger.warn({ durationMs: Math.round(durationMs), sql: text.slice(0, 200) }, 'Slow query');
    }
  }
}

/** First row, or null. */
export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: QueryParams = [],
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

/**
 * Run `fn` inside a transaction on a single dedicated connection, committing on
 * success and rolling back on any thrown error.
 *
 * Anything spanning more than one table — creating a booking and its timeline
 * event, releasing escrow and marking a stage approved — belongs in here. The
 * canisters got atomicity for free from the actor model; in Postgres it has to
 * be asked for.
 */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch((rollbackErr) => {
      logger.error({ err: rollbackErr }, 'Rollback failed');
    });
    throw err;
  } finally {
    client.release();
  }
}

export async function checkConnection(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (err) {
    logger.error({ err }, 'Database health check failed');
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
}
