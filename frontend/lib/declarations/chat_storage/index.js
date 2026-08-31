import { Actor, HttpAgent } from '@dfinity/agent';
// Chat storage canister is disabled - DID file exists but not needed
// import { idlFactory } from './chat_storage.did.js';

// Chat storage canister is not deployed yet - disable for now
export const canisterId = null;

export const createActor = (canisterId, options = {}) => {
  const agent = new HttpAgent({ ...options.agentOptions });

  // Fetch root key for certificate validation during development
  if (process.env.NODE_ENV !== 'production') {
    agent.fetchRootKey().catch(err => {
      console.warn('Unable to fetch root key. Check to ensure that your local replica is running');
      console.error(err);
    });
  }

  // Creates an actor with using the candid interface and the HttpAgent
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions,
  });
};

export const chat_storage = undefined; // Disabled - chat storage canister not deployed
