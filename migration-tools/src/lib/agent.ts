import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { config } from '../config.js';

import { idlFactory as userIdl } from '../idl/user.did.js';
import { idlFactory as marketplaceIdl } from '../idl/marketplace.did.js';
import { idlFactory as hackquestIdl } from '../idl/hackquest.did.js';
import { idlFactory as jobMarketplaceIdl } from '../idl/job_marketplace.did.js';

let agent: HttpAgent | null = null;

async function getAgent(): Promise<HttpAgent> {
  if (agent) return agent;

  agent = new HttpAgent({ host: config.icHost });

  // A local replica uses a self-signed root key that must be fetched. Doing
  // this against mainnet would be a security hole, hence the guard.
  if (config.icHost.includes('localhost') || config.icHost.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }

  return agent;
}

async function actorFor<T>(idl: unknown, canisterId: string): Promise<T> {
  if (!canisterId) throw new Error('Canister ID is not configured');
  const a = await getAgent();
  return Actor.createActor<T>(idl as never, {
    agent: a,
    canisterId: Principal.fromText(canisterId),
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const getUserActor = () => actorFor<any>(userIdl, config.canisters.user);
export const getMarketplaceActor = () => actorFor<any>(marketplaceIdl, config.canisters.marketplace);
export const getHackquestActor = () => actorFor<any>(hackquestIdl, config.canisters.hackquest);
export const getJobMarketplaceActor = () => actorFor<any>(jobMarketplaceIdl, config.canisters.jobMarketplace);

/**
 * Retry wrapper. Canister queries against mainnet fail intermittently on
 * transport errors, and an export that dies two thirds of the way through is
 * worse than a slow one.
 */
export async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i === attempts) break;
      const delayMs = 500 * 2 ** (i - 1);
      console.warn(`  ${label}: attempt ${i} failed, retrying in ${delayMs}ms`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error(`${label} failed after ${attempts} attempts: ${String(lastError)}`);
}
