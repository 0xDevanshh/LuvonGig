import type { Request, RequestHandler } from 'express';
import type { ZodType, ZodTypeDef } from 'zod';
import { badRequest } from '../lib/errors.js';

/**
 * Two generics, not one: `ZodSchema<T>` is `ZodType<T, ZodTypeDef, T>`, which
 * forces the parsed output to equal the raw input. Any schema using `.default()`
 * or `.transform()` has a different input type and would not typecheck.
 */
type Schema<Out, In> = ZodType<Out, ZodTypeDef, In>;

/**
 * Parse and replace `body` / `query` / `params` with the schema's output, so
 * handlers receive typed, coerced, trusted values. A failure throws a ZodError,
 * which the error handler renders as a 400 with per-field messages.
 */
export function validateBody<Out, In>(schema: Schema<Out, In>): RequestHandler {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateQuery<Out, In>(schema: Schema<Out, In>): RequestHandler {
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

export function validateParams<Out, In>(schema: Schema<Out, In>): RequestHandler {
  return (req, _res, next) => {
    try {
      Object.assign(req.params, schema.parse(req.params));
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * A single route parameter as a string.
 *
 * Express 5 types `req.params[name]` as `string | string[]` because a wildcard
 * segment can repeat. Named `:id` segments never do, but the types cannot say
 * so — this narrows it once instead of casting at every call site, and rejects
 * the array case rather than silently stringifying it.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value === 'string' && value.length > 0) return value;
  throw badRequest(`Missing or invalid "${name}" in the request path`);
}
