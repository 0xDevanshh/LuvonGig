import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './modules/health/routes.js';

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

  // Stripe webhooks verify a signature over the exact bytes sent, so that route
  // needs express.raw() and must be mounted before this JSON parser.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(healthRouter);

  // Domain routers mount here as each phase lands:
  //   app.use('/api/auth', authRouter);
  //   app.use('/api/services', servicesRouter);
  //   app.use('/api/bookings', bookingsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
