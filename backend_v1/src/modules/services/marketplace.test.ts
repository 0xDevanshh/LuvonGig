/**
 * Marketplace integration tests.
 *
 * The ownership cases are the point of this phase: the canister's
 * deleteService(service_id) deleted any service for any caller, and
 * updateService was equally unscoped. Those tests must never be relaxed.
 */
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { query } from '../../db/pool.js';

const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

const app = createApp();
const PASSWORD = 'CorrectHorse1';
const created: string[] = [];

let seq = 0;
const freshEmail = () => `p3-${process.pid}-${Date.now()}-${seq++}@example.test`;

async function signedInUser() {
  const email = freshEmail();
  created.push(email);
  await request(app).post('/api/auth/signup').send({ email, password: PASSWORD });
  const { rows } = await query<{ code: string }>(
    'SELECT code FROM otp_codes WHERE email = $1', [email]);
  const verify = await request(app)
    .post('/api/auth/verify-otp').send({ email, otp: rows[0]!.code });
  const cookie = (verify.headers['set-cookie'] as unknown as string[])[0]!;
  const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
  return { email, cookie, userId: me.body.session.userId as string };
}

const serviceBody = (over: Record<string, unknown> = {}) => ({
  title: 'Landing page build',
  main_category: 'Web Development',
  sub_category: 'Frontend',
  description: 'A fast, responsive landing page.',
  whats_included: 'Design and build',
  tags: ['react', 'css'],
  packages: [
    { tier: 'basic', name: 'Basic', price_minor: 10000, delivery_time_days: 3, revisions: 1 },
    { tier: 'premium', name: 'Premium', price_minor: 50000, delivery_time_days: 7, revisions: 5 },
  ],
  ...over,
});

async function createService(cookie: string, over: Record<string, unknown> = {}) {
  const res = await request(app).post('/api/services').set('Cookie', cookie).send(serviceBody(over));
  expect(res.status).toBe(201);
  return res.body.data;
}

afterAll(async () => {
  // One statement per table, not one per user: this suite creates ~50 accounts
  // and a round trip each to Neon overruns the hook timeout.
  //
  // Bookings go first. bookings.freelancer_id is ON DELETE RESTRICT, so the
  // database refuses to remove a user who has any — deliberately, since
  // deleting a party would orphan a financial record. Only test fixtures get
  // to bypass that, and only by removing the bookings first.
  if (created.length > 0) {
    await query(
      `DELETE FROM bookings WHERE client_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))
          OR freelancer_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))`,
      [created],
    );
    await query('DELETE FROM otp_codes WHERE email = ANY($1::citext[])', [created]);
    await query('DELETE FROM users WHERE email = ANY($1::citext[])', [created]);
  }
});

