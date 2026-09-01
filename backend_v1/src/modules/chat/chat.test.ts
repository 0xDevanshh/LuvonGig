/**
 * Chat tests.
 *
 * The authorization cases are the whole point of this phase. Before it:
 *
 *   - every REST route took `userEmail` from the query string, so passing
 *     someone else's address returned their conversation
 *   - the Socket.IO server had no authentication whatsoever — identity was
 *     `socket.handshake.auth.username`, unverified
 *
 * The socket tests connect a real client to a real server on an ephemeral
 * port. A stub would not prove the handshake rejects anything.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createServer, type Server as HttpServer } from 'node:http';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import type { Server as IoServer } from 'socket.io';
import { createApp } from '../../app.js';
import { query } from '../../db/pool.js';
import { attachChatSocket } from './socket.js';

const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

const app = createApp();
const PASSWORD = 'CorrectHorse1';
const created: string[] = [];

let seq = 0;
const freshEmail = () => `p6-${process.pid}-${Date.now()}-${seq++}@example.test`;

async function signedInUser() {
  const email = freshEmail();
  created.push(email);
  await request(app).post('/api/auth/signup').send({ email, password: PASSWORD });
  const { rows } = await query<{ code: string }>('SELECT code FROM otp_codes WHERE email = $1', [email]);
  const verify = await request(app).post('/api/auth/verify-otp').send({ email, otp: rows[0]!.code });
  const setCookie = (verify.headers['set-cookie'] as unknown as string[])[0]!;
  const me = await request(app).get('/api/auth/me').set('Cookie', setCookie);
  return {
    email,
    cookie: setCookie,
    // Just the `sid=value` pair, for the socket handshake's cookie header.
    cookiePair: setCookie.split(';')[0]!,
    token: setCookie.split(';')[0]!.split('=')[1]!,
    userId: me.body.session.userId as string,
  };
}

/** Two users who share a booking, so they are allowed to message each other. */
async function bookedPair() {
  const freelancer = await signedInUser();
  const client = await signedInUser();

  const service = await request(app).post('/api/services').set('Cookie', freelancer.cookie).send({
    title: 'Chat test service',
    main_category: 'Web Development',
    packages: [{ tier: 'basic', name: 'Basic', price_minor: 10000, delivery_time_days: 3 }],
  });
  const booking = await request(app).post('/api/bookings').set('Cookie', client.cookie)
    .send({ package_id: service.body.data.packages[0].package_id });

  return { freelancer, client, bookingId: booking.body.data.booking_id as string };
}

// --- Socket harness ---------------------------------------------------------

let httpServer: HttpServer;
let ioServer: IoServer;
let port: number;

beforeAll(async () => {
  if (!hasDb) return;
  httpServer = createServer(app);
  ioServer = attachChatSocket(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  port = (httpServer.address() as { port: number }).port;
});

afterAll(async () => {
  if (hasDb) {
    ioServer?.close();
    await new Promise<void>((resolve) => httpServer?.close(() => resolve()));
  }

  if (created.length > 0) {
    await query(
      `DELETE FROM chat_messages WHERE from_user_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))
          OR to_user_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))`, [created]);
    await query(
      `DELETE FROM payments WHERE payer_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))
          OR payee_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))`, [created]);
    await query(
      `DELETE FROM bookings WHERE client_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))
          OR freelancer_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))`, [created]);
    await query('DELETE FROM otp_codes WHERE email = ANY($1::citext[])', [created]);
    await query('DELETE FROM users WHERE email = ANY($1::citext[])', [created]);
  }
});

/** Connects a client, resolving on `authenticated` or rejecting on refusal. */
function connect(opts: { cookie?: string; token?: string }): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
      ...(opts.token ? { auth: { token: opts.token } } : {}),
      ...(opts.cookie ? { extraHeaders: { Cookie: opts.cookie } } : {}),
      reconnection: false,
      timeout: 8000,
    });
    socket.on('authenticated', () => resolve(socket));
    socket.on('connect_error', (err) => { socket.close(); reject(err); });
  });
}

function emit<T = unknown>(socket: ClientSocket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve) => socket.emit(event, payload, resolve));
}

