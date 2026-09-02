import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './modules/health/routes.js';
import { authRouter } from './modules/auth/routes.js';
import { usersRouter } from './modules/users/routes.js';
import { servicesRouter, packagesRouter } from './modules/services/routes.js';
import { bookingsRouter, stagesRouter } from './modules/bookings/routes.js';
import { compatRouter } from './modules/bookings/compat.js';
import { statsRouter } from './modules/stats/routes.js';
import { jobsRouter, acceptProposalRouter } from './modules/jobs/routes.js';
import { hackathonsRouter, teamsRouter, submissionsRouter } from './modules/hackathons/routes.js';
import { paymentsRouter } from './modules/payments/routes.js';
import { purposesRouter } from './modules/payments/purposes.js';
import { chatRouter, chatHealthRouter } from './modules/chat/routes.js';
import { webhookRouter } from './modules/payments/webhook.js';

export function createApp() {
  const app = express();

  // Behind Render/Railway/Fly, so req.ip and secure cookies resolve correctly.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and server-side requests arrive with no Origin header.
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      // Required for the `sid` cookie to travel cross-origin from Next.js.
      credentials: true,
    }),
  );

  // Health checks are polled constantly by the platform; logging them buries
  // everything else.
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false } }));

  // Mounted BEFORE express.json(): Stripe verifies its signature over the exact
  // bytes it sent, and a parsed body is no longer those bytes. Moving this line
  // below the parser silently breaks every webhook.
  app.use('/api/payments/webhook', webhookRouter);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(healthRouter);

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/packages', packagesRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/stages', stagesRouter);
  app.use('/api/stats', statsRouter);
  // Collection-level shapes the old routes used (booking id in query or body).
  // Deleted in Phase 7 once callers move to the path-based routes.
  app.use('/api/compat', compatRouter);

  app.use('/api/job-posts', jobsRouter);
  app.use('/api/accept-proposal', acceptProposalRouter);
  app.use('/api/hackathons', hackathonsRouter);
  app.use('/api/teams', teamsRouter);
  app.use('/api/submissions', submissionsRouter);

  app.use('/api/payments', paymentsRouter);
  app.use('/api/payments', purposesRouter);
  app.use('/api/chat/health', chatHealthRouter);
  app.use('/api/chat', chatRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