d('services', () => {
  it('creates a service with its packages in one call', async () => {
    const { cookie, userId } = await signedInUser();
    const service = await createService(cookie);

    expect(service.service_id).toMatch(/^svc_/);
    expect(service.freelancer_id).toBe(userId);
    expect(service.packages).toHaveLength(2);
    // Cheapest first.
    expect(service.packages[0].tier).toBe('Basic');
    // starting_from is derived from the packages, not trusted from input.
    expect(service.starting_from_minor).toBe('10000');
  });

  it('rejects two packages on the same tier', async () => {
    const { cookie } = await signedInUser();
    const res = await request(app).post('/api/services').set('Cookie', cookie).send(serviceBody({
      packages: [
        { tier: 'basic', name: 'One', price_minor: 100 },
        { tier: 'basic', name: 'Two', price_minor: 200 },
      ],
    }));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/different tier/i);
  });

  it('requires a session to create', async () => {
    const res = await request(app).post('/api/services').send(serviceBody());
    expect(res.status).toBe(401);
  });

  it('lists and filters by freelancer_email', async () => {
    const owner = await signedInUser();
    await createService(owner.cookie, { title: 'Unique-marker-service' });

    const mine = await request(app).get(`/api/services?freelancer_email=${owner.email}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data.length).toBeGreaterThan(0);
    expect(mine.body.data.every((s: { freelancer_email: string }) => s.freelancer_email === owner.email)).toBe(true);
    expect(typeof mine.body.total).toBe('number');

    const other = await signedInUser();
    const theirs = await request(app).get(`/api/services?freelancer_email=${other.email}`);
    expect(theirs.body.data).toHaveLength(0);
  });

  it('searches by term', async () => {
    const { cookie } = await signedInUser();
    await createService(cookie, { title: 'Zzyzx quantum widget factory' });

    const hit = await request(app).get('/api/services?search_term=zzyzx quantum');
    expect(hit.body.data.length).toBeGreaterThan(0);

    const miss = await request(app).get('/api/services?search_term=nothingmatchesthisxyzzy');
    expect(miss.body.data).toHaveLength(0);
  });

  describe('ownership', () => {
    it('will not let a stranger delete a service', async () => {
      const owner = await signedInUser();
      const attacker = await signedInUser();
      const service = await createService(owner.cookie);

      // This is exactly what marketplace.mo allowed.
      const res = await request(app)
        .delete(`/api/services/${service.service_id}`).set('Cookie', attacker.cookie);
      expect(res.status).toBe(404);

      const still = await request(app).get(`/api/services/${service.service_id}`);
      expect(still.status).toBe(200);
    });

    it('will not let a stranger edit a service', async () => {
      const owner = await signedInUser();
      const attacker = await signedInUser();
      const service = await createService(owner.cookie);

      const res = await request(app).put(`/api/services/${service.service_id}`)
        .set('Cookie', attacker.cookie).send({ title: 'Hijacked' });
      expect(res.status).toBe(403);

      const check = await request(app).get(`/api/services/${service.service_id}`);
      expect(check.body.data.title).toBe('Landing page build');
    });

    it('lets the owner delete, and hides it afterwards', async () => {
      const owner = await signedInUser();
      const service = await createService(owner.cookie);

      const res = await request(app)
        .delete(`/api/services/${service.service_id}`).set('Cookie', owner.cookie);
      expect(res.status).toBe(200);

      expect((await request(app).get(`/api/services/${service.service_id}`)).status).toBe(404);
      // Soft delete: the row survives for referential integrity.
      const { rows } = await query<{ status: string }>(
        'SELECT status FROM services WHERE id = $1', [service.service_id]);
      expect(rows[0]!.status).toBe('deleted');
    });

    it('will not let a stranger edit a package', async () => {
      const owner = await signedInUser();
      const attacker = await signedInUser();
      const service = await createService(owner.cookie);
      const pkgId = service.packages[0].package_id;

      const res = await request(app).put(`/api/packages/${pkgId}`)
        .set('Cookie', attacker.cookie).send({ price_minor: 1 });
      expect(res.status).toBe(403);
    });
  });

  describe('status toggle', () => {
    it('pauses and resumes — the thing the canister route refused', async () => {
      const owner = await signedInUser();
      const service = await createService(owner.cookie);

      // The old route answered "Service status updates are not supported yet".
      const paused = await request(app).put(`/api/services/${service.service_id}`)
        .set('Cookie', owner.cookie).send({ status: 'paused' });
      expect(paused.status).toBe(200);
      expect(paused.body.data.status).toBe('Paused');

      // Gone from the public listing...
      const publicList = await request(app).get('/api/services?limit=100');
      expect(publicList.body.data.some((s: { service_id: string }) => s.service_id === service.service_id)).toBe(false);

      // ...but still visible to its owner, who needs to edit it.
      const ownList = await request(app)
        .get(`/api/services?freelancer_email=${owner.email}`).set('Cookie', owner.cookie);
      expect(ownList.body.data.some((s: { service_id: string }) => s.service_id === service.service_id)).toBe(true);

      const resumed = await request(app).put(`/api/services/${service.service_id}`)
        .set('Cookie', owner.cookie).send({ status: 'active' });
      expect(resumed.body.data.status).toBe('Active');
    });
  });

  it('keeps starting_from in step with package changes', async () => {
    const owner = await signedInUser();
    const service = await createService(owner.cookie);
    expect(service.starting_from_minor).toBe('10000');

    const cheaper = await request(app).put(`/api/packages/${service.packages[0].package_id}`)
      .set('Cookie', owner.cookie).send({ price_minor: 500 });
    expect(cheaper.status).toBe(200);

    const after = await request(app).get(`/api/services/${service.service_id}`);
    expect(after.body.data.starting_from_minor).toBe('500');
  });
});

d('bookings', () => {
  /** A client, a freelancer, and a bookable service between them. */
  async function scenario() {
    const freelancer = await signedInUser();
    const client = await signedInUser();
    const service = await createService(freelancer.cookie);
    return { freelancer, client, service, packageId: service.packages[0].package_id as string };
  }

  async function book(clientCookie: string, packageId: string) {
    const res = await request(app).post('/api/bookings')
      .set('Cookie', clientCookie).send({ package_id: packageId, requirements: ['Logo files'] });
    expect(res.status).toBe(201);
    return res.body.data;
  }

  it('creates a booking with a fee split that balances', async () => {
    const { client, packageId } = await scenario();
    const booking = await book(client.cookie, packageId);

    expect(booking.booking_id).toMatch(/^bk_/);
    expect(booking.status).toBe('Pending');
    // 5% of 10000, rounded down.
    expect(booking.base_amount_minor).toBe('10000');
    expect(booking.platform_fee_minor).toBe('500');
    expect(booking.total_minor).toBe('10500');
    // The terms as agreed, frozen.
    expect(booking.package_snapshot.tier).toBe('basic');
    expect(booking.package_snapshot.price_minor).toBe('10000');
  });

  it('records a booking_created timeline event in the same transaction', async () => {
    const { client, packageId } = await scenario();
    const booking = await book(client.cookie, packageId);

    const res = await request(app)
      .get(`/api/bookings/${booking.booking_id}/timeline`).set('Cookie', client.cookie);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].event_type).toBe('booking_created');
  });

  it('refuses a self-booking', async () => {
    const { freelancer, packageId } = await scenario();
    const res = await request(app).post('/api/bookings')
      .set('Cookie', freelancer.cookie).send({ package_id: packageId });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/your own service/i);
  });

  it('refuses to book a paused service', async () => {
    const { freelancer, client, service, packageId } = await scenario();
    await request(app).put(`/api/services/${service.service_id}`)
      .set('Cookie', freelancer.cookie).send({ status: 'paused' });

    const res = await request(app).post('/api/bookings')
      .set('Cookie', client.cookie).send({ package_id: packageId });
    expect(res.status).toBe(400);
  });

  it('refuses to book a service still awaiting repricing', async () => {
    const { client, service, packageId } = await scenario();
    // Simulates a migrated row.
    await query('UPDATE services SET price_needs_review = true WHERE id = $1', [service.service_id]);

    const res = await request(app).post('/api/bookings')
      .set('Cookie', client.cookie).send({ package_id: packageId });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/repriced/i);
  });

  it('hides a booking from everyone but its two parties', async () => {
    const { client, packageId } = await scenario();
    const stranger = await signedInUser();
    const booking = await book(client.cookie, packageId);

    // 404 rather than 403: a 403 would confirm the id exists.
    const res = await request(app)
      .get(`/api/bookings/${booking.booking_id}`).set('Cookie', stranger.cookie);
    expect(res.status).toBe(404);

    const list = await request(app).get('/api/bookings').set('Cookie', stranger.cookie);
    expect(list.body.data).toHaveLength(0);
  });

  it('lists by role', async () => {
    const { freelancer, client, packageId } = await scenario();
    await book(client.cookie, packageId);

    const asClient = await request(app).get('/api/bookings?role=client').set('Cookie', client.cookie);
    expect(asClient.body.data).toHaveLength(1);

    const asFreelancer = await request(app)
      .get('/api/bookings?role=freelancer').set('Cookie', freelancer.cookie);
    expect(asFreelancer.body.data).toHaveLength(1);

    // The client has no bookings in the freelancer role.
    const wrongRole = await request(app)
      .get('/api/bookings?role=freelancer').set('Cookie', client.cookie);
    expect(wrongRole.body.data).toHaveLength(0);
  });

  describe('state machine', () => {
    it('refuses an illegal transition', async () => {
      const { freelancer, client, packageId } = await scenario();
      const booking = await book(client.cookie, packageId);

      // pending -> completed skips active; the canister allowed it.
      const res = await request(app).put(`/api/bookings/${booking.booking_id}/status`)
        .set('Cookie', freelancer.cookie).send({ status: 'completed' });
      expect(res.status).toBe(409);
    });

    it('enforces who may make a transition', async () => {
      const { freelancer, client, packageId } = await scenario();
      const booking = await book(client.cookie, packageId);

      // Only the freelancer starts work.
      const byClient = await request(app).put(`/api/bookings/${booking.booking_id}/status`)
        .set('Cookie', client.cookie).send({ status: 'active' });
      expect(byClient.status).toBe(403);

      const byFreelancer = await request(app).put(`/api/bookings/${booking.booking_id}/status`)
        .set('Cookie', freelancer.cookie).send({ status: 'active' });
      expect(byFreelancer.status).toBe(200);
      expect(byFreelancer.body.data.status).toBe('Active');
      expect(byFreelancer.body.data.work_started_at).not.toBeNull();
    });

    it('treats completed as terminal', async () => {
      const { freelancer, client, packageId } = await scenario();
      const booking = await book(client.cookie, packageId);

      await request(app).put(`/api/bookings/${booking.booking_id}/status`)
        .set('Cookie', freelancer.cookie).send({ status: 'active' });
      await request(app).put(`/api/bookings/${booking.booking_id}/status`)
        .set('Cookie', freelancer.cookie).send({ status: 'completed' });

      for (const status of ['active', 'cancelled', 'pending']) {
        const res = await request(app).put(`/api/bookings/${booking.booking_id}/status`)
          .set('Cookie', freelancer.cookie).send({ status });
        expect(res.status, `completed -> ${status}`).toBe(409);
      }
    });

    it('reports the transitions available to the caller', async () => {
      const { freelancer, client, packageId } = await scenario();
      const booking = await book(client.cookie, packageId);

      const asFreelancer = await request(app)
        .get(`/api/bookings/${booking.booking_id}/status`).set('Cookie', freelancer.cookie);
      expect(asFreelancer.body.data.allowed_transitions).toContain('active');

      const asClient = await request(app)
        .get(`/api/bookings/${booking.booking_id}/status`).set('Cookie', client.cookie);
      expect(asClient.body.data.allowed_transitions).not.toContain('active');
      expect(asClient.body.data.allowed_transitions).toContain('cancelled');
    });
  });

  describe('reviews', () => {
    async function completed() {
      const s = await scenario();
      const booking = await book(s.client.cookie, s.packageId);
      await request(app).put(`/api/bookings/${booking.booking_id}/status`)
        .set('Cookie', s.freelancer.cookie).send({ status: 'active' });
      await request(app).put(`/api/bookings/${booking.booking_id}/status`)
        .set('Cookie', s.freelancer.cookie).send({ status: 'completed' });
      return { ...s, booking };
    }

    it('accepts one review per party and updates the service rating', async () => {
      const { client, service, booking } = await completed();

      const res = await request(app).post(`/api/bookings/${booking.booking_id}/review`)
        .set('Cookie', client.cookie).send({ rating: 4, comment: 'Solid work' });
      expect(res.status).toBe(200);

      // Maintained by trigger, not by hand as the canister did.
      const after = await request(app).get(`/api/services/${service.service_id}`);
      expect(after.body.data.rating_avg).toBe(4);
      expect(after.body.data.review_count).toBe(1);
    });

    it('refuses a second review from the same party', async () => {
      const { client, booking } = await completed();
      await request(app).post(`/api/bookings/${booking.booking_id}/review`)
        .set('Cookie', client.cookie).send({ rating: 5 });

      // This is how one client could inflate a rating on the canister.
      const again = await request(app).post(`/api/bookings/${booking.booking_id}/review`)
        .set('Cookie', client.cookie).send({ rating: 5 });
      expect(again.status).toBe(409);
    });

    it('refuses a review before completion', async () => {
      const { client, packageId } = await scenario();
      const booking = await book(client.cookie, packageId);

      const res = await request(app).post(`/api/bookings/${booking.booking_id}/review`)
        .set('Cookie', client.cookie).send({ rating: 5 });
      expect(res.status).toBe(409);
    });
  });

  describe('stages', () => {
    it('lets only the freelancer add one, and only the client approve it', async () => {
      const { freelancer, client, packageId } = await scenario();
      const booking = await book(client.cookie, packageId);

      const byClient = await request(app).post(`/api/bookings/${booking.booking_id}/stages`)
        .set('Cookie', client.cookie).send({ name: 'Design' });
      expect(byClient.status).toBe(403);

      const created = await request(app).post(`/api/bookings/${booking.booking_id}/stages`)
        .set('Cookie', freelancer.cookie).send({ name: 'Design', amount_minor: 5000 });
      expect(created.status).toBe(201);
      const stageId = created.body.data.stage_id;

      // A freelancer approving their own stage would release its payment.
      const selfApprove = await request(app).put(`/api/stages/${stageId}`)
        .set('Cookie', freelancer.cookie).send({ status: 'approved' });
      expect(selfApprove.status).toBe(403);

      const approved = await request(app).put(`/api/stages/${stageId}`)
        .set('Cookie', client.cookie).send({ status: 'approved' });
      expect(approved.status).toBe(200);
      expect(approved.body.data.client_approved).toBe(true);
      expect(approved.body.data.completed_at).not.toBeNull();
    });

    it('hides stages from third parties', async () => {
      const { freelancer, client, packageId } = await scenario();
      const stranger = await signedInUser();
      const booking = await book(client.cookie, packageId);

      const created = await request(app).post(`/api/bookings/${booking.booking_id}/stages`)
        .set('Cookie', freelancer.cookie).send({ name: 'Design' });

      const res = await request(app)
        .get(`/api/stages/${created.body.data.stage_id}`).set('Cookie', stranger.cookie);
      expect(res.status).toBe(404);
    });
  });

  it('no longer accepts a self-reported payment', async () => {
    const { client, freelancer, packageId } = await scenario();
    const booking = await book(client.cookie, packageId);

    // Retired in Phase 5: a client asserting "I paid" is not evidence that
    // money moved. Payment is recorded only by a signed Stripe webhook.
    for (const cookie of [client.cookie, freelancer.cookie]) {
      const res = await request(app).post(`/api/bookings/${booking.booking_id}/paid`).set('Cookie', cookie);
      expect(res.status).toBe(410);
      expect(res.body.code).toBe('GONE');
    }
  });
});

d('stats', () => {
  it('returns counters without money', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(typeof res.body.data.total_services).toBe('number');
    expect(typeof res.body.data.active_services).toBe('number');
    expect(typeof res.body.data.average_rating).toBe('number');
    // Revenue is not public.
    expect(JSON.stringify(res.body)).not.toMatch(/revenue|total_minor/i);
  });
});
