/**
 * Currency formatting for display.
 *
 * Replaces `formatICP` from lib/ic-marketplace-agent, which rendered e8s as
 * "12.34 ICP". Amounts are now integer minor units plus an ISO 4217 currency,
 * matching the database — the API sends them as strings so nothing is rounded
 * through a float on the way here.
 *
 * Display only. Never do arithmetic on the output of these functions.
 */

/** Currencies with no minor unit (¥, ₩ …): 1 major unit = 1 minor unit. */
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'XAF', 'XOF']);

function minorUnitExponent(currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2;
}

/**
 * 1050 -> "$10.50".
 *
 * Accepts a string because BIGINT arrives from the API as one; a large amount
 * would lose precision if it went through Number on the way.
 */
export function formatMoney(
  minor: string | number | bigint | null | undefined,
  currency = 'USD',
  locale?: string,
): string {
  if (minor === null || minor === undefined || minor === '') return '—';

  const exponent = minorUnitExponent(currency);
  const value = Number(minor) / 10 ** exponent;
  if (!Number.isFinite(value)) return '—';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
    }).format(value);
  } catch {
    // An unknown currency code should still render a number, not blow up a page.
    return `${value.toFixed(exponent)} ${currency.toUpperCase()}`;
  }
}

/** The number without a symbol, for inputs and totals rendered alongside a label. */
export function toMajorUnits(
  minor: string | number | bigint | null | undefined,
  currency = 'USD',
): number {
  if (minor === null || minor === undefined || minor === '') return 0;
  const value = Number(minor) / 10 ** minorUnitExponent(currency);
  return Number.isFinite(value) ? value : 0;
}

/** "10.50" -> 1050, for sending a user-entered price back to the API. */
export function toMinorUnits(major: string | number, currency = 'USD'): number {
  const exponent = minorUnitExponent(currency);
  const value = typeof major === 'number' ? major : Number.parseFloat(major);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10 ** exponent);
}
