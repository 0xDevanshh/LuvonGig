import { Principal } from '@dfinity/principal';
import { createHash } from 'crypto';

/**
 * Generates a deterministic principal from an email address.
 * This is used to identify users without requiring a wallet.
 * Must match the logic used in the canister's registration and lookup.
 */
export function getPrincipalFromEmail(email: string): Principal {
  if (!email) throw new Error('Email is required to generate principal');
  
  // Hash the email to get a deterministic 32-byte value
  // We use lowercase and trim to ensure consistency
  const hash = createHash('sha256').update(email.toLowerCase().trim()).digest();
  
  // Create a self-authenticating principal from the hash
  return Principal.selfAuthenticating(new Uint8Array(hash));
}
