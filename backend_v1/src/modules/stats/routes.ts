import { Router } from 'express';
import { queryOne } from '../../db/pool.js';
import { ok } from '../../lib/http.js';

export const statsRouter = Router();

interface StatsRow {
  total_services: string;
  active_services: string;
  total_bookings: string;
  completed_bookings: string;
  total_freelancers: string;
  total_clients: string;
  average_rating: string | null;
}

/**
 * Public marketplace counters.
 *
 * One round trip instead of the canister's sequential scans over every
 * collection. Deliberately excludes money: revenue figures are not public, and
 * amounts are meaningless until Phase 5 anyway.
 */
statsRouter.get('/', async (_req, res, next) => {
  try {
    const row = await queryOne<StatsRow>(`
      SELECT
        (SELECT count(*)::text FROM services WHERE status <> 'deleted')          AS total_services,
        (SELECT count(*)::text FROM services WHERE status = 'active')            AS active_services,
        (SELECT count(*)::text FROM bookings)                                    AS total_bookings,
        (SELECT count(*)::text FROM bookings WHERE status = 'completed')         AS completed_bookings,
        (SELECT count(DISTINCT freelancer_id)::text FROM services)               AS total_freelancers,
        (SELECT count(DISTINCT client_id)::text FROM bookings)                   AS total_clients,
        (SELECT ROUND(AVG(rating), 2)::text FROM reviews)                        AS average_rating
    `);

    ok(res, {
      total_services: Number(row?.total_services ?? 0),
      active_services: Number(row?.active_services ?? 0),
      total_bookings: Number(row?.total_bookings ?? 0),
      completed_bookings: Number(row?.completed_bookings ?? 0),
      total_freelancers: Number(row?.total_freelancers ?? 0),
      total_clients: Number(row?.total_clients ?? 0),
      average_rating: row?.average_rating ? Number(row.average_rating) : 0,
    });
  } catch (err) {
    next(err);
  }
});
