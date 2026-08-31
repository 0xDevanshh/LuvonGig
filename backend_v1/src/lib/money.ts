/**
 * Money is stored as integer minor units (`amount_minor BIGINT`) plus an ISO
 * 4217 `currency` column. Never floats: `0.1 + 0.2` is not 0.3, and a
 * marketplace that rounds badly loses real money.
 *
 * `pg` returns BIGINT as a string to avoid precision loss, so repositories hand
 * these helpers strings and get bigints back.
 */

/** Currencies with no minor unit (¥, ₩ …) — 1 major unit = 1 minor unit. */
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'XAF', 'XOF']);

export function minorUnitExponent(currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2;
}

/** "12.34" | 12.34 → 1234n for USD. Rejects more precision than the currency has. */
export function toMinor(amount: string | number, currency: string): bigint {
  const exponent = minorUnitExponent(currency);
  const text = typeof amount === 'number' ? amount.toFixed(exponent) : amount.trim();

  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) throw new Error(`Not a valid amount: ${amount}`);

  const [, sign, whole, fraction = ''] = match;
  if (fraction.length > exponent) {
    throw new Error(`${currency} supports ${exponent} decimal places, got "${amount}"`);
  }

  const padded = fraction.padEnd(exponent, '0');
  const magnitude = BigInt(`${whole}${padded}`);
  return sign === '-' ? -magnitude : magnitude;
}

/** 1234n → "12.34" for USD. Use for API output; never for arithmetic. */
export function fromMinor(minor: bigint | string, currency: string): string {
  const value = typeof minor === 'string' ? BigInt(minor) : minor;
  const exponent = minorUnitExponent(currency);
  if (exponent === 0) return value.toString();

  const negative = value < 0n;
  const digits = (negative ? -value : value).toString().padStart(exponent + 1, '0');
  const whole = digits.slice(0, -exponent);
  const fraction = digits.slice(-exponent);
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

export function formatMoney(minor: bigint | string, currency: string, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    Number(fromMinor(minor, currency)),
  );
}

/**
 * Platform fee, currently 5% — the same split the canisters encoded as
 * `platform_fee_e8s` / `escrow_amount_e8s`. Rounds the fee down so the
 * freelancer is never short-changed by a rounding error, and derives the
 * payout by subtraction so the two always sum to the total exactly.
 */
export const PLATFORM_FEE_BASIS_POINTS = 500n;

export function splitPlatformFee(totalMinor: bigint): { fee: bigint; payout: bigint } {
  const fee = (totalMinor * PLATFORM_FEE_BASIS_POINTS) / 10_000n;
  return { fee, payout: totalMinor - fee };
}

// --- Migration only --------------------------------------------------------

/** 1 ICP = 10^8 e8s. Used solely when importing legacy canister rows. */
export const E8S_PER_ICP = 100_000_000n;

/** Legacy `Nat64` e8s → a decimal ICP string, e.g. 500000000n → "5". */
export function e8sToIcpString(e8s: bigint | string): string {
  const value = typeof e8s === 'string' ? BigInt(e8s) : e8s;
  const whole = value / E8S_PER_ICP;
  const fraction = (value % E8S_PER_ICP).toString().padStart(8, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}
