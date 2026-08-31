/**
 * Errors thrown anywhere in a request are caught by the error handler and
 * rendered as `{ success: false, error }` — the envelope the Next.js frontend
 * already checks for (`if (result.success) ... else result.error`).
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, code: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, message, 'BAD_REQUEST', details);

export const unauthorized = (message = 'You must be logged in to do that.') =>
  new AppError(401, message, 'UNAUTHORIZED');

export const forbidden = (message = 'You do not have access to this resource.') =>
  new AppError(403, message, 'FORBIDDEN');

export const notFound = (message = 'Not found.') => new AppError(404, message, 'NOT_FOUND');

export const conflict = (message: string, details?: unknown) =>
  new AppError(409, message, 'CONFLICT', details);

export const serviceUnavailable = (message: string) =>
  new AppError(503, message, 'SERVICE_UNAVAILABLE');
