/**
 * Exports every user from the `user_v3` canister
 * (../backend/canisters/user.mo — NOT user_v2.mo, which dfx.json does not
 * deploy). A single `getAllUsers()` call returns the lot.
 *
 * Password hashes come across verbatim. They are argon2id strings produced by
 * frontend/lib/auth.ts, not by the canister, so they verify unchanged against
 * the new backend and nobody has to reset a password.
 */
import { config } from '../config.js';
import { getUserActor, withRetry } from '../lib/agent.js';
import { opt, nsToIso, optNsToIso, principalToText, toNumber } from '../lib/candid.js';
import { writeExport } from '../lib/output.js';

export interface ExportedUser {
  id: string;
  email: string;
  passwordHash: string;
  isVerified: boolean;
  profileSubmitted: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
  walletPrincipal: string | null;
  walletAccountId: string | null;
  profile: {
    firstName: string;
    lastName: string;
    bio: string | null;
    phone: string | null;
    location: string | null;
    website: string | null;
    linkedin: string | null;
    github: string | null;
    twitter: string | null;
    profileImageUrl: string | null;
    resumeUrl: string | null;
    skills: string[];
    experience: {
      id: string; company: string; position: string;
      startDate: string; endDate: string | null;
      description: string | null; current: boolean;
    }[];
    education: {
      id: string; institution: string; degree: string; field: string;
      startDate: string; endDate: string | null;
      gpa: string | null; description: string | null;
    }[];
  } | null;
  otp: { code: string; expiresAt: string | null; attempts: number } | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normaliseUser(raw: any): ExportedUser {
  const profileRaw = opt<any>(raw.profile);
  const otpRaw = opt<any>(raw.otpData);

  return {
    id: raw.id,
    email: raw.email,
    passwordHash: raw.passwordHash,
    isVerified: Boolean(raw.isVerified),
    profileSubmitted: Boolean(raw.profileSubmitted),
    createdAt: nsToIso(raw.createdAt),
    lastLoginAt: optNsToIso(raw.lastLoginAt),
    walletPrincipal: principalToText(opt(raw.walletPrincipal)),
    walletAccountId: opt<string>(raw.walletAccountId),
    profile: profileRaw
      ? {
          firstName: profileRaw.firstName ?? '',
          lastName: profileRaw.lastName ?? '',
          bio: opt<string>(profileRaw.bio),
          phone: opt<string>(profileRaw.phone),
          location: opt<string>(profileRaw.location),
          website: opt<string>(profileRaw.website),
          linkedin: opt<string>(profileRaw.linkedin),
          github: opt<string>(profileRaw.github),
          twitter: opt<string>(profileRaw.twitter),
          profileImageUrl: opt<string>(profileRaw.profileImageUrl),
          resumeUrl: opt<string>(profileRaw.resumeUrl),
          skills: profileRaw.skills ?? [],
          experience: (profileRaw.experience ?? []).map((e: any) => ({
            id: e.id,
            company: e.company ?? '',
            position: e.position ?? '',
            startDate: e.startDate ?? '',
            endDate: opt<string>(e.endDate),
            description: opt<string>(e.description),
            current: Boolean(e.current),
          })),
          education: (profileRaw.education ?? []).map((e: any) => ({
            id: e.id,
            institution: e.institution ?? '',
            degree: e.degree ?? '',
            field: e.field ?? '',
            startDate: e.startDate ?? '',
            endDate: opt<string>(e.endDate),
            gpa: opt<string>(e.gpa),
            description: opt<string>(e.description),
          })),
        }
      : null,
    otp: otpRaw
      ? { code: otpRaw.code, expiresAt: nsToIso(otpRaw.expiresAt), attempts: toNumber(otpRaw.attempts) }
      : null,
  };
}

export async function exportUsers(): Promise<ExportedUser[]> {
  console.log('Exporting users...');
  const actor = await getUserActor();
  const raw = await withRetry('getAllUsers', () => actor.getAllUsers());
  const users = (raw as any[]).map(normaliseUser);

  // Case-only email collisions are fatal: the new schema uses CITEXT, so
  // "A@x.com" and "a@x.com" become one row and the second insert fails.
  // Better to know now than mid-import.
  const seen = new Map<string, string[]>();
  for (const u of users) {
    const key = u.email.toLowerCase();
    seen.set(key, [...(seen.get(key) ?? []), u.id]);
  }
  const collisions = [...seen.entries()].filter(([, ids]) => ids.length > 1);
  if (collisions.length > 0) {
    console.warn(`\n  WARNING: ${collisions.length} email(s) differ only by case:`);
    for (const [email, ids] of collisions) console.warn(`    ${email} -> ${ids.join(', ')}`);
    console.warn('  These must be merged by hand before importing.\n');
  }

  const noProfile = users.filter((u) => !u.profile).length;
  console.log(`  ${users.length} user(s); ${noProfile} without a profile`);

  await writeExport('users', {
    canister: 'user_v3', canisterId: config.canisters.user, host: config.icHost,
  }, users);

  return users;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  exportUsers().catch((err) => { console.error(err); process.exit(1); });
}
