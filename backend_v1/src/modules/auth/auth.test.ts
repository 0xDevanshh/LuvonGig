/**
 * End-to-end auth tests against the real schema.
 *
 * These exercise the flows a user actually walks, plus the failure paths that
 * matter for security: account enumeration, OTP brute force, rate limits, and
 * one user reaching another's data.
 *
 * Each test uses a unique email and cleans up after itself, so the database is
 * left as it was found. Skipped without DATABASE_URL.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { closePool, query } from '../../db/pool.js';
import { loginLimiter, otpRequestLimiter, otpVerifyLimiter, passwordResetLimiter } from '../../lib/rateLimit.js';

const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

const app = createApp();
const PASSWORD = 'CorrectHorse1';

let seq = 0;
const freshEmail = () => `phase2-${process.pid}-${Date.now()}-${seq++}@example.test`;

/** Reads the OTP straight from the table — the email transport only logs in tests. */
async function otpFor(email: string): Promise<string> {
  const { rows } = await query<{ code: string }>(
    'SELECT code FROM otp_codes WHERE email = $1', [email]);
  expect(rows[0]?.code).toBeTruthy();
  return rows[0]!.code;
}

async function cleanup(email: string): Promise<void> {
  await query('DELETE FROM otp_codes WHERE email = $1', [email]);
  await query('DELETE FROM users WHERE email = $1', [email]); // cascades
}

/** Signs up, verifies, and returns the session cookie. */
async function signedInUser(): Promise<{ email: string; cookie: string; userId: string }> {
  const email = freshEmail();
  const signup = await request(app).post('/api/auth/signup').send({ email, password: PASSWORD });
  expect(signup.status).toBe(200);

  const verify = await request(app)
    .post('/api/auth/verify-otp')
    .send({ email, otp: await otpFor(email) });
  expect(verify.status).toBe(200);

  const cookie = (verify.headers['set-cookie'] as unknown as string[])[0]!;
  return { email, cookie, userId: signup.body.userId };
}

function resetLimiters(email: string, ip = '::ffff:127.0.0.1'): void {
  otpRequestLimiter.reset(email);
  otpVerifyLimiter.reset(email);
  passwordResetLimiter.reset(email);
  loginLimiter.reset(ip);
  loginLimiter.reset('unknown');
}

