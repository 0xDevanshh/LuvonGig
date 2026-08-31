/**
 * Fixture tests for the Candid conversions. These are the transforms every
 * exporter depends on, and they are pure functions — so they are tested
 * against synthetic records rather than by calling a canister.
 */
import { describe, expect, it } from 'vitest';
import {
  opt, variantTag, variantValue, toBigInt, toNumber,
  nsToIso, optNsToIso, principalToText, jsonReplacer,
} from './candid.js';

describe('opt', () => {
  it('unwraps the Candid opt encoding', () => {
    expect(opt(['value'])).toBe('value');
    expect(opt([])).toBeNull();
  });

  it('preserves falsy values that are actually present', () => {
    expect(opt([0])).toBe(0);
    expect(opt([''])).toBe('');
    expect(opt([false])).toBe(false);
  });

  it('passes through values that are already unwrapped', () => {
    expect(opt('plain')).toBe('plain');
    expect(opt(null)).toBeNull();
    expect(opt(undefined)).toBeNull();
  });
});

describe('variantTag', () => {
  it('lowercases the tag', () => {
    expect(variantTag({ Active: null })).toBe('active');
    expect(variantTag({ InDispute: null })).toBe('indispute');
    expect(variantTag({ OPEN: null })).toBe('open');
  });

  it('returns null for non-variants', () => {
    expect(variantTag(null)).toBeNull();
    expect(variantTag('Active')).toBeNull();
    expect(variantTag({})).toBeNull();
  });
});

describe('variantValue', () => {
  it('extracts a payload-carrying variant', () => {
    // job_marketplace encodes the assignee inside the status: #ASSIGNED: UserId
    expect(variantValue({ ASSIGNED: 'user_abc' })).toBe('user_abc');
  });

  it('returns null for a payloadless variant', () => {
    expect(variantValue({ OPEN: null })).toBeNull();
  });
});

describe('toBigInt', () => {
  it('accepts the shapes Candid produces', () => {
    expect(toBigInt(123n)).toBe(123n);
    expect(toBigInt(123)).toBe(123n);
    expect(toBigInt('123')).toBe(123n);
  });

  it('returns null rather than throwing on junk', () => {
    expect(toBigInt('abc')).toBeNull();
    expect(toBigInt('')).toBeNull();
    expect(toBigInt(null)).toBeNull();
    expect(toBigInt(undefined)).toBeNull();
  });

  it('keeps precision past Number.MAX_SAFE_INTEGER', () => {
    const big = '9007199254740993'; // 2^53 + 1
    expect(toBigInt(big)?.toString()).toBe(big);
  });
});

describe('toNumber', () => {
  it('falls back when the value is absent', () => {
    expect(toNumber(undefined, 7)).toBe(7);
    expect(toNumber(null, 7)).toBe(7);
    expect(toNumber(0n, 7)).toBe(0);
  });
});

describe('nsToIso', () => {
  it('converts nanoseconds to an ISO string', () => {
    // 2024-01-01T00:00:00Z in nanoseconds
    expect(nsToIso(1_704_067_200_000_000_000n)).toBe('2024-01-01T00:00:00.000Z');
  });

  it('treats the zero sentinel as absent', () => {
    // The canisters used 0 where a real optional was needed.
    expect(nsToIso(0n)).toBeNull();
    expect(nsToIso(-1n)).toBeNull();
  });

  it('rejects values that are not actually nanoseconds', () => {
    // A millisecond value in a nanosecond field lands in 1970 — corrupt, not old.
    expect(nsToIso(1_704_067_200_000n)).toBeNull();
    // A second value lands in 1970 too.
    expect(nsToIso(1_704_067_200n)).toBeNull();
  });

  it('handles null and junk', () => {
    expect(nsToIso(null)).toBeNull();
    expect(nsToIso('not-a-number')).toBeNull();
  });
});

describe('optNsToIso', () => {
  it('composes opt unwrapping with the timestamp conversion', () => {
    expect(optNsToIso([1_704_067_200_000_000_000n])).toBe('2024-01-01T00:00:00.000Z');
    expect(optNsToIso([])).toBeNull();
  });
});

describe('principalToText', () => {
  it('calls toText on a Principal-like object', () => {
    expect(principalToText({ toText: () => 'aaaaa-aa' })).toBe('aaaaa-aa');
  });

  it('passes strings through and handles absence', () => {
    expect(principalToText('aaaaa-aa')).toBe('aaaaa-aa');
    expect(principalToText(null)).toBeNull();
    expect(principalToText(undefined)).toBeNull();
  });
});

describe('jsonReplacer', () => {
  it('makes BigInt serialisable', () => {
    expect(JSON.stringify({ n: 10n }, jsonReplacer)).toBe('{"n":"10"}');
  });

  it('serialises Principal-like objects as text', () => {
    expect(JSON.stringify({ p: { toText: () => 'aaaaa-aa' } }, jsonReplacer)).toBe('{"p":"aaaaa-aa"}');
  });

  it('leaves ordinary values alone', () => {
    expect(JSON.stringify({ a: 1, b: 'x', c: null }, jsonReplacer)).toBe('{"a":1,"b":"x","c":null}');
  });
});
