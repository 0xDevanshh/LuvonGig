/**
 * Booking, stage and review routes.
 *
 * Two things the canister could not enforce and this does:
 *
 *   1. Every booking read and write is scoped to its two parties. There is no
 *      route that returns a booking to a third party.
 *   2. Status changes go through an explicit state machine. The canister let
 *      any status become any other, so a cancelled booking could be marked
 *      completed and a completed one reopened.
 */
import { Router } from 'express';
import { z } from 'zod';
import { withTransaction } from '../../db/pool.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { ok } from '../../lib/http.js';
import { newBookingId, newReviewId, newStageId } from '../../lib/ids.js';
import { splitPlatformFee } from '../../lib/money.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateBody, param } from '../../middleware/validate.js';
import * as repo from './repo.js';
import * as serviceRepo from '../services/repo.js';
import { toBookingDto, toStageDto, toTimelineDto } from './dto.js';

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth);

/**
 * Legal booking transitions. Terminal states have no outgoing edges — the
 * canister's updateBookingStatus accepted any value, which is how a cancelled
 * booking could be marked completed.
 */
const TRANSITIONS: Record<repo.BookingStatus, repo.BookingStatus[]> = {
  pending: ['active', 'cancelled'],
  active: ['completed', 'in_dispute', 'cancelled'],
  in_dispute: ['active', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/** Who may make each transition. */
const TRANSITION_ACTOR: Record<string, 'client' | 'freelancer' | 'either'> = {
  'pending->active': 'freelancer',
  'pending->cancelled': 'either',
  'active->completed': 'freelancer',
  'active->in_dispute': 'either',
  'active->cancelled': 'either',
  'in_dispute->active': 'either',
  'in_dispute->completed': 'client',
  'in_dispute->cancelled': 'either',
};

const EVENT_FOR: Record<repo.BookingStatus, string> = {
  pending: 'booking_created',
  active: 'work_started',
  in_dispute: 'dispute_raised',
  completed: 'booking_completed',
  cancelled: 'booking_cancelled',
};

type Party = 'client' | 'freelancer';

/** Loads a booking and asserts the caller is one of its two parties. */
async function loadForParty(bookingId: string, userId: string) {
  const booking = await repo.getBooking(bookingId);
  // A third party gets "not found", not "forbidden": otherwise this endpoint
  // confirms which booking ids exist.
  if (!booking) throw notFound('Booking not found');
  if (booking.client_id !== userId && booking.freelancer_id !== userId) {
    throw notFound('Booking not found');
  }
  const party: Party = booking.client_id === userId ? 'client' : 'freelancer';
  return { booking, party };
}

const listQuery = z.object({
  role: z.enum(['client', 'freelancer', 'any']).default('any'),
  status: z.enum(['pending', 'active', 'in_dispute', 'completed', 'cancelled']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

bookingsRouter.get('/', async (req, res, next) => {
  try {
    const q = listQuery.parse(req.query);
    const { rows, total } = await repo.listBookings({ ...q, userId: req.user!.userId });
    res.json({ success: true, data: rows.map(toBookingDto), total });
  } catch (err) {
    next(err);
  }
});

const createBooking = z.object({
  package_id: z.string().min(1),
  requirements: z.array(z.string().max(2000)).max(50).default([]),
  special_instructions: z.string().max(4000).default(''),
  promo_code: z.string().max(60).nullish(),
  discount_minor: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
    .transform((v) => BigInt(v)).default(0),
});

bookingsRouter.post('/', validateBody(createBooking), async (req, res, next) => {
  try {
    const body = req.body as {
      package_id: string; requirements: string[]; special_instructions: string;
      promo_code?: string | null; discount_minor: bigint;
    };

    const pkg = await serviceRepo.getPackage(body.package_id);
    if (!pkg || !pkg.is_active) return next(notFound('Package not found'));

    const service = await serviceRepo.getService(pkg.service_id);
    if (!service || service.status !== 'active') {
      return next(badRequest('That service is not currently available'));
    }
    if (service.freelancer_id === req.user!.userId) {
      // booking_parties_differ would reject this anyway.
      return next(badRequest('You cannot book your own service'));
    }
    if (service.price_needs_review || pkg.price_needs_review) {
      // Migrated rows carry a placeholder price; selling at it would be wrong.
      return next(conflict('This service is being repriced and cannot be booked yet'));
    }

    const base = BigInt(pkg.price_minor);
    const discount = body.discount_minor;
    if (discount > base) return next(badRequest('Discount cannot exceed the package price'));

    // booking_amounts_balance: total = base + fee - discount.
    const { fee } = splitPlatformFee(base);
    const total = base + fee - discount;

    const bookingId = newBookingId();

    // Booking and its first timeline event are one unit of work.
    await withTransaction(async (client) => {
      await repo.insertBooking(client, {
        id: bookingId,
        serviceId: service.id,
        packageId: pkg.id,
        clientId: req.user!.userId,
        freelancerId: service.freelancer_id,
        title: service.title,
        description: pkg.description,
        requirements: body.requirements,
        specialInstructions: body.special_instructions,
        currency: pkg.currency,
        totalMinor: total,
        baseMinor: base,
        feeMinor: fee,
        discountMinor: discount,
        promoCode: body.promo_code ?? null,
        // Immutable record of what was agreed: editing the package later must
        // not change the terms of an existing order.
        packageSnapshot: {
          tier: pkg.tier, title: pkg.name, description: pkg.description,
          price_minor: pkg.price_minor, currency: pkg.currency,
          revisions: pkg.revisions, features: pkg.features,
          delivery_time_days: pkg.delivery_time_days,
        },
        deliveryDays: pkg.delivery_time_days,
      });

      await repo.addTimelineEvent(client, bookingId, 'booking_created', req.user!.userId,
        'Booking created', { packageId: pkg.id, serviceId: service.id });
    });

    const created = await repo.getBooking(bookingId);
    res.status(201).json({ success: true, data: toBookingDto(created!) });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get('/:bookingId', async (req, res, next) => {
  try {
    const { booking } = await loadForParty(param(req, 'bookingId'), req.user!.userId);
    const [stages, timeline] = await Promise.all([
      repo.listStages(booking.id), repo.getTimeline(booking.id),
    ]);
    ok(res, {
      ...toBookingDto(booking),
      stages: stages.map(toStageDto),
      timeline: timeline.map(toTimelineDto),
    });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get('/:bookingId/status', async (req, res, next) => {
  try {
    const { booking, party } = await loadForParty(param(req, 'bookingId'), req.user!.userId);
    ok(res, {
      booking_id: booking.id,
      status: booking.status,
      payment_status: booking.payment_status,
      // Tells the UI which buttons to show, instead of it guessing.
      allowed_transitions: TRANSITIONS[booking.status].filter((to) => {
        const who = TRANSITION_ACTOR[`${booking.status}->${to}`];
        return who === 'either' || who === party;
      }),
    });
  } catch (err) {
    next(err);
  }
});

const statusUpdate = z.object({
  status: z.enum(['pending', 'active', 'in_dispute', 'completed', 'cancelled']),
  note: z.string().max(1000).optional(),
});

bookingsRouter.put('/:bookingId/status', validateBody(statusUpdate), async (req, res, next) => {
  try {
    const { booking, party } = await loadForParty(param(req, 'bookingId'), req.user!.userId);
    const next_ = req.body.status as repo.BookingStatus;

    if (next_ === booking.status) return ok(res, toBookingDto(booking));

    if (!TRANSITIONS[booking.status].includes(next_)) {
      return next(conflict(
        `A ${booking.status.replace('_', ' ')} booking cannot become ${next_.replace('_', ' ')}`,
      ));
    }

    const who = TRANSITION_ACTOR[`${booking.status}->${next_}`];
    if (who !== 'either' && who !== party) {
      return next(forbidden(`Only the ${who} can do that`));
    }

    await withTransaction(async (client) => {
      await repo.setStatus(client, booking.id, next_);
      await repo.addTimelineEvent(client, booking.id, EVENT_FOR[next_], req.user!.userId,
        req.body.note || `Status changed to ${next_}`, { from: booking.status, to: next_ });
    });

    ok(res, toBookingDto((await repo.getBooking(booking.id))!));
  } catch (err) {
    next(err);
  }
});

/**
 * Marks a booking paid. Interim: real payment capture arrives in Phase 5, and
 * this will then be driven by a verified provider webhook rather than a client
 * call. Restricted to the client so a freelancer cannot mark their own work paid.
 */
bookingsRouter.post('/:bookingId/paid', async (req, res, next) => {
  try {
    const { booking, party } = await loadForParty(param(req, 'bookingId'), req.user!.userId);
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

const reviewInput = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(4000).default(''),
});

bookingsRouter.post('/:bookingId/review', validateBody(reviewInput), async (req, res, next) => {
  try {
    const { booking, party } = await loadForParty(param(req, 'bookingId'), req.user!.userId);

    if (booking.status !== 'completed') {
      return next(conflict('You can only review a completed booking'));
    }
    // UNIQUE (booking_id, reviewer_id) backs this up; the canister allowed
    // unlimited resubmission, which let one client inflate a rating.
    if (await repo.findReview(booking.id, req.user!.userId)) {
      return next(conflict('You have already reviewed this booking'));
    }

    const revieweeId = party === 'client' ? booking.freelancer_id : booking.client_id;

    await withTransaction(async (client) => {
      await repo.insertReview(client, {
        id: newReviewId(),
        bookingId: booking.id,
        reviewerId: req.user!.userId,
        revieweeId,
        serviceId: booking.service_id,
        rating: req.body.rating,
        comment: req.body.comment,
      });
      await repo.markReviewed(client, booking.id, party);
      await repo.addTimelineEvent(client, booking.id,
        party === 'client' ? 'client_reviewed' : 'freelancer_reviewed',
        req.user!.userId, 'Review submitted', { rating: req.body.rating });
    });

    // services.rating_avg is refreshed by trigger, so re-read to return it.
    ok(res, toBookingDto((await repo.getBooking(booking.id))!));
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get('/:bookingId/timeline', async (req, res, next) => {
  try {
    const { booking } = await loadForParty(param(req, 'bookingId'), req.user!.userId);
    ok(res, (await repo.getTimeline(booking.id)).map(toTimelineDto));
  } catch (err) {
    next(err);
  }
});

// --- Stages ----------------------------------------------------------------

bookingsRouter.get('/:bookingId/stages', async (req, res, next) => {
  try {
    const { booking } = await loadForParty(param(req, 'bookingId'), req.user!.userId);
    ok(res, (await repo.listStages(booking.id)).map(toStageDto));
  } catch (err) {
    next(err);
  }
});

const stageInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(4000).default(''),
  amount_minor: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
    .transform((v) => String(v)).default('0'),
  due_date: z.string().datetime().nullish(),
});

bookingsRouter.post('/:bookingId/stages', validateBody(stageInput), async (req, res, next) => {
  try {
    const { booking, party } = await loadForParty(param(req, 'bookingId'), req.user!.userId);
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

export const stagesRouter = Router();
stagesRouter.use(requireAuth);

stagesRouter.get('/:stageId', async (req, res, next) => {
  try {
    const stage = await repo.getStage(param(req, 'stageId'));
    if (!stage) return next(notFound('Stage not found'));
    await loadForParty(stage.booking_id, req.user!.userId);
    ok(res, toStageDto(stage));
  } catch (err) {
    next(err);
  }
});

const stageUpdate = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'approved', 'rejected', 'cancelled', 'disputed']).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional(),
  deliverables: z.array(z.string().max(2000)).max(50).optional(),
  dispute_reason: z.string().max(2000).nullish(),
});

stagesRouter.put('/:stageId', validateBody(stageUpdate), async (req, res, next) => {
  try {
    const stage = await repo.getStage(param(req, 'stageId'));
    if (!stage) return next(notFound('Stage not found'));
    const { party } = await loadForParty(stage.booking_id, req.user!.userId);

    const status = req.body.status as string | undefined;

    // Approving or rejecting is the client's call; doing the work is the
    // freelancer's. Without this a freelancer could approve their own stage
    // and release its payment.
    if (status === 'approved' || status === 'rejected') {
      if (party !== 'client') return next(forbidden('Only the client can approve or reject a stage'));
    } else if (status && party !== 'freelancer') {
      return next(forbidden('Only the freelancer can update stage progress'));
    }

    const patch = {
      ...req.body,
      disputeReason: req.body.dispute_reason,
      ...(status === 'approved' && { clientApproved: true }),
      ...(status === 'completed' && { freelancerApproved: true }),
    };

    const updated = await withTransaction(async (client) => {
      const row = await repo.updateStage(client, stage.id, patch);
      if (status) {
        const eventType =
          status === 'approved' ? 'stage_approved'
          : status === 'rejected' ? 'stage_rejected'
          : 'stage_updated';
        await repo.addTimelineEvent(client, stage.booking_id, eventType, req.user!.userId,
          `Stage "${row?.name ?? stage.name}" ${status}`, { stageId: stage.id, status });
      }
      return row;
    });

    ok(res, toStageDto(updated!));
  } catch (err) {
    next(err);
  }
});
