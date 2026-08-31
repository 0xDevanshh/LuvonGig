import type { Response } from 'express';

/**
 * Response envelope. Deliberately identical to what the existing Next.js API
 * routes return, so pages consuming `{ success, data }` / `{ success, error }`
 * keep working unchanged while routes are moved over one domain at a time.
 */
export interface SuccessBody<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorBody {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>): Response {
  const body: SuccessBody<T> = meta ? { success: true, data, meta } : { success: true, data };
  return res.status(200).json(body);
}

export function created<T>(res: Response, data: T): Response {
  return res.status(201).json({ success: true, data } satisfies SuccessBody<T>);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}
