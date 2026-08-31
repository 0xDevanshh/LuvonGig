import argon2 from 'argon2';

/**
 * Identical parameters to frontend/lib/auth.ts, so hashes migrated from the
 * canister verify unchanged and hashes written here stay readable by the old
 * code for as long as both run side by side.
 */
const OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  timeCost: 3,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, OPTIONS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // A malformed or non-argon2 hash is a failed login, not a 500.
    return false;
  }
}
