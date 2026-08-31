/**
 * Schema integration tests.
 *
 * These assert that the invariants the canisters enforced (badly, in
 * application code, or not at all) are now enforced by the database itself.
 * Every case here corresponds to a bug that was reachable in the Motoko
 * version — a duplicate review inflating a rating, a second bid from the same
 * freelancer, a booking whose fee and total disagree.
 *
 * Skipped when DATABASE_URL is absent so the unit-test run stays hermetic; CI
 * runs them in the migrations job against a throwaway Postgres.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closePool, query, withTransaction } from './pool.js';
import { newBookingId, newServiceId, newUserId, generateId } from '../lib/ids.js';

const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

/** Runs `fn` in a transaction that is always rolled back. */
async function inRollback(fn: (sql: (t: string, p?: unknown[]) => Promise<unknown>) => Promise<void>) {
  const sentinel = new Error('rollback');
  try {
    await withTransaction(async (client) => {
      await fn((text, params) => client.query(text, params as unknown[]));
      throw sentinel;
    });
  } catch (err) {
    if (err !== sentinel) throw err;
  }
}

type Sql = (t: string, p?: unknown[]) => Promise<unknown>;

async function makeUser(sql: Sql, suffix: string): Promise<string> {
  const id = newUserId();
  await sql('INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)', [
    id,
    `${suffix}-${id}@example.test`,
    'not-a-real-hash',
  ]);
  return id;
}

async function makeServiceWithPackage(sql: Sql, freelancerId: string) {
  const serviceId = newServiceId();
  const packageId = generateId('pkg');
  await sql('INSERT INTO services (id, freelancer_id, title, main_category) VALUES ($1,$2,$3,$4)', [
    serviceId, freelancerId, 'Test service', 'Web Development',
  ]);
  await sql(
    'INSERT INTO service_packages (id, service_id, tier, name, price_minor) VALUES ($1,$2,$3,$4,$5)',
    [packageId, serviceId, 'basic', 'Basic', 10_000],
  );
  return { serviceId, packageId };
}

