/**
 * Expert profile and expert-session-booking routes.
 *
 * `POST /api/payments/expert-session` (payments/purposes.ts) already charges
 * for and creates the `expert_bookings` row correctly — this module only
 * adds what was missing around it: creating/listing/reading an expert
 * profile, and listing the bookings tied to one.
 */
import { Router } from 'express';
import { z } from 'zod';
import { notFound } from '../../lib/errors.js';
import { ok } from '../../lib/http.js';
import { newExpertId } from '../../lib/ids.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateBody } from '../../middleware/validate.js';
import * as repo from './repo.js';
import { toBookingDto, toExpertDto } from './dto.js';

export const expertsRouter = Router();
export const expertBookingsRouter = Router();
expertBookingsRouter.use(requireAuth);

const money = z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
  .transform((v) => String(v));

const expertInput = z.object({
  headline: z.string().max(200).default(''),
  bio: z.string().max(4000).default(''),
  expertise: z.array(z.string().max(60)).max(30).default([]),
  hourly_rate_minor: money,
  currency: z.string().length(3).default('USD'),
});

const listQuery = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

expertsRouter.get('/', async (req, res, next) => {
  try {
    const q = listQuery.parse(req.query);
    const { rows, total } = await repo.listExperts(q);
    res.json({ success: true, data: rows.map(toExpertDto), total });
  } catch (err) {
    next(err);
  }
});

// Registered before "/:id" so a literal "me" is never captured as an id.
expertsRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const expert = await repo.getExpertByUserId(req.user!.userId);
    if (!expert) return next(notFound('You have not set up an expert profile yet'));
    ok(res, toExpertDto(expert));
  } catch (err) {
    next(err);
  }
});

expertsRouter.get('/:id', async (req, res, next) => {
  try {
    const expert = await repo.getExpert(req.params.id!);
    if (!expert || !expert.is_active) return next(notFound('Expert not found'));
    ok(res, toExpertDto(expert));
  } catch (err) {
    next(err);
  }
});

expertsRouter.post('/', requireAuth, validateBody(expertInput), async (req, res, next) => {
  try {
    // Upsert by user_id: a user has exactly one expert profile, so
    // registering again edits it rather than erroring.
    const existing = await repo.getExpertByUserId(req.user!.userId);
    const id = existing?.id ?? newExpertId();
    await repo.upsertExpert(id, req.user!.userId, req.body);

    const expert = await repo.getExpert(id);
    res.status(existing ? 200 : 201).json({ success: true, data: toExpertDto(expert!) });
  } catch (err) {
    next(err);
  }
});

const expertUpdate = expertInput.partial().extend({ is_active: z.boolean().optional() });

expertsRouter.put('/me', requireAuth, validateBody(expertUpdate), async (req, res, next) => {
  try {
    const existing = await repo.getExpertByUserId(req.user!.userId);
    if (!existing) return next(notFound('You have not set up an expert profile yet'));

    const updated = await repo.updateExpert(req.user!.userId, req.body);
    ok(res, toExpertDto(updated!));
  } catch (err) {
    next(err);
  }
});

// --- Bookings ----------------------------------------------------------

const bookingsQuery = z.object({
  role: z.enum(['client', 'expert', 'any']).default('any'),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

expertBookingsRouter.get('/', async (req, res, next) => {
  try {
    const q = bookingsQuery.parse(req.query);
    const userId = req.user!.userId;

    if (q.role === 'client') {
      const rows = await repo.listBookingsForClient(userId, q);
      return res.json({ success: true, data: rows.map(toBookingDto) });
    }

    // 'expert' and 'any' both need the caller's own expert profile — someone
    // with no profile simply has no bookings to receive.
    const expert = await repo.getExpertByUserId(userId);
    if (q.role === 'expert') {
      const rows = expert ? await repo.listBookingsForExpert(expert.id, q) : [];
      return res.json({ success: true, data: rows.map(toBookingDto) });
    }

    const [asClient, asExpert] = await Promise.all([
      repo.listBookingsForClient(userId, q),
      expert ? repo.listBookingsForExpert(expert.id, q) : Promise.resolve([]),
    ]);
    res.json({ success: true, data: [...asClient, ...asExpert].map(toBookingDto) });
  } catch (err) {
    next(err);
  }
});