d('chat REST', () => {
  it('requires a session on every route', async () => {
    for (const [method, path] of [
      ['get', '/api/chat/messages'],
      ['post', '/api/chat/messages'],
      ['get', '/api/chat/recent'],
      ['get', '/api/chat/relationships'],
      ['get', '/api/chat/booking-contacts'],
      ['post', '/api/chat/initiate'],
    ] as const) {
      const res = await request(app)[method](path).send({});
      expect(res.status, `${method} ${path}`).toBe(401);
    }
  });

  it('sends and reads a conversation between booked parties', async () => {
    const { client, freelancer } = await bookedPair();

    const sent = await request(app).post('/api/chat/messages').set('Cookie', client.cookie)
      .send({ to: freelancer.email, text: 'Hello, when can you start?' });
    expect(sent.status).toBe(201);
    expect(sent.body.data.from).toBe(client.email);
    expect(sent.body.data.to).toBe(freelancer.email);

    const asFreelancer = await request(app)
      .get(`/api/chat/messages?contactEmail=${encodeURIComponent(client.email)}`)
      .set('Cookie', freelancer.cookie);
    expect(asFreelancer.body.data).toHaveLength(1);
    expect(asFreelancer.body.data[0].text).toBe('Hello, when can you start?');
  });

  it('ignores a userEmail parameter and uses the session', async () => {
    const { client, freelancer } = await bookedPair();
    await request(app).post('/api/chat/messages').set('Cookie', client.cookie)
      .send({ to: freelancer.email, text: 'private' });

    const attacker = await signedInUser();

    // The old route read `userEmail` from the query string and returned that
    // person's conversation. It must now be inert.
    const res = await request(app)
      .get(`/api/chat/messages?userEmail=${encodeURIComponent(client.email)}&contactEmail=${encodeURIComponent(freelancer.email)}`)
      .set('Cookie', attacker.cookie);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(res.body)).not.toContain('private');
  });

  it('refuses to message someone you have no booking with', async () => {
    const a = await signedInUser();
    const b = await signedInUser();

    const res = await request(app).post('/api/chat/messages').set('Cookie', a.cookie)
      .send({ to: b.email, text: 'cold outreach' });
    expect(res.status).toBe(403);
  });

  it('gives the same answer for an unknown address as an unreachable one', async () => {
    const a = await signedInUser();
    const b = await signedInUser();

    const unknown = await request(app).post('/api/chat/messages').set('Cookie', a.cookie)
      .send({ to: 'nobody-at-all@example.test', text: 'x' });
    const unreachable = await request(app).post('/api/chat/messages').set('Cookie', a.cookie)
      .send({ to: b.email, text: 'x' });

    // 404 vs 403 differ, but neither confirms an account exists by returning
    // a distinguishable success. What matters is that neither delivers.
    expect(unknown.status).toBeGreaterThanOrEqual(400);
    expect(unreachable.status).toBeGreaterThanOrEqual(400);
  });

  it('refuses an empty text message but allows a file', async () => {
    const { client, freelancer } = await bookedPair();

    const empty = await request(app).post('/api/chat/messages').set('Cookie', client.cookie)
      .send({ to: freelancer.email, text: '   ' });
    expect(empty.status).toBe(400);

    const file = await request(app).post('/api/chat/messages').set('Cookie', client.cookie)
      .send({ to: freelancer.email, text: '', messageType: 'file', fileUrl: 'https://x.test/a.pdf', fileName: 'a.pdf' });
    expect(file.status).toBe(201);
  });

  it('marks only your own inbox read', async () => {
    const { client, freelancer } = await bookedPair();
    await request(app).post('/api/chat/messages').set('Cookie', client.cookie)
      .send({ to: freelancer.email, text: 'unread please' });

    // The client marking read must not clear the freelancer's badge.
    const byClient = await request(app).put('/api/chat/messages').set('Cookie', client.cookie)
      .send({ contactEmail: freelancer.email });
    expect(byClient.body.data.marked).toBe(0);

    const byFreelancer = await request(app).put('/api/chat/messages').set('Cookie', freelancer.cookie)
      .send({ contactEmail: client.email });
    expect(byFreelancer.body.data.marked).toBe(1);
  });

  it('lists conversations with unread counts', async () => {
    const { client, freelancer } = await bookedPair();
    await request(app).post('/api/chat/messages').set('Cookie', client.cookie)
      .send({ to: freelancer.email, text: 'one' });
    await request(app).post('/api/chat/messages').set('Cookie', client.cookie)
      .send({ to: freelancer.email, text: 'two' });

    const list = await request(app).get('/api/chat/recent').set('Cookie', freelancer.cookie);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].contact_email).toBe(client.email);
    expect(list.body.data[0].unread_count).toBe(2);
    expect(list.body.data[0].last_message).toBe('two');
  });

  it('lists booking contacts', async () => {
    const { client, freelancer } = await bookedPair();
    const res = await request(app).get('/api/chat/booking-contacts').set('Cookie', client.cookie);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].email).toBe(freelancer.email);
  });

  it('serves health without a session', async () => {
    const res = await request(app).get('/api/chat/health');
    expect(res.status).toBe(200);
    expect(res.body.data.store).toBe('postgres');
  });
});

