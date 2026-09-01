/**
 * Chat REST routes.
 *
 * The identity of the person reading or sending is ALWAYS the session. The
 * routes these replace took `userEmail` from the query string, so passing
 * someone else's address returned their conversation — the same class of hole
 * as the socket server's missing authentication, on a different door.
 *
 * A `userEmail` parameter is still accepted and ignored, so existing callers
 * do not break.
 */
import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../lib/http.js';
import { notFound } from '../../lib/errors.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateBody } from '../../middleware/validate.js';
import * as repo from './repo.js';
import * as service from './service.js';

export const chatRouter = Router();
chatRouter.use(requireAuth);

const sender = (req: { user?: { userId: string; email: string } }) => ({
  userId: req.user!.userId,
  email: req.user!.email,
});

const listQuery = z.object({
  contactEmail: z.string().email().optional(),
  bookingId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

/** Health does not need a session; it is a liveness probe for the chat subsystem. */
export const chatHealthRouter = Router();
chatHealthRouter.get('/', async (_req, res) => {
  res.json({ success: true, data: { status: 'ok', transport: 'socket.io', store: 'postgres' } });
});

chatRouter.get('/messages', async (req, res, next) => {
  try {
    const q = listQuery.parse(req.query);

    if (q.bookingId) {
      // Scope by participation, not by the booking id alone.
      const contacts = await repo.bookingContacts(sender(req).userId);
      if (!contacts.some((c) => c.booking_id === q.bookingId)) {
        return next(notFound('No conversation for that booking'));
      }
      const rows = await repo.listForBooking(q.bookingId, q.limit, q.offset);
      return ok(res, rows.map(service.toMessageDto));
    }

    if (!q.contactEmail) return ok(res, []);

    const rows = await service.conversation(sender(req), q.contactEmail, q.limit, q.offset);
    ok(res, rows.map(service.toMessageDto));
  } catch (err) {
    next(err);
  }
});

const sendSchema = z.object({
  // `to` is the contact; `from` is ignored if sent — the sender is the session.
  to: z.string().email().optional(),
  contactEmail: z.string().email().optional(),
  text: z.string().max(10_000).optional(),
  body: z.string().max(10_000).optional(),
  bookingId: z.string().nullish(),
  messageType: z.enum(['text', 'file', 'image', 'system']).default('text'),
  fileUrl: z.string().max(2000).nullish(),
  fileName: z.string().max(300).nullish(),
  fileSize: z.union([z.number(), z.string()]).nullish(),
  replyTo: z.string().nullish(),
}).passthrough();

chatRouter.post('/messages', validateBody(sendSchema), async (req, res, next) => {
  try {
    const contactEmail = req.body.to ?? req.body.contactEmail;
    if (!contactEmail) return next(notFound('No recipient given'));

    const message = await service.sendMessage({
      sender: sender(req),
      contactEmail,
      body: req.body.text ?? req.body.body ?? '',
      bookingId: req.body.bookingId ?? null,
      messageType: req.body.messageType,
      fileUrl: req.body.fileUrl ?? null,
      fileName: req.body.fileName ?? null,
      fileSize: req.body.fileSize == null ? null : String(req.body.fileSize),
      replyTo: req.body.replyTo ?? null,
    });

    res.status(201).json({ success: true, data: service.toMessageDto(message) });
  } catch (err) {
    next(err);
  }
});

chatRouter.put('/messages', validateBody(z.object({
  contactEmail: z.string().email().optional(),
  from: z.string().email().optional(),
})), async (req, res, next) => {
  try {
    // `from` in the old shape meant "whose messages am I marking read".
    const contactEmail = req.body.contactEmail ?? req.body.from;
    if (!contactEmail) return ok(res, { marked: 0 });

    const contact = await service.resolveContact(sender(req), contactEmail);
    const marked = await repo.markRead(sender(req).userId, contact.id);
    ok(res, { marked });
  } catch (err) {
    next(err);
  }
});

chatRouter.get('/history', async (req, res, next) => {
  try {
    const q = listQuery.parse(req.query);
    if (!q.contactEmail) return ok(res, []);
    const rows = await service.conversation(sender(req), q.contactEmail, q.limit, q.offset);
    ok(res, rows.map(service.toMessageDto));
  } catch (err) {
    next(err);
  }
});

/**
 * The conversation list. Replaces both /recent and /messages/recent, which
 * answered the same question.
 */
chatRouter.get('/recent', async (req, res, next) => {
  try {
    ok(res, (await repo.listRelationships(sender(req).userId)).map(service.toRelationshipDto));
  } catch (err) {
    next(err);
  }
});

chatRouter.get('/relationships', async (req, res, next) => {
  try {
    ok(res, (await repo.listRelationships(sender(req).userId)).map(service.toRelationshipDto));
  } catch (err) {
    next(err);
  }
});

chatRouter.post('/initiate', validateBody(z.object({
  contactEmail: z.string().email().optional(),
  to: z.string().email().optional(),
  bookingId: z.string().nullish(),
}).passthrough()), async (req, res, next) => {
  try {
    const contactEmail = req.body.contactEmail ?? req.body.to;
    if (!contactEmail) return next(notFound('No contact given'));

    // Throws unless the two share a booking or already have a conversation.
    const contact = await service.resolveContact(sender(req), contactEmail);

    const existing = await repo.getRelationship(sender(req).userId, contact.id);
    if (!existing) {
      const { generateId } = await import('../../lib/ids.js');
      await repo.upsertRelationship(
        generateId('rel'), sender(req).userId, contact.id, req.body.bookingId ?? null, null, null);
    }

    const relationship = await repo.getRelationship(sender(req).userId, contact.id);
    res.status(201).json({ success: true, data: service.toRelationshipDto(relationship!) });
  } catch (err) {
    next(err);
  }
});

chatRouter.get('/booking-contacts', async (req, res, next) => {
  try {
    ok(res, await repo.bookingContacts(sender(req).userId));
  } catch (err) {
    next(err);
  }
});

/**
 * Issues nothing new: the socket authenticates with the same `sid` cookie the
 * REST routes use. Kept so the existing client call succeeds, and so the shape
 * says plainly that no separate chat token exists.
 */
chatRouter.get('/auth', (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.user!.userId,
      email: req.user!.email,
      // The socket reads the session cookie; there is no second credential.
      useSessionCookie: true,
    },
  });
});
