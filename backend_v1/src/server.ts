import { createApp } from './app.js';
import { env } from './config/env.js';
import { closePool, checkConnection } from './db/pool.js';
import { logger } from './lib/logger.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API listening');
});

// Warn rather than exit: the process should stay up and keep serving /health so
// an orchestrator can distinguish "database is down" from "the app crashed".
void checkConnection().then((ok) => {
  if (!ok) logger.warn('Database unreachable at startup — check DATABASE_URL');
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down');

  // Force-exit if in-flight requests do not drain in time.
  const timer = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10_000);
  timer.unref();

  server.close(async () => {
    await closePool();
    logger.info('Shutdown complete');
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — exiting');
  process.exit(1);
});
