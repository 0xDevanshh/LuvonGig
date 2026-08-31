/**
 * Compatibility endpoints for the collection-level shapes the canister-backed
 * routes used, where the booking id arrived in a query string or body rather
 * than the path:
 *
 *   POST /api/marketplace/bookings/paid   { bookingId, clientId }
 *   GET  /api/marketplace/stages?booking_id=...
 *   POST /api/marketplace/stages          { booking_id, ... }
 *   GET  /api/marketplace/deliverables?bookingId=...
 *
 * They exist so Phase 3 can move every route without editing pages. The
 * path-based equivalents under /api/bookings/:id are the real interface;
 * delete this file in Phase 7 once callers have moved.
 *
 * `clientId` from the old paid-booking body is deliberately ignored: identity
 * comes from the session. Trusting a caller-supplied user id is what let the
 * canister-era code act as somebody else.
 */
import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../../db/pool.js';
import { conflict, forbidden, notFound } from '../../lib/errors.js';
import { ok } from '../../lib/http.js';
import { generateId, newStageId } from '../../lib/ids.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateBody } from '../../middleware/validate.js';
import * as repo from './repo.js';
import { toBookingDto, toStageDto, toTimelineDto } from './dto.js';

export const compatRouter = Router();
compatRouter.use(requireAuth);

async function loadForParty(bookingId: string, userId: string) {
  const booking = await repo.getBooking(bookingId);
  if (!booking) throw notFound('Booking not found');
  if (booking.client_id !== userId && booking.freelancer_id !== userId) {
    throw notFound('Booking not found');
  }
  return { booking, party: booking.client_id === userId ? ('client' as const) : ('freelancer' as const) };
}

compatRouter.post('/bookings/paid',
  validateBody(z.object({ bookingId: z.string().min(1) }).passthrough()),
  async (req, res, next) => {
    try {
      const { booking, party } = await loadForParty(req.body.bookingId, req.user!.userId);
      if (party !== 'client') return next(forbidden('Only the client can confirm payment'));
      if (booking.payment_status !== 'pending') {
        return next(conflict('Payment has already been recorded for this booking'));
      }

      await withTransaction(async (client) => {
        await repo.setPaymentStatus(client, booking.id, 'held_in_escrow');
        if (booking.status === 'pending') await repo.setStatus(client, booking.id, 'active');
        await repo.addTimelineEvent(client, booking.id, 'payment_completed', req.user!.userId,
          'Payment recorded', {});
      });

      ok(res, toBookingDto((await repo.getBooking(booking.id))!));
    } catch (err) {
      next(err);
    }
  });

const bookingIdQuery = z.object({
  booking_id: z.string().min(1).optional(),
  bookingId: z.string().min(1).optional(),
});

compatRouter.get('/stages', async (req, res, next) => {
  try {
    const q = bookingIdQuery.parse(req.query);
    const bookingId = q.booking_id ?? q.bookingId;
    if (!bookingId) return ok(res, []);

    const { booking } = await loadForParty(bookingId, req.user!.userId);
    ok(res, (await repo.listStages(booking.id)).map(toStageDto));
  } catch (err) {
    next(err);
  }
});

compatRouter.post('/stages',
  validateBody(z.object({
    booking_id: z.string().min(1),
    name: z.string().min(1).max(200),
    description: z.string().max(4000).default(''),
    amount_minor: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
      .transform((v) => String(v)).default('0'),
    due_date: z.string().datetime().nullish(),
  })),
  async (req, res, next) => {
    try {
      const { booking, party } = await loadForParty(req.body.booking_id, req.user!.userId);
      if (party !== 'freelancer') return next(forbidden('Only the freelancer can add stages'));
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        return next(conflict('This booking is closed'));
      }

      const existing = await repo.listStages(booking.id);
      const stageId = newStageId();

      await withTransaction(async (client) => {
        await repo.insertStage(client, stageId, booking.id, {
          name: req.body.name,
          description: req.body.description,
          amountMinor: req.body.amount_minor,
          currency: booking.currency,
          dueDate: req.body.due_date ?? null,
          sortOrder: existing.length,
        });
        await repo.addTimelineEvent(client, booking.id, 'stage_created', req.user!.userId,
          `Stage "${req.body.name}" added`, { stageId });
      });

      res.status(201).json({ success: true, data: toStageDto((await repo.getStage(stageId))!) });
    } catch (err) {
      next(err);
    }
  });

compatRouter.get('/events', async (req, res, next) => {
  try {
    const q = bookingIdQuery.parse(req.query);
    const bookingId = q.booking_id ?? q.bookingId;
    // The canister exposed a global event log. There is no such thing here:
    // timeline events belong to a booking and only its parties may read them.
    if (!bookingId) return ok(res, []);

    const { booking } = await loadForParty(bookingId, req.user!.userId);
    ok(res, (await repo.getTimeline(booking.id)).map(toTimelineDto));
  } catch (err) {
    next(err);
  }
});

// --- Deliverables ----------------------------------------------------------

interface DeliverableRow {
  id: string;
  booking_id: string;
  stage_id: string | null;
  uploaded_by: string;
  file_url: string;
  file_name: string;
  file_size: string | null;
  file_type: string | null;
  note: string | null;
  created_at: Date;
}

const toDeliverableDto = (d: DeliverableRow) => ({
  id: d.id,
  booking_id: d.booking_id,
  stage_id: d.stage_id,
  uploaded_by: d.uploaded_by,
  file_url: d.file_url,
  file_name: d.file_name,
  file_size: d.file_size,
  file_type: d.file_type,
  note: d.note,
  created_at: d.created_at,
});

compatRouter.get('/deliverables', async (req, res, next) => {
  try {
    const q = bookingIdQuery.parse(req.query);
    const bookingId = q.bookingId ?? q.booking_id;
    if (!bookingId) return ok(res, []);

    const { booking } = await loadForParty(bookingId, req.user!.userId);
    const { rows } = await query<DeliverableRow>(
      'SELECT * FROM deliverables WHERE booking_id = $1 ORDER BY created_at DESC',
      [booking.id],
    );
    ok(res, rows.map(toDeliverableDto));
  } catch (err) {
    next(err);
  }
});

compatRouter.post('/deliverables',
  validateBody(z.object({
    booking_id: z.string().min(1),
    stage_id: z.string().min(1).nullish(),
    file_url: z.string().url().max(2000),
    file_name: z.string().min(1).max(300),
    file_size: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]).nullish(),
    file_type: z.string().max(120).nullish(),
    note: z.string().max(2000).nullish(),
  })),
  async (req, res, next) => {
    try {
      const { booking, party } = await loadForParty(req.body.booking_id, req.user!.userId);
      // Deliverables are the work product; the client receives them.
      if (party !== 'freelancer') {
        return next(forbidden('Only the freelancer can upload deliverables'));
      }

      const id = generateId('dlv');
      await query(
        `INSERT INTO deliverables (id, booking_id, stage_id, uploaded_by, file_url, file_name,
           file_size, file_type, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, booking.id, req.body.stage_id ?? null, req.user!.userId, req.body.file_url,
         req.body.file_name,
         req.body.file_size == null ? null : String(req.body.file_size),
         req.body.file_type ?? null, req.body.note ?? null],
      );

      const { rows } = await query<DeliverableRow>('SELECT * FROM deliverables WHERE id = $1', [id]);
      res.status(201).json({ success: true, data: toDeliverableDto(rows[0]!) });
    } catch (err) {
      next(err);
    }
  });
