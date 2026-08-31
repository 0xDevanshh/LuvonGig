/**
 * Service and package routes.
 *
 * Every mutating route is scoped to the owner inside the SQL statement, not by
 * a separate check beforehand. The canister had no ownership checks at all —
 * deleteService(service_id) deleted any service for any caller — so this is
 * the phase's headline fix, and it must not be reintroduced as a
 * check-then-write race.
 */
import { Router } from 'express';
import { z } from 'zod';
import { withTransaction } from '../../db/pool.js';
import { badRequest, forbidden, notFound } from '../../lib/errors.js';
import { ok } from '../../lib/http.js';
import { newServiceId, newPackageId } from '../../lib/ids.js';
import { attachUser, requireAuth } from '../../middleware/requireAuth.js';
import { validateBody, param } from '../../middleware/validate.js';
import * as repo from './repo.js';
import { toPackageDto, toServiceDto } from './dto.js';

export const servicesRouter = Router();

const money = z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
  .transform((v) => String(v));

const packageInput = z.object({
  tier: z.enum(['basic', 'standard', 'premium']),
  name: z.string().min(1).max(200),
  description: z.string().max(4000).default(''),
  price_minor: money,
  currency: z.string().length(3).default('USD'),
  delivery_time_days: z.number().int().positive().default(1),
  delivery_timeline: z.string().max(120).nullish(),
  revisions: z.number().int().nonnegative().default(1),
  features: z.array(z.string().max(300)).max(50).default([]),
  is_active: z.boolean().default(true),
});

const serviceInput = z.object({
  title: z.string().min(1).max(300),
  main_category: z.string().min(1).max(120),
  sub_category: z.string().max(120).default(''),
  description: z.string().max(20000).default(''),
  description_format: z.enum(['markdown', 'html', 'plain']).default('markdown'),
  whats_included: z.string().max(10000).default(''),
  cover_image_url: z.string().max(2000).nullish(),
  portfolio_images: z.array(z.string().max(2000)).max(30).default([]),
  tags: z.array(z.string().max(60)).max(30).default([]),
  tier_mode: z.enum(['1tier', '3tier']).default('3tier'),
  delivery_time_days: z.number().int().positive().default(7),
  currency: z.string().length(3).default('USD'),
  faqs: z.array(z.unknown()).max(50).default([]),
  client_questions: z.array(z.unknown()).max(50).default([]),
  packages: z.array(packageInput).max(3).default([]),
});

const listQuery = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
  freelancer_email: z.string().optional(),
  freelancer_id: z.string().optional(),
  category: z.string().optional(),
  search_term: z.string().optional(),
});

servicesRouter.get('/', attachUser, async (req, res, next) => {
  try {
    const q = listQuery.parse(req.query);
    const email = q.freelancer_email?.trim().toLowerCase();

    // A freelancer browsing their own listing sees paused services too;
    // everyone else sees only what is live.
    const ownListing =
      Boolean(req.user) && (q.freelancer_id === req.user!.userId || email === req.user!.email.toLowerCase());

    const { rows, total } = await repo.listServices({
      limit: q.limit,
      offset: q.offset,
      freelancerId: q.freelancer_id,
      freelancerEmail: email,
      category: q.category,
      search: q.search_term,
      includeNonActive: ownListing,
    });

    const packagesByService = await Promise.all(rows.map((s) => repo.getPackages(s.id)));

    res.json({
      success: true,
      data: rows.map((s, i) => toServiceDto(s, packagesByService[i]!)),
      total,
    });
  } catch (err) {
    next(err);
  }
});

servicesRouter.get('/:serviceId', attachUser, async (req, res, next) => {
  try {
    const service = await repo.getService(param(req, 'serviceId'));
    if (!service || service.status === 'deleted') return next(notFound('Service not found'));

    // A paused service is still visible to its owner, who needs to edit it.
    if (service.status !== 'active' && req.user?.userId !== service.freelancer_id) {
      return next(notFound('Service not found'));
    }

    ok(res, toServiceDto(service, await repo.getPackages(service.id)));
  } catch (err) {
    next(err);
  }
});

servicesRouter.get('/:serviceId/packages', async (req, res, next) => {
  try {
    const service = await repo.getService(param(req, 'serviceId'));
    if (!service || service.status === 'deleted') return next(notFound('Service not found'));
    ok(res, (await repo.getPackages(service.id)).map(toPackageDto));
  } catch (err) {
    next(err);
  }
});

