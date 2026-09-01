import net from 'node:net';
import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/**
 * Disable Node's "happy eyeballs" connection racing.
 *
 * Node 20+ enables autoSelectFamily by default: it resolves a host to both A
 * and AAAA records and races connections to them. On some networks — including
 * the one this was developed on — that path stalls and surfaces as
 * `AggregateError: ETIMEDOUT` from `internalConnectMultiple`, even though the
 * host is perfectly reachable (psql to the same URL connects instantly).
 *
 * It presents as intermittent database timeouts under load and is easy to
 * misdiagnose as pool exhaustion or the provider suspending. Neon publishes
 * only A records, so racing families buys nothing here.
 *
 * Set here rather than in server.ts because tests and the migration runner
 * need it too, and every one of them imports this module.
 */
if (typeof net.setDefaultAutoSelectFamily === 'function') {
  net.setDefaultAutoSelectFamily(false);
}

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
    // Generous, because a cold Neon compute can take several seconds to wake.
    // `query` retries on top of this; a too-short timeout just turns a slow
    // wake-up into a retry storm.
    connectionTimeoutMillis: 30_000,
    // Neon closes idle connections; keepalive avoids surfacing that as an error.
    keepAlive: true,
  });

  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected error on idle database client');
  });

  return pool;
}

export type QueryParams = ReadonlyArray<unknown>;

/**
 * Failures that mean "the connection was not usable", as opposed to "the
 * statement was wrong". Only these are worth retrying: a constraint violation
 * or a syntax error will fail identically every time.
 *
 * Neon suspends compute after a period of inactivity, and the connection that
 * wakes it can exceed connectionTimeoutMillis. That is a normal part of
 * running on serverless Postgres, not an outage — but without a retry it
 * surfaces as a 500 on the first request after any quiet period.
 */
function isTransientConnectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { message?: string; code?: string };
  if (e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT' || e.code === 'ECONNREFUSED') return true;
  const message = e.message ?? '';
  return (
    message.includes('Connection terminated') ||
    message.includes('connection timeout') ||
    message.includes('Client has encountered a connection error') ||
    message.includes('server closed the connection unexpectedly') ||
    message.includes('terminating connection due to administrator command')
  );
}

const RETRY_DELAYS_MS = [250, 1_000, 3_000];

/**
 * Run a single query on a pooled connection, retrying only connection-level
 * failures.
 *
 * NOT safe for statements inside a transaction — a retry there would run
 * against a different connection with no transaction open. `withTransaction`
 * deliberately uses the raw client instead.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: QueryParams = [],
): Promise<pg.QueryResult<T>> {
  const startedAt = performance.now();
  try {
    let lastError: unknown;

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        return await getPool().query<T>(text, params as unknown[]);
      } catch (err) {
        lastError = err;
        if (!isTransientConnectionError(err) || attempt === RETRY_DELAYS_MS.length) break;

        const delay = RETRY_DELAYS_MS[attempt]!;
        logger.warn(
          { attempt: attempt + 1, delayMs: delay, err: (err as Error).message },
          'Transient database connection failure — retrying',
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  } finally {
    const durationMs = performance.now() - startedAt;
    if (durationMs > 2_000) {
      logger.warn({ durationMs: Math.round(durationMs), sql: text.slice(0, 120) }, 'Slow query');
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
