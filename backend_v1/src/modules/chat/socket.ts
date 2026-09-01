/**
 * Socket.IO chat, attached to the Express HTTP server.
 *
 * THE POINT OF THIS FILE IS AUTHENTICATION.
 *
 * The server it replaces (frontend/components/socketIoChat/server.ts) had none:
 *
 *     const username = socket.handshake.auth?.username;
 *     if (!username || typeof username !== "string") return next(new Error(...));
 *
 * That was the whole middleware. You were whoever you claimed to be — no
 * signature, no token, nothing. Anyone who could reach the socket could connect
 * as any user and read and send their private messages. The one nominal check,
 * `authenticateUser`, was a mock stub hardwired to `async () => true`.
 *
 * Here the handshake carries the same HS256 `sid` session the REST API uses,
 * identity comes from the verified token, and every room join is checked
 * against the database. A client-supplied username is ignored entirely.
 */
import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { verifySessionToken, type SessionData } from '../../lib/session.js';
import * as repo from './repo.js';
import * as service from './service.js';

interface AuthedSocket extends Socket {
  session?: SessionData;
}

/** Reads the session from a cookie header or an explicit auth token. */
function extractToken(socket: Socket): string | null {
  const fromAuth = socket.handshake.auth?.token;
  if (typeof fromAuth === 'string' && fromAuth.length > 0) return fromAuth;

  const header = socket.handshake.headers.cookie;
  if (typeof header === 'string') {
    for (const part of header.split(';')) {
      const [name, ...rest] = part.trim().split('=');
      if (name === env.SESSION_COOKIE_NAME) return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

/** A user's own room: every device they have connected on. */
const userRoom = (userId: string) => `user:${userId}`;

/**
 * A conversation room, named from the two participants sorted. Sorting makes
 * the name identical from either side, so both land in the same room without
 * needing a stored conversation id.
 */
const pairRoom = (a: string, b: string) => `pair:${[a, b].sort().join(':')}`;

export function attachChatSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: env.corsOrigins, credentials: true },
    // The cookie is httpOnly, so the browser sends it on the handshake only
    // when credentials are enabled on the client too.
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket: AuthedSocket, next) => {
    const token = extractToken(socket);
    if (!token) return next(new Error('Not authenticated'));

    const claims = await verifySessionToken(token);
    // Expired, forged, or signed with another secret — all "no".
    if (!claims) return next(new Error('Not authenticated'));

    socket.session = {
      userId: claims.userId,
      email: claims.email,
      isVerified: claims.isVerified,
    };
    next();
  });

  io.on('connection', (socket: AuthedSocket) => {
    const me = socket.session!;
    socket.join(userRoom(me.userId));

    logger.info({ userId: me.userId, socketId: socket.id }, 'Chat socket connected');

    socket.emit('authenticated', { userId: me.userId, email: me.email });

    /**
     * Join a conversation. The check is the same one the REST routes use, so
     * the socket cannot be a way around them.
     */
    socket.on('conversation:join', async (payload: { contactEmail?: string }, ack?: (r: unknown) => void) => {
      try {
        if (!payload?.contactEmail) throw new Error('contactEmail is required');
        const contact = await service.resolveContact(me, payload.contactEmail);

        socket.join(pairRoom(me.userId, contact.id));
        ack?.({ ok: true, contactId: contact.id });
      } catch (err) {
        // Never leak whether the account exists; the REST layer is equally terse.
        ack?.({ error: err instanceof Error ? err.message : 'Could not join that conversation' });
      }
    });

    socket.on('conversation:leave', (payload: { contactId?: string }) => {
      if (payload?.contactId) socket.leave(pairRoom(me.userId, payload.contactId));
    });

    socket.on('message:send', async (
      payload: {
        to?: string; contactEmail?: string; text?: string; bookingId?: string | null;
        messageType?: string; fileUrl?: string | null; fileName?: string | null;
      },
      ack?: (r: unknown) => void,
    ) => {
      try {
        const contactEmail = payload?.to ?? payload?.contactEmail;
        if (!contactEmail) throw new Error('A recipient is required');

        // Same service call as POST /api/chat/messages: one set of rules, one
        // set of rows. A socket write and a REST write are indistinguishable
        // afterwards.
        const message = await service.sendMessage({
          sender: me,
          contactEmail,
          body: payload.text ?? '',
          bookingId: payload.bookingId ?? null,
          messageType: payload.messageType ?? 'text',
          fileUrl: payload.fileUrl ?? null,
          fileName: payload.fileName ?? null,
        });

        const dto = service.toMessageDto(message);

        // To the pair room (both participants' open conversations) and to the
        // recipient's own room, so they are notified even with the thread closed.
        io.to(pairRoom(me.userId, message.to_user_id)).emit('message:new', dto);
        io.to(userRoom(message.to_user_id)).emit('message:notify', dto);

        await repo.markDelivered([message.id]);
        ack?.({ ok: true, message: dto });
      } catch (err) {
        ack?.({ error: err instanceof Error ? err.message : 'Could not send that message' });
      }
    });

    socket.on('message:read', async (payload: { contactEmail?: string }, ack?: (r: unknown) => void) => {
      try {
        if (!payload?.contactEmail) throw new Error('contactEmail is required');
        const contact = await service.resolveContact(me, payload.contactEmail);
        // Scoped to the caller's inbox by the query itself.
        const marked = await repo.markRead(me.userId, contact.id);

        io.to(userRoom(contact.id)).emit('message:read', { by: me.email, count: marked });
        ack?.({ ok: true, marked });
      } catch (err) {
        ack?.({ error: err instanceof Error ? err.message : 'Could not mark as read' });
      }
    });

    socket.on('typing', async (payload: { contactEmail?: string; typing?: boolean }) => {
      try {
        if (!payload?.contactEmail) return;
        // Authorized like everything else: typing indicators leak presence.
        const contact = await service.resolveContact(me, payload.contactEmail);
        socket.to(pairRoom(me.userId, contact.id))
          .emit('typing', { from: me.email, typing: Boolean(payload.typing) });
      } catch {
        // A failed authorization is simply no indicator.
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info({ userId: me.userId, socketId: socket.id, reason }, 'Chat socket disconnected');
    });
  });

  return io;
}
