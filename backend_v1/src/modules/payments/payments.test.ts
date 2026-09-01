/**
 * Payment tests.
 *
 * Run against a stub provider, not Stripe. Money-movement logic — who may
 * release, what a replayed webhook does, whether a refund can exceed the
 * charge — must be verifiable without a network call, and hitting a live API
 * on every run would make these slow and flaky.
 *
 * What this does NOT cover is Stripe's actual behaviour: the shape of
 * account.updated, how transfer_group behaves across settlement, which fields
 * are null before onboarding completes. That needs a real sk_test_ key, and
 * until then the adapter is written against documented shapes rather than
 * observed ones.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { query } from '../../db/pool.js';
import { generateId } from '../../lib/ids.js';
import * as repo from './repo.js';
import { setProviderForTesting, type StripeProvider } from './stripe.js';
import { ProviderError } from './provider.js';
import type {
  AccountStatus, CreateIntentInput, IntentResult, OnboardingLink, RefundInput,
  RefundResult, TransferInput, TransferResult, VerifiedEvent,
} from './provider.js';

const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

const app = createApp();
const PASSWORD = 'CorrectHorse1';
const created: string[] = [];

let seq = 0;
const freshEmail = () => `p5-${process.pid}-${Date.now()}-${seq++}@example.test`;

/** Records calls so tests can assert what the provider was actually asked to do. */
class StubProvider {
  readonly name = 'stripe' as const;
  transfers: TransferInput[] = [];
  refunds: RefundInput[] = [];
  intents: CreateIntentInput[] = [];
  failNextTransfer = false;
  /** Events verifyWebhook will return, keyed by the fake signature. */
  events = new Map<string, VerifiedEvent>();

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
  async transferToAccount(input: TransferInput): Promise<TransferResult> {
    if (this.failNextTransfer) {
      this.failNextTransfer = false;
      // Fail as the real adapter does, so the route's ProviderError path runs.
      throw new ProviderError('insufficient funds in platform balance', 'balance_insufficient', true);
    }
    this.transfers.push(input);
    // Globally unique: the stub is recreated per test, so a counter scoped to
    // it would repeat `tr_1` and collide on idx_payouts_provider_ref — which
    // is the schema correctly refusing a duplicate payout record.
    return { providerTransferId: `tr_${generateId('x')}` };
  }
  async refund(input: RefundInput): Promise<RefundResult> {
    this.refunds.push(input);
    return {
      providerRefundId: `re_${generateId('x')}`,
      refundedMinor: input.amountMinor ?? 10_500n,
    };
  }
  verifyWebhook(_raw: Buffer, signature: string): VerifiedEvent {
    const event = this.events.get(signature);
    // Mirrors Stripe: an unrecognised signature throws rather than returning null.
    if (!event) throw new Error('No signatures found matching the expected signature for payload');
    return event;
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

/** A paid-for-able booking: freelancer with payouts enabled, service, client. */
async function bookingScenario() {
  const freelancer = await signedInUser();
  const client = await signedInUser();

  await request(app).post('/api/payments/payouts/onboard').set('Cookie', freelancer.cookie);
  await query('UPDATE payout_accounts SET charges_enabled = true, payouts_enabled = true WHERE user_id = $1',
    [freelancer.userId]);

  const service = await request(app).post('/api/services').set('Cookie', freelancer.cookie).send({
    title: 'Payment test service',
    main_category: 'Web Development',
    packages: [{ tier: 'basic', name: 'Basic', price_minor: 10000, delivery_time_days: 3 }],
  });

  const booking = await request(app).post('/api/bookings').set('Cookie', client.cookie)
    .send({ package_id: service.body.data.packages[0].package_id });

  return { freelancer, client, booking: booking.body.data };
}

/** Drives a payment to `held`, as a real payment_intent.succeeded webhook would. */
async function payAndHold(clientCookie: string, bookingId: string) {
  const intent = await request(app).post('/api/payments/intent')
    .set('Cookie', clientCookie).send({ booking_id: bookingId });
  expect(intent.status).toBe(201);

  const paymentId = intent.body.data.payment.id;
  // Assert the setup worked. Without this a failed transition surfaces later
  // as a confusing 409 from whatever the test actually meant to exercise.
  const held = await repo.transitionState(null, paymentId, 'held', ['requires_payment', 'processing']);
  expect(held, `payAndHold could not move ${paymentId} to held`).not.toBeNull();
  expect(held!.state).toBe('held');
  return paymentId as string;
}

beforeEach(() => {
  stub = new StubProvider();
  setProviderForTesting(stub as unknown as StripeProvider);
});

afterAll(async () => {
  setProviderForTesting(null);
  if (created.length > 0) {
    // Order matters: payments.booking_id and payouts.payment_id are both
    // ON DELETE RESTRICT, deliberately — a financial record must not be
    // orphaned by removing what it refers to.
    await query(
      `DELETE FROM payouts WHERE payee_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))`,
      [created]);
    await query(
      `DELETE FROM payments WHERE payer_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))
          OR payee_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))`, [created]);
    await query(
      `DELETE FROM expert_bookings WHERE client_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))`,
      [created]);
    await query(
      `DELETE FROM bookings WHERE client_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))
          OR freelancer_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))`, [created]);
    await query('DELETE FROM otp_codes WHERE email = ANY($1::citext[])', [created]);
    await query('DELETE FROM users WHERE email = ANY($1::citext[])', [created]);
  }
});

d('payout onboarding', () => {
  it('creates one connected account and reuses it', async () => {
    const user = await signedInUser();

    const first = await request(app).post('/api/payments/payouts/onboard').set('Cookie', user.cookie);
    expect(first.status).toBe(200);
    expect(first.body.data.url).toContain('onboard');

    // A second account would strand the first, along with any balance on it.
    const second = await request(app).post('/api/payments/payouts/onboard').set('Cookie', user.cookie);
    expect(second.body.data.url).toContain('refresh');

    const { rows } = await query<{ n: string }>(
      'SELECT count(*)::text n FROM payout_accounts WHERE user_id = $1', [user.userId]);
    expect(Number(rows[0]!.n)).toBe(1);
  });

  it('reports status and requires a session', async () => {
    expect((await request(app).get('/api/payments/payouts/status')).status).toBe(401);

    const user = await signedInUser();
    const before = await request(app).get('/api/payments/payouts/status').set('Cookie', user.cookie);
    expect(before.body.data.onboarded).toBe(false);

    await request(app).post('/api/payments/payouts/onboard').set('Cookie', user.cookie);
    const after = await request(app).get('/api/payments/payouts/status').set('Cookie', user.cookie);
    expect(after.body.data.charges_enabled).toBe(true);
  });
});

d('paying for a booking', () => {
  it('creates an intent on the platform account, not a destination charge', async () => {
    const { client, booking } = await bookingScenario();

    const res = await request(app).post('/api/payments/intent')
      .set('Cookie', client.cookie).send({ booking_id: booking.booking_id });
    expect(res.status).toBe(201);
    expect(res.body.data.client_secret).toBeTruthy();
    expect(res.body.data.payment.state).toBe('requires_payment');

    // transfer_group ties the charge to the transfers that settle it later.
    expect(stub.intents[0]!.transferGroup).toBe(booking.booking_id);
    expect(stub.intents[0]!.amountMinor).toBe(10_500n);
  });

  it('lets only the client pay', async () => {
    const { freelancer, booking } = await bookingScenario();
    const res = await request(app).post('/api/payments/intent')
      .set('Cookie', freelancer.cookie).send({ booking_id: booking.booking_id });
    expect(res.status).toBe(403);
  });

  it('refuses when the freelancer has no payouts enabled', async () => {
    const { client, booking, freelancer } = await bookingScenario();
    await query('UPDATE payout_accounts SET charges_enabled = false WHERE user_id = $1',
      [freelancer.userId]);

    const res = await request(app).post('/api/payments/intent')
      .set('Cookie', client.cookie).send({ booking_id: booking.booking_id });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/payouts/i);
  });

  it('does not create a second charge when retried', async () => {
    const { client, booking } = await bookingScenario();

    const a = await request(app).post('/api/payments/intent')
      .set('Cookie', client.cookie).send({ booking_id: booking.booking_id });
    const b = await request(app).post('/api/payments/intent')
      .set('Cookie', client.cookie).send({ booking_id: booking.booking_id });

    expect(a.body.data.payment.id).toBe(b.body.data.payment.id);
    const { rows } = await query<{ n: string }>(
      'SELECT count(*)::text n FROM payments WHERE booking_id = $1', [booking.booking_id]);
    expect(Number(rows[0]!.n)).toBe(1);
  });
});

d('release', () => {
  it('transfers the payout and keeps the platform fee', async () => {
    const { client, booking } = await bookingScenario();
    const paymentId = await payAndHold(client.cookie, booking.booking_id);

    const res = await request(app).post(`/api/payments/${paymentId}/release`).set('Cookie', client.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.state).toBe('released');

    // 10500 charged, 500 fee, 10000 out.
    expect(stub.transfers).toHaveLength(1);
    expect(stub.transfers[0]!.amountMinor).toBe(10_000n);

    const { rows } = await query<{ amount_minor: string; state: string }>(
      'SELECT amount_minor, state FROM payouts WHERE payment_id = $1', [paymentId]);
    expect(rows[0]!.amount_minor).toBe('10000');
  });

  it('lets only the client release, never the payee', async () => {
    const { client, freelancer, booking } = await bookingScenario();
    const paymentId = await payAndHold(client.cookie, booking.booking_id);

    // A payee releasing to themselves removes the point of holding the money.
    const res = await request(app).post(`/api/payments/${paymentId}/release`)
      .set('Cookie', freelancer.cookie);
    expect(res.status).toBe(403);
    expect(stub.transfers).toHaveLength(0);
  });

  it('releases only once', async () => {
    const { client, booking } = await bookingScenario();
    const paymentId = await payAndHold(client.cookie, booking.booking_id);

    await request(app).post(`/api/payments/${paymentId}/release`).set('Cookie', client.cookie);
    const again = await request(app).post(`/api/payments/${paymentId}/release`).set('Cookie', client.cookie);

    expect(again.status).toBe(409);
    expect(stub.transfers).toHaveLength(1);
  });

  it('rolls back to held when the transfer fails', async () => {
    const { client, booking } = await bookingScenario();
    const paymentId = await payAndHold(client.cookie, booking.booking_id);

    stub.failNextTransfer = true;
    const res = await request(app).post(`/api/payments/${paymentId}/release`).set('Cookie', client.cookie);
    expect(res.status).toBeGreaterThanOrEqual(400);

    // Must not be stranded in `released` with no money actually moved.
    const payment = await repo.getPayment(paymentId);
    expect(payment!.state).toBe('held');

    // And a retry must then work.
    const retry = await request(app).post(`/api/payments/${paymentId}/release`).set('Cookie', client.cookie);
    expect(retry.status).toBe(200);
  });

  it('cannot release a payment that was never held', async () => {
    const { client, booking } = await bookingScenario();
    const intent = await request(app).post('/api/payments/intent')
      .set('Cookie', client.cookie).send({ booking_id: booking.booking_id });

    const res = await request(app)
      .post(`/api/payments/${intent.body.data.payment.id}/release`).set('Cookie', client.cookie);
    expect(res.status).toBe(409);
  });
});

d('refund', () => {
  it('refunds in full and marks the booking refunded', async () => {
    const { client, booking } = await bookingScenario();
    const paymentId = await payAndHold(client.cookie, booking.booking_id);

    const res = await request(app).post(`/api/payments/${paymentId}/refund`)
      .set('Cookie', client.cookie).send({ reason: 'client changed their mind' });
    expect(res.status).toBe(200);
    expect(res.body.data.state).toBe('refunded');

    const { rows } = await query<{ payment_status: string }>(
      'SELECT payment_status FROM bookings WHERE id = $1', [booking.booking_id]);
    expect(rows[0]!.payment_status).toBe('refunded');
  });

  it('supports a partial refund and tracks the remainder', async () => {
    const { client, booking } = await bookingScenario();
    const paymentId = await payAndHold(client.cookie, booking.booking_id);

    const res = await request(app).post(`/api/payments/${paymentId}/refund`)
      .set('Cookie', client.cookie).send({ amount_minor: 4000 });
    expect(res.status).toBe(200);
    expect(res.body.data.state).toBe('partially_refunded');
    expect(res.body.data.refunded_minor).toBe('4000');
  });

  it('refuses to refund more than was charged', async () => {
    const { client, booking } = await bookingScenario();
    const paymentId = await payAndHold(client.cookie, booking.booking_id);

    const res = await request(app).post(`/api/payments/${paymentId}/refund`)
      .set('Cookie', client.cookie).send({ amount_minor: 99_999 });
    expect(res.status).toBe(400);
    expect(stub.refunds).toHaveLength(0);
  });

  it('will not refund an already-released payment', async () => {
    const { client, booking } = await bookingScenario();
    const paymentId = await payAndHold(client.cookie, booking.booking_id);
    await request(app).post(`/api/payments/${paymentId}/release`).set('Cookie', client.cookie);

    const res = await request(app).post(`/api/payments/${paymentId}/refund`).set('Cookie', client.cookie);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already been released/i);
  });

  it('hides payments from third parties', async () => {
    const { client, booking } = await bookingScenario();
    const paymentId = await payAndHold(client.cookie, booking.booking_id);
    const stranger = await signedInUser();

    expect((await request(app).get(`/api/payments/${paymentId}`).set('Cookie', stranger.cookie)).status).toBe(404);
    expect((await request(app).post(`/api/payments/${paymentId}/refund`).set('Cookie', stranger.cookie).send({})).status).toBe(404);
  });
});