async function makeBooking(sql: Sql, opts: {
  clientId: string; freelancerId: string; serviceId: string; packageId: string;
  total?: number; base?: number; fee?: number;
}) {
  const id = newBookingId();
  const total = opts.total ?? 10_000;
  const base = opts.base ?? 9_500;
  const fee = opts.fee ?? 500;
  await sql(
    `INSERT INTO bookings (id, service_id, package_id, client_id, freelancer_id, title,
       total_minor, base_amount_minor, platform_fee_minor)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, opts.serviceId, opts.packageId, opts.clientId, opts.freelancerId, 'Test booking', total, base, fee],
  );
  return id;
}

d('schema invariants', () => {
  beforeAll(async () => {
    // Fail loudly rather than silently passing against a schema-less database.
    const r = await query(
      `SELECT count(*)::int AS n FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name IN ('users','services','bookings','payments')`,
    );
    expect(r.rows[0]?.n).toBe(4);
  });

  afterAll(async () => {
    await closePool();
  });

  it('rejects a booking whose amounts do not balance', async () => {
    await inRollback(async (sql) => {
      const client = await makeUser(sql, 'c');
      const freelancer = await makeUser(sql, 'f');
      const { serviceId, packageId } = await makeServiceWithPackage(sql, freelancer);

      await expect(
        makeBooking(sql, { clientId: client, freelancerId: freelancer, serviceId, packageId,
          total: 10_000, base: 9_500, fee: 999 }),
      ).rejects.toThrow(/booking_amounts_balance/);
    });
  });

  it('rejects a booking where client and freelancer are the same person', async () => {
    await inRollback(async (sql) => {
      const user = await makeUser(sql, 'solo');
      const { serviceId, packageId } = await makeServiceWithPackage(sql, user);

      await expect(
        makeBooking(sql, { clientId: user, freelancerId: user, serviceId, packageId }),
      ).rejects.toThrow(/booking_parties_differ/);
    });
  });

  it('allows only one review per reviewer per booking', async () => {
    await inRollback(async (sql) => {
      const client = await makeUser(sql, 'c');
      const freelancer = await makeUser(sql, 'f');
      const { serviceId, packageId } = await makeServiceWithPackage(sql, freelancer);
      const bookingId = await makeBooking(sql, { clientId: client, freelancerId: freelancer, serviceId, packageId });

      const insertReview = () =>
        sql(`INSERT INTO reviews (id, booking_id, reviewer_id, reviewee_id, service_id, rating)
             VALUES ($1,$2,$3,$4,$5,$6)`,
          [generateId('rv'), bookingId, client, freelancer, serviceId, 5]);

      await insertReview();
      await expect(insertReview()).rejects.toThrow(/duplicate key|unique/i);
    });
  });

  it('maintains services.rating_avg and review_count by trigger', async () => {
    await inRollback(async (sql) => {
      const freelancer = await makeUser(sql, 'f');
      const c1 = await makeUser(sql, 'c1');
      const c2 = await makeUser(sql, 'c2');
      const { serviceId, packageId } = await makeServiceWithPackage(sql, freelancer);

      const b1 = await makeBooking(sql, { clientId: c1, freelancerId: freelancer, serviceId, packageId });
      const b2 = await makeBooking(sql, { clientId: c2, freelancerId: freelancer, serviceId, packageId });

      await sql(`INSERT INTO reviews (id, booking_id, reviewer_id, reviewee_id, service_id, rating)
                 VALUES ($1,$2,$3,$4,$5,$6)`, [generateId('rv'), b1, c1, freelancer, serviceId, 4]);
      await sql(`INSERT INTO reviews (id, booking_id, reviewer_id, reviewee_id, service_id, rating)
                 VALUES ($1,$2,$3,$4,$5,$6)`, [generateId('rv'), b2, c2, freelancer, serviceId, 5]);

      const res = (await sql('SELECT rating_avg, review_count FROM services WHERE id = $1', [serviceId])) as {
        rows: { rating_avg: string; review_count: number }[];
      };
      expect(Number(res.rows[0]?.rating_avg)).toBe(4.5);
      expect(res.rows[0]?.review_count).toBe(2);
    });
  });

  it('rejects a rating outside 1-5', async () => {
    await inRollback(async (sql) => {
      const client = await makeUser(sql, 'c');
      const freelancer = await makeUser(sql, 'f');
      const { serviceId, packageId } = await makeServiceWithPackage(sql, freelancer);
      const bookingId = await makeBooking(sql, { clientId: client, freelancerId: freelancer, serviceId, packageId });

      await expect(
        sql(`INSERT INTO reviews (id, booking_id, reviewer_id, reviewee_id, service_id, rating)
             VALUES ($1,$2,$3,$4,$5,$6)`, [generateId('rv'), bookingId, client, freelancer, serviceId, 9]),
      ).rejects.toThrow(/check constraint/i);
    });
  });

  it('treats emails case-insensitively', async () => {
    await inRollback(async (sql) => {
      const id = newUserId();
      await sql('INSERT INTO users (id, email, password_hash) VALUES ($1,$2,$3)', [id, 'Case@Example.test', 'h']);
      await expect(
        sql('INSERT INTO users (id, email, password_hash) VALUES ($1,$2,$3)', [newUserId(), 'case@example.test', 'h']),
      ).rejects.toThrow(/duplicate key|unique/i);
    });
  });

  it('allows only one package per tier per service', async () => {
    await inRollback(async (sql) => {
      const freelancer = await makeUser(sql, 'f');
      const { serviceId } = await makeServiceWithPackage(sql, freelancer);
      await expect(
        sql('INSERT INTO service_packages (id, service_id, tier, name, price_minor) VALUES ($1,$2,$3,$4,$5)',
          [generateId('pkg'), serviceId, 'basic', 'Duplicate basic', 5_000]),
      ).rejects.toThrow(/duplicate key|unique/i);
    });
  });

  it('allows only one bid per freelancer per job', async () => {
    await inRollback(async (sql) => {
      const client = await makeUser(sql, 'c');
      const freelancer = await makeUser(sql, 'f');
      const jobId = generateId('job');
      await sql('INSERT INTO job_posts (id, client_id, title) VALUES ($1,$2,$3)', [jobId, client, 'A job']);

      const bid = () => sql(
        'INSERT INTO proposals (id, job_id, freelancer_id, bid_minor) VALUES ($1,$2,$3,$4)',
        [generateId('prp'), jobId, freelancer, 5_000]);

      await bid();
      await expect(bid()).rejects.toThrow(/duplicate key|unique/i);
    });
  });

  it('rejects an assigned job with no freelancer', async () => {
    await inRollback(async (sql) => {
      const client = await makeUser(sql, 'c');
      await expect(
        sql('INSERT INTO job_posts (id, client_id, title, status) VALUES ($1,$2,$3,$4)',
          [generateId('job'), client, 'Orphan', 'assigned']),
      ).rejects.toThrow(/job_assignment_consistent/);
    });
  });

  it('allows only one active subscription per user', async () => {
    await inRollback(async (sql) => {
      const user = await makeUser(sql, 'u');
      const sub = () => sql(
        `INSERT INTO subscriptions (id, user_id, plan, status) VALUES ($1,$2,$3,'active')`,
        [generateId('sub'), user, 'Pro']);
      await sub();
      await expect(sub()).rejects.toThrow(/duplicate key|unique/i);
    });
  });

  it('deduplicates provider webhook events', async () => {
    await inRollback(async (sql) => {
      const evt = () => sql(
        `INSERT INTO payment_events (id, provider, provider_event_id, event_type, payload)
         VALUES ($1,'stripe','evt_same','payment_intent.succeeded','{}')`,
        [generateId('pev')]);
      await evt();
      await expect(evt()).rejects.toThrow(/duplicate key|unique/i);
    });
  });

  it('rejects a refund larger than the payment', async () => {
    await inRollback(async (sql) => {
      const payer = await makeUser(sql, 'p');
      const payee = await makeUser(sql, 'q');
      await expect(
        sql(`INSERT INTO payments (id, payer_id, payee_id, provider, amount_minor, refunded_minor)
             VALUES ($1,$2,$3,'stripe',1000,2000)`, [generateId('pay'), payer, payee]),
      ).rejects.toThrow(/refund_within_amount/);
    });
  });

  it('keeps one team per person per hackathon', async () => {
    await inRollback(async (sql) => {
      const organizer = await makeUser(sql, 'o');
      const member = await makeUser(sql, 'm');
      const hid = generateId('hack');
      await sql('INSERT INTO hackathons (id, organizer_id, title) VALUES ($1,$2,$3)', [hid, organizer, 'H']);

      const teamA = generateId('team');
      const teamB = generateId('team');
      for (const [t, name] of [[teamA, 'Team A'], [teamB, 'Team B']] as const) {
        await sql('INSERT INTO hackathon_teams (id, hackathon_id, name, leader_id) VALUES ($1,$2,$3,$4)',
          [t, hid, name, organizer]);
      }

      const join = (teamId: string) => sql(
        'INSERT INTO hackathon_team_members (team_id, hackathon_id, user_id) VALUES ($1,$2,$3)',
        [teamId, hid, member]);

      await join(teamA);
      await expect(join(teamB)).rejects.toThrow(/duplicate key|unique/i);
    });
  });

  it('rejects a team member whose hackathon disagrees with the team', async () => {
    await inRollback(async (sql) => {
      const organizer = await makeUser(sql, 'o');
      const member = await makeUser(sql, 'm');
      const h1 = generateId('hack');
      const h2 = generateId('hack');
      await sql('INSERT INTO hackathons (id, organizer_id, title) VALUES ($1,$2,$3)', [h1, organizer, 'H1']);
      await sql('INSERT INTO hackathons (id, organizer_id, title) VALUES ($1,$2,$3)', [h2, organizer, 'H2']);

      const team = generateId('team');
      await sql('INSERT INTO hackathon_teams (id, hackathon_id, name, leader_id) VALUES ($1,$2,$3,$4)',
        [team, h1, 'T', organizer]);

      await expect(
        sql('INSERT INTO hackathon_team_members (team_id, hackathon_id, user_id) VALUES ($1,$2,$3)',
          [team, h2, member]),
      ).rejects.toThrow(/foreign key/i);
    });
  });

  it('allows exactly one direct (booking-less) conversation per pair', async () => {
    await inRollback(async (sql) => {
      const a = await makeUser(sql, 'a');
      const b = await makeUser(sql, 'b');
      const rel = () => sql(
        'INSERT INTO chat_relationships (id, client_id, freelancer_id) VALUES ($1,$2,$3)',
        [generateId('rel'), a, b]);
      await rel();
      // Plain UNIQUE would allow this, because NULL != NULL.
      await expect(rel()).rejects.toThrow(/duplicate key|unique/i);
    });
  });
});
