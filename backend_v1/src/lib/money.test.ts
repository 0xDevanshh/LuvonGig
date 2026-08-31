import { describe, expect, it } from 'vitest';
import { toMinor, fromMinor, splitPlatformFee, e8sToIcpString } from './money.js';

describe('toMinor', () => {
  it('converts decimal strings to minor units', () => {
    expect(toMinor('12.34', 'USD')).toBe(1234n);
    expect(toMinor('0.05', 'USD')).toBe(5n);
    expect(toMinor('100', 'USD')).toBe(10_000n);
  });

  it('handles zero-decimal currencies', () => {
    expect(toMinor('500', 'JPY')).toBe(500n);
  });

  it('rejects more precision than the currency allows', () => {
    expect(() => toMinor('1.234', 'USD')).toThrow(/2 decimal places/);
  });

  it('rejects nonsense', () => {
    expect(() => toMinor('twelve', 'USD')).toThrow();
  });
});

describe('fromMinor', () => {
  it('round-trips', () => {
    expect(fromMinor(toMinor('12.34', 'USD'), 'USD')).toBe('12.34');
    expect(fromMinor(7n, 'USD')).toBe('0.07');
    expect(fromMinor(-1234n, 'USD')).toBe('-12.34');
  });
});

describe('splitPlatformFee', () => {
  it('takes 5% and always sums back to the total', () => {
    const { fee, payout } = splitPlatformFee(10_000n);
    expect(fee).toBe(500n);
    expect(payout).toBe(9_500n);
  });

  it('rounds the fee down so the freelancer is never short', () => {
    const total = 999n;
    const { fee, payout } = splitPlatformFee(total);
    expect(fee).toBe(49n);
    expect(fee + payout).toBe(total);
  });
});

describe('e8sToIcpString', () => {
  it('converts legacy canister amounts', () => {
    expect(e8sToIcpString(500_000_000n)).toBe('5');
    expect(e8sToIcpString(100_000_000n)).toBe('1');
    expect(e8sToIcpString(150_000_000n)).toBe('1.5');
    expect(e8sToIcpString(1n)).toBe('0.00000001');
  });
});