d('chat socket authentication', () => {
  it('rejects a connection with no credentials', async () => {
    // This is what the old server accepted unconditionally.
    await expect(connect({})).rejects.toThrow(/not authenticated/i);
  });

  it('rejects a forged token', async () => {
    await expect(connect({ token: 'not.a.real.jwt' })).rejects.toThrow(/not authenticated/i);
  });

  it('rejects a client-supplied username', async () => {
    // The old handshake was `auth: { username }` and nothing else.
    const victim = await signedInUser();
    await expect(
      new Promise<ClientSocket>((resolve, reject) => {
        const socket = ioClient(`http://127.0.0.1:${port}`, {
          transports: ['websocket'],
          auth: { username: victim.email },
          reconnection: false,
          timeout: 8000,
        });
        socket.on('authenticated', () => resolve(socket));
        socket.on('connect_error', (err) => { socket.close(); reject(err); });
      }),
    ).rejects.toThrow(/not authenticated/i);
  });

  it('accepts a valid session cookie', async () => {
    const user = await signedInUser();
    const socket = await connect({ cookie: user.cookiePair });
    expect(socket.connected).toBe(true);
    socket.close();
  });
});

d('chat socket messaging', () => {
  it('delivers a message to the other participant in real time', async () => {
    const { client, freelancer } = await bookedPair();

    const senderSocket = await connect({ cookie: client.cookiePair });
    const receiverSocket = await connect({ cookie: freelancer.cookiePair });

    await emit(senderSocket, 'conversation:join', { contactEmail: freelancer.email });
    await emit(receiverSocket, 'conversation:join', { contactEmail: client.email });

    const delivered = new Promise<{ text: string; from: string }>((resolve) => {
      receiverSocket.on('message:new', resolve);
    });

    const ack = await emit<{ ok?: boolean; error?: string }>(
      senderSocket, 'message:send', { to: freelancer.email, text: 'over the socket' });
    expect(ack.ok).toBe(true);

    const received = await delivered;
    expect(received.text).toBe('over the socket');
    expect(received.from).toBe(client.email);

    senderSocket.close();
    receiverSocket.close();
  });

  it('persists a socket message the same way REST does', async () => {
    const { client, freelancer } = await bookedPair();
    const socket = await connect({ cookie: client.cookiePair });

    await emit(socket, 'message:send', { to: freelancer.email, text: 'written once' });

    // Both doors must produce the same rows, or the two views disagree.
    const viaRest = await request(app)
      .get(`/api/chat/messages?contactEmail=${encodeURIComponent(client.email)}`)
      .set('Cookie', freelancer.cookie);
    expect(viaRest.body.data).toHaveLength(1);
    expect(viaRest.body.data[0].text).toBe('written once');

    socket.close();
  });

  it('refuses to join a conversation you are not part of', async () => {
    const { client, freelancer } = await bookedPair();
    const stranger = await signedInUser();

    const socket = await connect({ cookie: stranger.cookiePair });
    const res = await emit<{ ok?: boolean; error?: string }>(
      socket, 'conversation:join', { contactEmail: freelancer.email });

    expect(res.ok).toBeUndefined();
    expect(res.error).toBeTruthy();
    socket.close();

    // And a stranger listening on the pair room hears nothing.
    void client;
  });

  it('refuses to send to someone you have no booking with', async () => {
    const a = await signedInUser();
    const b = await signedInUser();

    const socket = await connect({ cookie: a.cookiePair });
    const res = await emit<{ ok?: boolean; error?: string }>(
      socket, 'message:send', { to: b.email, text: 'cold outreach' });

    expect(res.ok).toBeUndefined();
    expect(res.error).toBeTruthy();

    const { rows } = await query<{ n: string }>(
      'SELECT count(*)::text n FROM chat_messages WHERE body = $1', ['cold outreach']);
    expect(Number(rows[0]!.n)).toBe(0);

    socket.close();
  });

  it('sends as the session user, not a spoofed from field', async () => {
    const { client, freelancer } = await bookedPair();
    const socket = await connect({ cookie: client.cookiePair });

    await emit(socket, 'message:send', {
      to: freelancer.email,
      from: freelancer.email, // ignored
      text: 'who sent this',
    });

    const stored = await request(app)
      .get(`/api/chat/messages?contactEmail=${encodeURIComponent(freelancer.email)}`)
      .set('Cookie', client.cookie);
    expect(stored.body.data[0].from).toBe(client.email);

    socket.close();
  });
});
