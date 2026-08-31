/**
 * Tier inference is the highest-risk pure function in the import: the canister
 * never stored a tier, so every package's tier is *derived*, and a wrong
 * derivation silently reorders a freelancer's pricing table.
 */
import { describe, expect, it } from 'vitest';
import { inferTier, cleanName } from './marketplace.js';

const pkg = (name: string) => ({ name });

describe('inferTier — explicit prefix wins', () => {
  it('reads the "Tier: Title" convention', () => {
    expect(inferTier(pkg('Basic: Landing page'), 2, 3)).toBe('basic');
    expect(inferTier(pkg('Standard: Landing page'), 0, 3)).toBe('standard');
    expect(inferTier(pkg('Premium: Landing page'), 0, 3)).toBe('premium');
  });

  it('folds the legacy "Advanced" label into standard', () => {
    // The schema has three tiers; "Advanced" was an older name for the middle one.
    expect(inferTier(pkg('Advanced: Landing page'), 0, 3)).toBe('standard');
  });

  it('is case-insensitive and tolerates spacing', () => {
    expect(inferTier(pkg('BASIC : Thing'), 2, 3)).toBe('basic');
    expect(inferTier(pkg('premium:Thing'), 0, 3)).toBe('premium');
  });
});

describe('inferTier — keyword fallback', () => {
  it('matches tier words anywhere in the name', () => {
    expect(inferTier(pkg('My Premium Bundle'), 0, 3)).toBe('premium');
    expect(inferTier(pkg('Pro package'), 0, 3)).toBe('premium');
    expect(inferTier(pkg('Starter kit'), 2, 3)).toBe('basic');
    expect(inferTier(pkg('Standard build'), 0, 3)).toBe('standard');
  });
});

describe('inferTier — price-order fallback', () => {
  it('treats a lone package as basic', () => {
    expect(inferTier(pkg('Website'), 0, 1)).toBe('basic');
  });

  it('splits two packages into cheapest and dearest', () => {
    expect(inferTier(pkg('Website'), 0, 2)).toBe('basic');
    expect(inferTier(pkg('Website'), 1, 2)).toBe('premium');
  });

  it('spreads three or more across all tiers', () => {
    expect(inferTier(pkg('Website'), 0, 3)).toBe('basic');
    expect(inferTier(pkg('Website'), 1, 3)).toBe('standard');
    expect(inferTier(pkg('Website'), 2, 3)).toBe('premium');
    // A fourth package collides; the importer reassigns and reports it.
    expect(inferTier(pkg('Website'), 1, 4)).toBe('standard');
    expect(inferTier(pkg('Website'), 3, 4)).toBe('premium');
  });

  it('handles an empty name without throwing', () => {
    expect(inferTier(pkg(''), 0, 1)).toBe('basic');
  });
});

describe('cleanName', () => {
  it('strips the tier prefix', () => {
    expect(cleanName('Basic: Landing page')).toBe('Landing page');
    expect(cleanName('Premium:  Full site')).toBe('Full site');
    expect(cleanName('Advanced: Rebuild')).toBe('Rebuild');
  });

  it('leaves ordinary names alone', () => {
    expect(cleanName('Landing page')).toBe('Landing page');
    expect(cleanName('Design: the sequel')).toBe('Design: the sequel');
    expect(cleanName('')).toBe('');
  });
});
