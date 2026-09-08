/**
 * Expert profile + expert-session-booking tests.
 *
 * Booking a session goes through the existing, already-tested
 * `/api/payments/expert-session` route (payments/purposes.ts) — these tests
 * only exercise what this module adds: profile CRUD and listing bookings.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { query } from '../../db/pool.js';
import { setProviderForTesting, type StripeProvider } from '../payments/stripe.js';
import type {
  AccountStatus, CreateIntentInput, IntentResult, OnboardingLink,
} from '../payments/provider.js';

const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

const app = createApp();
const PASSWORD = 'CorrectHorse1';
const created: string[] = [];

let seq = 0;
const freshEmail = () => `exp-${process.pid}-${Date.now()}-${seq++}@example.test`;

class StubProvider {
  readonly name = 'stripe' as const;
  intents: CreateIntentInput[] = [];

  async startOnboarding(userId: string): Promise<OnboardingLink> {
    return { url: 'https://connect.stripe.test/onboard', providerAccountId: `acct_${userId.slice(-8)}` };
  }
  async refreshOnboardingLink(providerAccountId: string): Promise<OnboardingLink> {
    return { url: 'https://connect.stripe.test/refresh', providerAccountId };
  }
  async getAccountStatus(providerAccountId: string): Promise<AccountStatus> {
    return {
      providerAccountId, chargesEnabled: true, payoutsEnabled: true, detailsSubmitted: true,
      requirements: {}, country: 'US', defaultCurrency: 'USD',
    };
  }
  async createIntent(input: CreateIntentInput): Promise<IntentResult> {
    this.intents.push(input);
    return {
      providerPaymentId: `pi_${input.transferGroup}`,
      clientSecret: 'cs_test_secret',
      status: 'requires_payment_method',
    };
  }
  async transferToAccount(): Promise<never> {
    throw new Error('not exercised in these tests');
  }
  async refund(): Promise<never> {
    throw new Error('not exercised in these tests');
  }
  verifyWebhook(): never {
    throw new Error('not exercised in these tests');
  }
}

let stub: StubProvider;

async function signedInUser() {
  const email = freshEmail();
  created.push(email);
  await request(app).post('/api/auth/signup').send({ email, password: PASSWORD });
  const { rows } = await query<{ code: string }>('SELECT code FROM otp_codes WHERE email = $1', [email]);
  const verify = await request(app).post('/api/auth/verify-otp').send({ email, otp: rows[0]!.code });
  const cookie = (verify.headers['set-cookie'] as unknown as string[])[0]!;
  const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
  return { email, cookie, userId: me.body.session.userId as string };
}

async function payableExpert() {
  const expert = await signedInUser();
  await request(app).post('/api/payments/payouts/onboard').set('Cookie', expert.cookie);
  await query('UPDATE payout_accounts SET charges_enabled = true, payouts_enabled = true WHERE user_id = $1',
    [expert.userId]);

  const registered = await request(app).post('/api/experts').set('Cookie', expert.cookie).send({
    headline: 'Growth strategist',
    bio: 'I help teams ship faster.',
    expertise: ['growth', 'marketing'],
    hourly_rate_minor: 10_000,
  });

  return { ...expert, expertId: registered.body.data.id as string };
}

beforeEach(() => {
  stub = new StubProvider();
  setProviderForTesting(stub as unknown as StripeProvider);
});

afterAll(async () => {
  setProviderForTesting(null);
  if (created.length > 0) {
    await query(
      `DELETE FROM payments WHERE payer_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))
          OR payee_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))`, [created]);
    await query(
      `DELETE FROM expert_bookings WHERE client_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))
          OR expert_id IN (SELECT id FROM experts WHERE user_id IN
            (SELECT id FROM users WHERE email = ANY($1::citext[])))`, [created]);
    await query('DELETE FROM experts WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))',
      [created]);
    await query('DELETE FROM otp_codes WHERE email = ANY($1::citext[])', [created]);
    await query('DELETE FROM users WHERE email = ANY($1::citext[])', [created]);
  }
});

d('expert profile', () => {
  it('registers, then edits on a second call instead of duplicating', async () => {
    const user = await signedInUser();

    const first = await request(app).post('/api/experts').set('Cookie', user.cookie).send({
      headline: 'Backend mentor', bio: 'Node and Postgres.', expertise: ['node'],
      hourly_rate_minor: 5_000,
    });
    expect(first.status).toBe(201);
    expect(first.body.data.hourly_rate_minor).toBe('5000');
    expect(first.body.data.currency).toBe('USD');

    const second = await request(app).post('/api/experts').set('Cookie', user.cookie).send({
      headline: 'Backend mentor', bio: 'Node, Postgres and Redis.', expertise: ['node', 'redis'],
      hourly_rate_minor: 7_500,
    });
    expect(second.status).toBe(200);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(second.body.data.hourly_rate_minor).toBe('7500');

    const { rows } = await query<{ n: string }>(
      'SELECT count(*)::text n FROM experts WHERE user_id = $1', [user.userId]);
    expect(Number(rows[0]!.n)).toBe(1);
  });

  it('lists active experts and reads one by id', async () => {
    const { userId, cookie, expertId } = await payableExpert();

    const list = await request(app).get('/api/experts');
    expect(list.status).toBe(200);
    expect(list.body.data.some((e: { id: string }) => e.id === expertId)).toBe(true);

    const one = await request(app).get(`/api/experts/${expertId}`);
    expect(one.status).toBe(200);
    expect(one.body.data.user_id).toBe(userId);

    const mine = await request(app).get('/api/experts/me').set('Cookie', cookie);
    expect(mine.status).toBe(200);
    expect(mine.body.data.id).toBe(expertId);
  });

  it('404s "me" for a user with no profile, and hides inactive experts from GET /:id', async () => {
    const user = await signedInUser();
    const mine = await request(app).get('/api/experts/me').set('Cookie', user.cookie);
    expect(mine.status).toBe(404);

    const { cookie, expertId } = await payableExpert();
    await request(app).put('/api/experts/me').set('Cookie', cookie).send({ is_active: false });

    const hidden = await request(app).get(`/api/experts/${expertId}`);
    expect(hidden.status).toBe(404);
  });
});

d('expert session bookings', () => {
  it('lists a booked session for both the expert and the client, scoped by role', async () => {
    const expert = await payableExpert();
    const client = await signedInUser();

    const session = await request(app).post('/api/payments/expert-session').set('Cookie', client.cookie).send({
      expert_id: expert.expertId,
      scheduled_at: new Date(Date.now() + 86_400_000).toISOString(),
      duration_minutes: 30,
    });
    expect(session.status).toBe(201);
    // Half the hourly rate, for a 30-minute session.
    expect(session.body.data.payment.amount_minor).toBe('5000');

    const asExpert = await request(app).get('/api/expert-bookings?role=expert').set('Cookie', expert.cookie);
    expect(asExpert.body.data.some((b: { id: string }) => b.id === session.body.data.expert_booking_id))
      .toBe(true);

    const asClient = await request(app).get('/api/expert-bookings?role=client').set('Cookie', client.cookie);
    expect(asClient.body.data.some((b: { id: string }) => b.id === session.body.data.expert_booking_id))
      .toBe(true);

    // The client has no expert profile, so nothing shows up on their "received" side.
    const clientAsExpert = await request(app).get('/api/expert-bookings?role=expert').set('Cookie', client.cookie);
    expect(clientAsExpert.body.data).toEqual([]);
  });

  it('requires a session to list bookings', async () => {
    const res = await request(app).get('/api/expert-bookings');
    expect(res.status).toBe(401);
  });
});