d('auth', () => {
  const created: string[] = [];
  const track = (email: string) => { created.push(email); return email; };

  beforeEach(() => {
    // The login limiter is keyed by IP and every test shares one.
    loginLimiter.reset('::ffff:127.0.0.1');
    loginLimiter.reset('unknown');
  });

  afterAll(async () => {
    for (const email of created) await cleanup(email);
    await closePool();
  });

  it('walks signup -> verify -> login', async () => {
    const email = track(freshEmail());

    const signup = await request(app).post('/api/auth/signup').send({ email, password: PASSWORD });
    expect(signup.status).toBe(200);
    expect(signup.body.success).toBe(true);
    expect(signup.body.userId).toMatch(/^user_/);

    // Cannot log in before verifying.
    const early = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    expect(early.status).toBe(401);
    expect(early.body.error).toMatch(/verify your email/i);
    resetLimiters(email);

    const verify = await request(app)
      .post('/api/auth/verify-otp').send({ email, otp: await otpFor(email) });
    expect(verify.status).toBe(200);
    expect(verify.headers['set-cookie']).toBeDefined();

    const login = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe(email);
    expect(login.body.user.isVerified).toBe(true);
    // The old route returned no hash here; make sure that stays true.
    expect(JSON.stringify(login.body)).not.toContain('argon2');
  });

  it('rejects a duplicate signup', async () => {
    const email = track(freshEmail());
    await request(app).post('/api/auth/signup').send({ email, password: PASSWORD });
    resetLimiters(email);

    const again = await request(app).post('/api/auth/signup').send({ email, password: PASSWORD });
    expect(again.status).toBe(409);
    expect(again.body.error).toMatch(/already exists/i);
  });

  it('rejects a weak password', async () => {
    const res = await request(app)
      .post('/api/auth/signup').send({ email: freshEmail(), password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('gives the same answer for a wrong password and an unknown account', async () => {
    const { email } = await signedInUser();
    track(email);
    resetLimiters(email);

    const wrongPassword = await request(app)
      .post('/api/auth/login').send({ email, password: 'WrongPassword1' });
    resetLimiters(email);
    const noAccount = await request(app)
      .post('/api/auth/login').send({ email: 'nobody-here@example.test', password: PASSWORD });

    // Otherwise this endpoint reveals which addresses have accounts.
    expect(wrongPassword.status).toBe(noAccount.status);
    expect(wrongPassword.body.error).toBe(noAccount.body.error);
  });

  it('counts OTP attempts and locks out after the limit', async () => {
    const email = track(freshEmail());
    await request(app).post('/api/auth/signup').send({ email, password: PASSWORD });

    const real = await otpFor(email);
    const wrong = real === '000000' ? '111111' : '000000';

    let sawCountdown = false;
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/auth/verify-otp').send({ email, otp: wrong });
      expect(res.status).toBeGreaterThanOrEqual(400);
      if (/attempts? remaining/i.test(res.body.error ?? '')) sawCountdown = true;
    }
    expect(sawCountdown).toBe(true);

    // The code is destroyed after too many attempts — the real one no longer works.
    const after = await request(app).post('/api/auth/verify-otp').send({ email, otp: real });
    expect(after.status).toBeGreaterThanOrEqual(400);
  });

  it('rate limits repeated logins from one IP', async () => {
    const { email } = await signedInUser();
    track(email);
    resetLimiters(email);

    let limited = false;
    for (let i = 0; i < 8; i++) {
      const res = await request(app).post('/api/auth/login').send({ email, password: 'Wrong1234' });
      if (res.status === 429) {
        expect(res.headers['retry-after']).toBeDefined();
        limited = true;
        break;
      }
    }
    expect(limited).toBe(true);
  });

  it('does not reveal whether an account exists on forgot-password', async () => {
    const { email } = await signedInUser();
    track(email);

    const known = await request(app).post('/api/auth/forgot-password').send({ email });
    const unknown = await request(app)
      .post('/api/auth/forgot-password').send({ email: 'ghost@example.test' });

    expect(known.status).toBe(unknown.status);
    expect(known.body.message).toBe(unknown.body.message);
  });

  it('resets a password and invalidates the link', async () => {
    const { email, userId } = await signedInUser();
    track(email);

    // The email only logs in tests, so take the token from the table. Only its
    // hash is stored, so a fresh one is issued here with a known plaintext.
    const token = 'test-reset-token-known-plaintext';
    const { createHash } = await import('node:crypto');
    await query(
      `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
       VALUES ($1, $2, now() + interval '1 hour')`,
      [createHash('sha256').update(token).digest('hex'), userId],
    );

    const NEW = 'BrandNewPass9';
    const reset = await request(app).post('/api/auth/reset-password').send({ token, password: NEW });
    expect(reset.status).toBe(200);

    resetLimiters(email);
    const withNew = await request(app).post('/api/auth/login').send({ email, password: NEW });
    expect(withNew.status).toBe(200);

    resetLimiters(email);
    const withOld = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    expect(withOld.status).toBe(401);

    // Single use.
    const replay = await request(app).post('/api/auth/reset-password').send({ token, password: NEW });
    expect(replay.status).toBe(400);
  });

  it('rejects an unknown or expired reset token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password').send({ token: 'not-a-real-token', password: 'Whatever12' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or has expired/i);
  });

  describe('session shape', () => {
    it('/session keeps { success, session } and 200s when signed out', async () => {
      const out = await request(app).get('/api/auth/session');
      // my-services/page.tsx reads data.success then data.session — a 401
      // would break that page.
      expect(out.status).toBe(200);
      expect(out.body.success).toBe(false);

      const { email, cookie } = await signedInUser();
      track(email);

      const inn = await request(app).get('/api/auth/session').set('Cookie', cookie);
      expect(inn.status).toBe(200);
      expect(inn.body.session.userId).toMatch(/^user_/);
      expect(inn.body.session.email).toBe(email);
      expect(inn.body.session.isAuthenticated).toBe(true);
    });

    it('/me keeps { success, session, isVerified }', async () => {
      const { email, cookie } = await signedInUser();
      track(email);

      const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.session.email).toBe(email);
      expect(res.body.session.isVerified).toBe(true);

      const out = await request(app).get('/api/auth/me');
      expect(out.body.session).toBeNull();
    });
  });

  it('logout clears the cookie', async () => {
    const { email, cookie } = await signedInUser();
    track(email);

    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(String(res.headers['set-cookie'])).toMatch(/sid=;|sid=$|Expires=Thu, 01 Jan 1970/);
  });

  it('changes a password only with the current one', async () => {
    const { email, cookie } = await signedInUser();
    track(email);

    const wrong = await request(app).post('/api/auth/change-password')
      .set('Cookie', cookie).send({ currentPassword: 'Nope12345', newPassword: 'Another1Pass' });
    expect(wrong.status).toBe(400);

    const ok = await request(app).post('/api/auth/change-password')
      .set('Cookie', cookie).send({ currentPassword: PASSWORD, newPassword: 'Another1Pass' });
    expect(ok.status).toBe(200);

    resetLimiters(email);
    const login = await request(app).post('/api/auth/login').send({ email, password: 'Another1Pass' });
    expect(login.status).toBe(200);
  });
});

d('users and profile', () => {
  const created: string[] = [];
  afterAll(async () => {
    for (const email of created) await cleanup(email);
    await closePool();
  });

  it('requires a session on every route', async () => {
    for (const [method, path] of [
      ['get', '/api/users/profile'],
      ['post', '/api/users/profile'],
      ['get', '/api/users/profile/completeness'],
      ['post', '/api/users/onboarding/skills'],
      ['get', '/api/users/onboarding/complete'],
    ] as const) {
      const res = await request(app)[method](path).send({});
      expect(res.status, `${method} ${path}`).toBe(401);
    }
  });

  it('rejects a tampered session cookie', async () => {
    const res = await request(app).get('/api/users/profile')
      .set('Cookie', 'sid=not.a.real.jwt');
    expect(res.status).toBe(401);
  });

  it('round-trips a profile', async () => {
    const { email, cookie } = await signedInUser();
    created.push(email);

    const saved = await request(app).post('/api/users/profile').set('Cookie', cookie).send({
      firstName: 'Ada', lastName: 'Lovelace', bio: 'Analytical engines',
      location: 'London', skills: ['mathematics', 'computing'],
    });
    expect(saved.status).toBe(200);
    expect(saved.body.data.profile.firstName).toBe('Ada');
    expect(saved.body.data.profile.skills).toEqual(['mathematics', 'computing']);

    // A partial update must not wipe fields it omits.
    const patched = await request(app).post('/api/users/profile')
      .set('Cookie', cookie).send({ bio: 'Updated bio' });
    expect(patched.body.data.profile.bio).toBe('Updated bio');
    expect(patched.body.data.profile.firstName).toBe('Ada');
    expect(patched.body.data.profile.skills).toEqual(['mathematics', 'computing']);
  });

  it('replaces experience as a set', async () => {
    const { email, cookie } = await signedInUser();
    created.push(email);

    const first = await request(app).post('/api/users/experience').set('Cookie', cookie).send({
      experience: [
        { company: 'A', position: 'Dev', startDate: '2020', current: false, endDate: '2021' },
        { company: 'B', position: 'Lead', startDate: '2021', current: true },
      ],
    });
    expect(first.body.data.profile.experience).toHaveLength(2);
    expect(first.body.data.profile.experience[0].company).toBe('A');

    const second = await request(app).post('/api/users/experience').set('Cookie', cookie).send({
      experience: [{ company: 'C', position: 'Staff', startDate: '2022', current: true }],
    });
    expect(second.body.data.profile.experience).toHaveLength(1);
    expect(second.body.data.profile.experience[0].company).toBe('C');
  });

  it('reports completeness', async () => {
    const { email, cookie } = await signedInUser();
    created.push(email);

    const empty = await request(app).get('/api/users/profile/completeness').set('Cookie', cookie);
    expect(empty.body.data.isComplete).toBe(false);
    expect(empty.body.data.missing).toContain('firstName');
    expect(empty.body.data.completionPercentage).toBe(0);

    await request(app).post('/api/users/profile').set('Cookie', cookie)
      .send({ firstName: 'Ada', lastName: 'L', bio: 'b', location: 'London', skills: ['x'] });

    const partial = await request(app).get('/api/users/profile/completeness').set('Cookie', cookie);
    expect(partial.body.data.completionPercentage).toBeGreaterThan(0);
    expect(partial.body.data.missing).toContain('resume');
  });

  it('walks the onboarding steps', async () => {
    const { email, cookie } = await signedInUser();
    created.push(email);

    expect((await request(app).post('/api/users/onboarding/address')
      .set('Cookie', cookie).send({ location: 'Berlin' })).status).toBe(200);
    expect((await request(app).post('/api/users/onboarding/skills')
      .set('Cookie', cookie).send({ skills: ['rust'] })).status).toBe(200);
    expect((await request(app).post('/api/users/onboarding/resume')
      .set('Cookie', cookie).send({ resumeUrl: 'https://example.test/cv.pdf' })).status).toBe(200);

    const before = await request(app).get('/api/users/onboarding/complete').set('Cookie', cookie);
    expect(before.body.data.completed).toBe(false);

    await request(app).post('/api/users/onboarding/complete').set('Cookie', cookie).send({});

    const after = await request(app).get('/api/users/onboarding/complete').set('Cookie', cookie);
    expect(after.body.data.completed).toBe(true);

    const profile = await request(app).get('/api/users/profile').set('Cookie', cookie);
    expect(profile.body.data.profile.location).toBe('Berlin');
    expect(profile.body.data.profile.skills).toEqual(['rust']);
  });

  it('never lets one user read or write another', async () => {
    const alice = await signedInUser();
    const bob = await signedInUser();
    created.push(alice.email, bob.email);

    await request(app).post('/api/users/profile').set('Cookie', alice.cookie)
      .send({ firstName: 'Alice', bio: 'alice-secret' });
    await request(app).post('/api/users/profile').set('Cookie', bob.cookie)
      .send({ firstName: 'Bob' });

    const asBob = await request(app).get('/api/users/profile').set('Cookie', bob.cookie);
    expect(asBob.body.data.email).toBe(bob.email);
    expect(asBob.body.data.profile.firstName).toBe('Bob');
    expect(JSON.stringify(asBob.body)).not.toContain('alice-secret');

    // A userId in the body must be ignored — routes read it from the session only.
    await request(app).post('/api/users/profile').set('Cookie', bob.cookie)
      .send({ userId: alice.userId, firstName: 'Hijacked' });

    const alicePost = await request(app).get('/api/users/profile').set('Cookie', alice.cookie);
    expect(alicePost.body.data.profile.firstName).toBe('Alice');
  });

  it('stubs the wallet routes', async () => {
    const { email, cookie } = await signedInUser();
    created.push(email);

    const get = await request(app).get('/api/users/wallet').set('Cookie', cookie);
    expect(get.status).toBe(200);
    expect(get.body.data.walletPrincipal).toBeNull();

    const post = await request(app).post('/api/users/wallet').set('Cookie', cookie).send({});
    expect(post.status).toBe(410);
  });
});