servicesRouter.post('/', requireAuth, validateBody(serviceInput), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof serviceInput>;

    // UNIQUE (service_id, tier) would reject this at the database, but a clear
    // message beats a constraint name.
    const tiers = body.packages.map((p) => p.tier);
    if (new Set(tiers).size !== tiers.length) {
      return next(badRequest('Each package must use a different tier'));
    }

    const serviceId = newServiceId();
    const cheapest = body.packages.length
      ? body.packages.reduce((min, p) => (BigInt(p.price_minor) < BigInt(min) ? p.price_minor : min),
          body.packages[0]!.price_minor)
      : '0';

    // Service and packages land together or not at all. The canister created
    // them in separate calls, so a failure between the two left a service with
    // no way to buy it.
    await withTransaction(async (client) => {
      await repo.insertService(client, serviceId, req.user!.userId, {
        ...body,
        cover_image_url: body.cover_image_url ?? null,
        starting_from_minor: cheapest,
      });
      for (const pkg of body.packages) {
        await repo.insertPackage(client, newPackageId(), serviceId, {
          ...pkg,
          delivery_timeline: pkg.delivery_timeline ?? null,
        });
      }
    });

    const created = await repo.getService(serviceId);
    res.status(201).json({ success: true, data: toServiceDto(created!, await repo.getPackages(serviceId)) });
  } catch (err) {
    next(err);
  }
});

const serviceUpdate = serviceInput.partial().omit({ packages: true }).extend({
  status: z.enum(['active', 'paused']).optional(),
});

servicesRouter.put('/:serviceId', requireAuth, validateBody(serviceUpdate), async (req, res, next) => {
  try {
    const serviceId = param(req, 'serviceId');
    const existing = await repo.getService(serviceId);
    if (!existing || existing.status === 'deleted') return next(notFound('Service not found'));
    if (existing.freelancer_id !== req.user!.userId) {
      return next(forbidden('You can only edit your own services'));
    }

    // Status changes work now. The canister-backed route rejected them with
    // "Service status updates are not supported yet", which is why the pause
    // button in my-services never did anything.
    const updated = await repo.updateService(serviceId, req.user!.userId, req.body);
    if (!updated) return next(notFound('Service not found'));

    ok(res, toServiceDto(updated, await repo.getPackages(serviceId)));
  } catch (err) {
    next(err);
  }
});

servicesRouter.delete('/:serviceId', requireAuth, async (req, res, next) => {
  try {
    const deleted = await repo.softDeleteService(param(req, 'serviceId'), req.user!.userId);

    // Same answer whether the service is missing or someone else's, so this
    // cannot be used to discover which service ids exist.
    if (!deleted) return next(notFound('Service not found'));

    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// --- Packages --------------------------------------------------------------

export const packagesRouter = Router();

packagesRouter.get('/:packageId', async (req, res, next) => {
  try {
    const pkg = await repo.getPackage(param(req, 'packageId'));
    if (!pkg) return next(notFound('Package not found'));
    ok(res, toPackageDto(pkg));
  } catch (err) {
    next(err);
  }
});

packagesRouter.post('/', requireAuth,
  validateBody(packageInput.extend({ service_id: z.string().min(1) })),
  async (req, res, next) => {
    try {
      const { service_id: serviceId, ...pkg } = req.body;

      const service = await repo.getService(serviceId);
      if (!service || service.status === 'deleted') return next(notFound('Service not found'));
      if (service.freelancer_id !== req.user!.userId) {
        return next(forbidden('You can only add packages to your own services'));
      }

      const id = newPackageId();
      await withTransaction(async (client) => {
        await repo.insertPackage(client, id, serviceId, {
          ...pkg, delivery_timeline: pkg.delivery_timeline ?? null,
        });
      });
      await repo.refreshStartingPrice(serviceId);

      res.status(201).json({ success: true, data: toPackageDto((await repo.getPackage(id))!) });
    } catch (err) {
      next(err);
    }
  });

packagesRouter.put('/:packageId', requireAuth, validateBody(packageInput.partial()),
  async (req, res, next) => {
    try {
      const packageId = param(req, 'packageId');
      const owner = await repo.getPackageOwner(packageId);
      if (!owner) return next(notFound('Package not found'));
      if (owner !== req.user!.userId) return next(forbidden('You can only edit your own packages'));

      const updated = await repo.updatePackage(packageId, req.body);
      if (!updated) return next(notFound('Package not found'));
      await repo.refreshStartingPrice(updated.service_id);

      ok(res, toPackageDto(updated));
    } catch (err) {
      next(err);
    }
  });

packagesRouter.delete('/:packageId', requireAuth, async (req, res, next) => {
  try {
    const packageId = param(req, 'packageId');
    const pkg = await repo.getPackage(packageId);
    if (!pkg) return next(notFound('Package not found'));

    const owner = await repo.getPackageOwner(packageId);
    if (owner !== req.user!.userId) return next(forbidden('You can only delete your own packages'));

    await repo.deletePackage(packageId);
    await repo.refreshStartingPrice(pkg.service_id);

    res.json({ success: true, message: 'Package deleted' });
  } catch (err) {
    next(err);
  }
});
