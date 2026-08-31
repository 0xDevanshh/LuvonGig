/**
 * Imports users, profiles, experience and education.
 *
 * Password hashes are copied verbatim. They are argon2id strings produced by
 * frontend/lib/auth.ts — the canister only ever stored them — so they verify
 * unchanged against backend_v1 and nobody is logged out or forced to reset.
 *
 * OTP codes are deliberately NOT imported: they expire in minutes, so carrying
 * them across would only ever move dead rows.
 */
import type { PoolClient } from 'pg';
import { withTransaction, type ImportReport } from './db.js';
import { readExport } from '../lib/output.js';
import type { ExportedUser } from '../export/users.js';

/** Deterministic id for a child row the canister stored without one. */
function childId(prefix: string, userId: string, index: number, given?: string): string {
  return given && given.trim() !== '' ? given : `${prefix}_${userId}_${index}`;
}

export async function importUsers(report: ImportReport): Promise<void> {
  console.log('Importing users...');
  const { records } = await readExport<ExportedUser>('users');

  // CITEXT collapses case, so a case-only duplicate would fail mid-import.
  // Catch it before writing anything.
  const byEmail = new Map<string, string[]>();
  for (const u of records) {
    const k = u.email.trim().toLowerCase();
    byEmail.set(k, [...(byEmail.get(k) ?? []), u.id]);
  }
  const collisions = [...byEmail.entries()].filter(([, ids]) => ids.length > 1);
  if (collisions.length > 0) {
    for (const [email, ids] of collisions) {
      report.warn(`email "${email}" is shared by ${ids.length} canister users (${ids.join(', ')}) — only the first is imported`);
    }
  }

  const takenEmail = new Set<string>();

  await withTransaction(async (client: PoolClient) => {
    for (const u of records) {
      const email = u.email.trim().toLowerCase();
      if (takenEmail.has(email)) {
        report.skip('users', u.id, 'duplicate email (case-insensitive)');
        continue;
      }
      takenEmail.add(email);

      await client.query(
        `INSERT INTO users (id, email, password_hash, is_verified, profile_submitted,
                            last_login_at, created_at, legacy_wallet_principal, legacy_wallet_account_id)
         VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::timestamptz, now()),$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           is_verified = EXCLUDED.is_verified,
           profile_submitted = EXCLUDED.profile_submitted,
           last_login_at = EXCLUDED.last_login_at,
           legacy_wallet_principal = EXCLUDED.legacy_wallet_principal,
           legacy_wallet_account_id = EXCLUDED.legacy_wallet_account_id`,
        [u.id, email, u.passwordHash, u.isVerified, u.profileSubmitted,
         u.lastLoginAt, u.createdAt, u.walletPrincipal, u.walletAccountId],
      );
      report.count('users');

      if (!u.profile) continue;
      const p = u.profile;

      await client.query(
        `INSERT INTO user_profiles (user_id, first_name, last_name, bio, phone, location,
           website, linkedin, github, twitter, profile_image_url, resume_url, skills)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (user_id) DO UPDATE SET
           first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
           bio = EXCLUDED.bio, phone = EXCLUDED.phone, location = EXCLUDED.location,
           website = EXCLUDED.website, linkedin = EXCLUDED.linkedin, github = EXCLUDED.github,
           twitter = EXCLUDED.twitter, profile_image_url = EXCLUDED.profile_image_url,
           resume_url = EXCLUDED.resume_url, skills = EXCLUDED.skills`,
        [u.id, p.firstName, p.lastName, p.bio, p.phone, p.location, p.website,
         p.linkedin, p.github, p.twitter, p.profileImageUrl, p.resumeUrl, p.skills],
      );
      report.count('user_profiles');

      for (const [i, e] of p.experience.entries()) {
        await client.query(
          `INSERT INTO experiences (id, user_id, company, position, start_date, end_date,
             description, is_current, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET
             company = EXCLUDED.company, position = EXCLUDED.position,
             start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date,
             description = EXCLUDED.description, is_current = EXCLUDED.is_current,
             sort_order = EXCLUDED.sort_order`,
          [childId('exp', u.id, i, e.id), u.id, e.company, e.position,
           e.startDate, e.endDate, e.description, e.current, i],
        );
        report.count('experiences');
      }

      for (const [i, e] of p.education.entries()) {
        await client.query(
          `INSERT INTO educations (id, user_id, institution, degree, field, start_date,
             end_date, gpa, description, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (id) DO UPDATE SET
             institution = EXCLUDED.institution, degree = EXCLUDED.degree,
             field = EXCLUDED.field, start_date = EXCLUDED.start_date,
             end_date = EXCLUDED.end_date, gpa = EXCLUDED.gpa,
             description = EXCLUDED.description, sort_order = EXCLUDED.sort_order`,
          [childId('edu', u.id, i, e.id), u.id, e.institution, e.degree, e.field,
           e.startDate, e.endDate, e.gpa, e.description, i],
        );
        report.count('educations');
      }
    }
  });
}

/**
 * email -> user id, for the exports that reference people by email or by a
 * field that may hold either an id or an email.
 */
export async function buildUserLookup(): Promise<{ byId: Set<string>; byEmail: Map<string, string> }> {
  const { rows } = await (await import('./db.js')).query<{ id: string; email: string }>(
    'SELECT id, email::text AS email FROM users',
  );
  return {
    byId: new Set(rows.map((r) => r.id)),
    byEmail: new Map(rows.map((r) => [r.email.toLowerCase(), r.id])),
  };
}

/**
 * The canisters were inconsistent about whether a "freelancer_id" held a user
 * id or an email — marketplace API code reads
 * `additionalData.freelancer_email || service.freelancer_id`, which only makes
 * sense if the field is sometimes one and sometimes the other. Try both.
 */
export function resolveUser(
  value: string | null | undefined,
  lookup: { byId: Set<string>; byEmail: Map<string, string> },
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (lookup.byId.has(trimmed)) return trimmed;
  return lookup.byEmail.get(trimmed.toLowerCase()) ?? null;
}
