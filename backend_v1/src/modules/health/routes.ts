import { Router } from 'express';
import { checkConnection } from '../../db/pool.js';
import { env } from '../../config/env.js';

export const healthRouter = Router();

/** Liveness: is the process up? Must not touch the database. */
healthRouter.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', env: env.NODE_ENV, uptimeSeconds: Math.round(process.uptime()) },
  });
});

/** Readiness: can we actually serve traffic? Point the load balancer at this. */
healthRouter.get('/health/ready', async (_req, res) => {
  const database = await checkConnection();
  res.status(database ? 200 : 503).json({
    success: database,
    data: { database: database ? 'up' : 'down' },
    ...(database ? {} : { error: 'Database is unavailable.', code: 'DB_UNAVAILABLE' }),
  });
});
