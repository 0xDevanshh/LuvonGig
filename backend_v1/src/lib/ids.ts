import { randomInt } from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SIZE = 21;

/**
 * Mirrors the ID format the Motoko canisters produced (`generateId` in
 * ../backend/canisters/marketplace.mo): a lowercased prefix, an underscore,
 * then 21 base62 characters — so migrated rows and newly created ones are
 * indistinguishable and existing URLs keep resolving.
 *
 * Unlike the canister version, which seeded every character from `Time.now()`
 * and could emit runs of identical characters for calls in the same instant,
 * this draws from a CSPRNG.
 */
export function generateId(prefix: string): string {
  let out = `${prefix.toLowerCase()}_`;
  for (let i = 0; i < SIZE; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

export const newUserId = () => generateId('user');
export const newServiceId = () => generateId('svc');
export const newPackageId = () => generateId('pkg');
export const newBookingId = () => generateId('bk');
export const newStageId = () => generateId('stg');
export const newTransactionId = () => generateId('tx');
export const newReviewId = () => generateId('rv');
export const newTimelineEventId = () => generateId('te');
export const newDisputeId = () => generateId('dsp');

/** Six-digit numeric OTP, matching the existing email verification flow. */
export function generateOtp(): string {
  return String(randomInt(100_000, 1_000_000));
}
