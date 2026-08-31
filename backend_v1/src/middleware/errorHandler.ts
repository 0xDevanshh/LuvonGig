import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import type { ErrorBody } from '../lib/http.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `No route for ${req.method} ${req.path}`,
    code: 'ROUTE_NOT_FOUND',
  } satisfies ErrorBody);
};

/** Postgres error codes worth translating into something a client can act on. */
function fromPostgres(err: { code?: string; constraint?: string; detail?: string }): AppError | null {
  switch (err.code) {
    case '23505': // unique_violation
      return new AppError(409, 'That record already exists.', 'DUPLICATE', {
        constraint: err.constraint,
      });
    case '23503': // foreign_key_violation
      return new AppError(400, 'Referenced record does not exist.', 'INVALID_REFERENCE', {
        constraint: err.constraint,
      });
    case '23514': // check_violation
      return new AppError(400, 'That value is not allowed.', 'CHECK_FAILED', {
        constraint: err.constraint,
      });
    case '22P02': // invalid_text_representation
      return new AppError(400, 'Malformed value in request.', 'INVALID_INPUT');
    case 'ECONNREFUSED':
    case '57P03': // cannot_connect_now
      return new AppError(503, 'Database is unavailable.', 'DB_UNAVAILABLE');
    default:
      return null;
  }
}

interface BodyParserError {
  status: number;
  type: string;
}

/** body-parser tags its failures with a 4xx `status` and a `type`. */
function isBodyParserError(err: unknown): err is BodyParserError {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: unknown; type?: unknown };
  return (
    typeof e.status === 'number' &&
    e.status >= 400 &&
    e.status < 500 &&
    typeof e.type === 'string' &&
    e.type.startsWith('entity.')
  );
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof ZodError) {
    appError = new AppError(400, 'Invalid request.', 'VALIDATION_FAILED', {
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  } else if (isBodyParserError(err)) {
    // Malformed JSON, a body over the limit, an unsupported charset. These are
    // bad requests, not server faults — body-parser stamps the right status on
    // the error, and without this they would all surface as 500s.
    appError = new AppError(
      err.status,
      err.type === 'entity.too.large'
        ? 'Request body is too large.'
        : 'Request body could not be parsed as JSON.',
      'MALFORMED_BODY',
    );
  } else {
    appError =
      fromPostgres(err as { code?: string }) ??
      new AppError(500, 'Something went wrong.', 'INTERNAL_ERROR');
  }

  const log = appError.statusCode >= 500 ? logger.error.bind(logger) : logger.warn.bind(logger);
  log(
    { err, statusCode: appError.statusCode, code: appError.code, method: req.method, path: req.path },
    appError.message,
  );

  const body: ErrorBody = {
    success: false,
    error: appError.message,
    code: appError.code,
  };
  if (appError.details) body.details = appError.details;
  // Never leak internals in production; keep the stack locally where it helps.
  if (!env.isProduction && appError.statusCode >= 500 && err instanceof Error) {
    body.details = { stack: err.stack };
  }

  res.status(appError.statusCode).json(body);
};
