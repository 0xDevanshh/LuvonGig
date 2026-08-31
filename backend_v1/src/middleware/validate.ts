import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Parse and replace `body` / `query` / `params` with the schema's output, so
 * handlers receive typed, coerced, trusted values. A failure throws a ZodError,
 * which the error handler renders as a 400 with per-field messages.
 */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    try {
      // Express 5 makes req.query a getter, so assign onto the parsed object.
      Object.assign(req.query, schema.parse(req.query));
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    try {
      Object.assign(req.params, schema.parse(req.params));
      next();
    } catch (err) {
      next(err);
    }
  };
}
