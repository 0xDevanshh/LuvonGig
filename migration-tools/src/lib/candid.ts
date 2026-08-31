/**
 * Candid -> plain JS conversions.
 *
 * Every quirk handled here is one the frontend currently deals with inline,
 * scattered across dozens of files: optionals arriving as `[value] | []`,
 * `BigInt` that `JSON.stringify` refuses to serialise, variants encoded as
 * single-key objects, and nanosecond timestamps. After the migration none of
 * this exists — which is the point.
 */

/** Candid `opt T` decodes to `[value]` or `[]`. */
export function opt<T>(value: [T] | [] | T | null | undefined): T | null {
  if (Array.isArray(value)) return value.length > 0 ? (value[0] as T) : null;
  return (value ?? null) as T | null;
}

/** Candid variants decode to `{ Active: null }`. Returns the tag, lowercased. */
export function variantTag(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const keys = Object.keys(value as Record<string, unknown>);
  return keys.length > 0 ? (keys[0] as string).toLowerCase() : null;
}

/** Variant payload, for tags that carry one (e.g. `#ASSIGNED: UserId`). */
export function variantValue<T = unknown>(value: unknown): T | null {
  if (!value || typeof value !== 'object') return null;
  const keys = Object.keys(value as Record<string, unknown>);
  if (keys.length === 0) return null;
  const inner = (value as Record<string, unknown>)[keys[0] as string];
  return (inner === null ? null : inner) as T | null;
}

export function toBigInt(value: unknown): bigint | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.trunc(value));
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      return BigInt(value);
    } catch {
      return null;
    }
  }
  return null;
}

export function toNumber(value: unknown, fallback = 0): number {
  const big = toBigInt(value);
  return big === null ? fallback : Number(big);
}

/**
 * Motoko `Time.now()` is nanoseconds since the epoch. Returns an ISO string,
 * or null for the zero/absent sentinels the canisters used in place of a real
 * optional.
 */
export function nsToIso(value: unknown): string | null {
  const ns = toBigInt(value);
  if (ns === null || ns <= 0n) return null;

  const ms = Number(ns / 1_000_000n);
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;

  // Anything outside a plausible range is corrupt rather than merely old:
  // some rows hold millisecond or second values in a nanosecond field.
  const year = date.getUTCFullYear();
  if (year < 2000 || year > 2100) return null;

  return date.toISOString();
}

/** `nsToIso` for an `opt Int`. */
export function optNsToIso(value: unknown): string | null {
  return nsToIso(opt(value as never));
}

/** JSON.stringify replacer: BigInt -> string, Principal -> text. */
export function jsonReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (value && typeof value === 'object' && 'toText' in value && typeof (value as { toText: unknown }).toText === 'function') {
    return (value as { toText: () => string }).toText();
  }
  return value;
}

export function principalToText(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'toText' in value && typeof (value as { toText: unknown }).toText === 'function') {
    return (value as { toText: () => string }).toText();
  }
  return null;
}