d('webhook', () => {
  const post = (signature: string | null, body: unknown = { any: 'payload' }) => {
    const req = request(app).post('/api/payments/webhook')
      .set('Content-Type', 'application/json');
    if (signature) req.set('stripe-signature', signature);
    return req.send(Buffer.from(JSON.stringify(body)));
  };

  it('rejects a request with no signature', async () => {
    const res = await post(null);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/signature/i);
  });

  it('rejects a forged signature', async () => {
    // The stub throws for any signature it did not register — as Stripe does.
    const res = await post('t=1,v1=forged');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid signature/i);
  });

  it('moves a payment to held on payment_intent.succeeded', async () => {
    const { client, booking } = await bookingScenario();
    const intent = await request(app).post('/api/payments/intent')
      .set('Cookie', client.cookie).send({ booking_id: booking.booking_id });
    const paymentId = intent.body.data.payment.id;

    const sig = 'sig-success';
    stub.events.set(sig, {
      id: `evt_${generateId('x')}`,
      type: 'payment_intent.succeeded',
      payload: { id: `pi_${booking.booking_id}` },
    });

    const res = await post(sig);
    expect(res.status).toBe(200);

    expect((await repo.getPayment(paymentId))!.state).toBe('held');

    const { rows } = await query<{ payment_status: string; status: string }>(
      'SELECT payment_status, status FROM bookings WHERE id = $1', [booking.booking_id]);
    expect(rows[0]!.payment_status).toBe('held_in_escrow');
    // Payment also starts the work.
    expect(rows[0]!.status).toBe('active');
  });

  it('ignores a redelivered event', async () => {
    const { client, booking } = await bookingScenario();
    await request(app).post('/api/payments/intent')
      .set('Cookie', client.cookie).send({ booking_id: booking.booking_id });

    const sig = 'sig-dup';
    const eventId = `evt_${generateId('x')}`;
    stub.events.set(sig, {
      id: eventId, type: 'payment_intent.succeeded', payload: { id: `pi_${booking.booking_id}` },
    });

    const first = await post(sig);
    expect(first.body.duplicate).toBeUndefined();

    // Providers deliver at-least-once; without dedup this releases twice.
    const second = await post(sig);
    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);

    const { rows } = await query<{ n: string }>(
      'SELECT count(*)::text n FROM payment_events WHERE provider_event_id = $1', [eventId]);
    expect(Number(rows[0]!.n)).toBe(1);
  });

  it('does not move an already-released payment backwards', async () => {
    const { client, booking } = await bookingScenario();
    const paymentId = await payAndHold(client.cookie, booking.booking_id);
    await request(app).post(`/api/payments/${paymentId}/release`).set('Cookie', client.cookie);

    // A late succeeded event must not reopen a settled payment.
    const sig = 'sig-late';
    stub.events.set(sig, {
      id: `evt_${generateId('x')}`,
      type: 'payment_intent.succeeded',
      payload: { id: `pi_${booking.booking_id}` },
    });
    await post(sig);

    expect((await repo.getPayment(paymentId))!.state).toBe('released');
  });

  it('records a failure reason on payment_intent.payment_failed', async () => {
    const { client, booking } = await bookingScenario();
    const intent = await request(app).post('/api/payments/intent')
      .set('Cookie', client.cookie).send({ booking_id: booking.booking_id });

    const sig = 'sig-fail';
    stub.events.set(sig, {
      id: `evt_${generateId('x')}`,
      type: 'payment_intent.payment_failed',
      payload: { id: `pi_${booking.booking_id}`, last_payment_error: { message: 'card declined' } },
    });
    await post(sig);

    const payment = await repo.getPayment(intent.body.data.payment.id);
    expect(payment!.state).toBe('failed');
    expect(payment!.failure_reason).toBe('card declined');
  });

  it('updates payout capability on account.updated', async () => {
    const user = await signedInUser();
    await request(app).post('/api/payments/payouts/onboard').set('Cookie', user.cookie);
    const account = await repo.getPayoutAccount(user.userId);

    const sig = 'sig-account';
    stub.events.set(sig, {
      id: `evt_${generateId('x')}`,
      type: 'account.updated',
      payload: {
        id: account!.provider_account_id,
        charges_enabled: true, payouts_enabled: true, details_submitted: true,
        requirements: { currently_due: [] }, country: 'US', default_currency: 'usd',
      },
    });
    await post(sig);

    const updated = await repo.getPayoutAccount(user.userId);
    expect(updated!.charges_enabled).toBe(true);
    expect(updated!.country).toBe('US');
  });

  it('acknowledges an event type it does not handle', async () => {
    const sig = 'sig-unknown';
    stub.events.set(sig, {
      id: `evt_${generateId('x')}`, type: 'invoice.created', payload: {},
    });
    // A non-2xx makes Stripe retry, and retrying will not make us handle it.
    const res = await post(sig);
    expect(res.status).toBe(200);
    expect(res.body.handled).toBe(false);
  });
});
