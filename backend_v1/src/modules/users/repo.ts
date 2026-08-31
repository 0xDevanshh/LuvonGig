import { query, queryOne, withTransaction } from '../../db/pool.js';

export interface ProfileRow {
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  twitter: string | null;
  profile_image_url: string | null;
  resume_url: string | null;
  skills: string[];
}

export interface ExperienceRow {
  id: string; company: string; position: string;
  start_date: string; end_date: string | null;
  description: string | null; is_current: boolean; sort_order: number;
}

export interface EducationRow {
  id: string; institution: string; degree: string; field: string;
  start_date: string; end_date: string | null;
  gpa: string | null; description: string | null; sort_order: number;
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  return queryOne<ProfileRow>('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
}

export async function getExperiences(userId: string): Promise<ExperienceRow[]> {
  const { rows } = await query<ExperienceRow>(
    `SELECT id, company, position, start_date, end_date, description, is_current, sort_order
       FROM experiences WHERE user_id = $1 ORDER BY sort_order, created_at`,
    [userId],
  );
  return rows;
}

export async function getEducations(userId: string): Promise<EducationRow[]> {
  const { rows } = await query<EducationRow>(
    `SELECT id, institution, degree, field, start_date, end_date, gpa, description, sort_order
       FROM educations WHERE user_id = $1 ORDER BY sort_order, created_at`,
    [userId],
  );
  return rows;
}

type ProfilePatch = Partial<Omit<ProfileRow, 'user_id'>>;

/**
 * Upserts only the columns present in `patch`. COALESCE against the existing
 * row means an update that omits a field leaves it alone rather than nulling
 * it — the old profile routes each sent a different subset.
 */
export async function upsertProfile(userId: string, patch: ProfilePatch): Promise<ProfileRow> {
  const row = await queryOne<ProfileRow>(
    `INSERT INTO user_profiles (user_id, first_name, last_name, bio, phone, location,
       website, linkedin, github, twitter, profile_image_url, resume_url, skills)
     -- Every parameter is cast explicitly: Postgres infers an untyped
     -- placeholder inside COALESCE from the *other* branch, which makes
     -- COALESCE($13, '{}') a text expression assigned to a text[] column.
     VALUES ($1, COALESCE($2::text,''), COALESCE($3::text,''), $4::text, $5::text, $6::text,
             $7::text, $8::text, $9::text, $10::text, $11::text, $12::text,
             COALESCE($13::text[], '{}'::text[]))
     ON CONFLICT (user_id) DO UPDATE SET
       first_name        = COALESCE($2::text,  user_profiles.first_name),
       last_name         = COALESCE($3::text,  user_profiles.last_name),
       bio               = COALESCE($4::text,  user_profiles.bio),
       phone             = COALESCE($5::text,  user_profiles.phone),
       location          = COALESCE($6::text,  user_profiles.location),
       website           = COALESCE($7::text,  user_profiles.website),
       linkedin          = COALESCE($8::text,  user_profiles.linkedin),
       github            = COALESCE($9::text,  user_profiles.github),
       twitter           = COALESCE($10::text, user_profiles.twitter),
       profile_image_url = COALESCE($11::text, user_profiles.profile_image_url),
       resume_url        = COALESCE($12::text, user_profiles.resume_url),
       skills            = COALESCE($13::text[], user_profiles.skills)
     RETURNING *`,
    [
      userId, patch.first_name ?? null, patch.last_name ?? null, patch.bio ?? null,
      patch.phone ?? null, patch.location ?? null, patch.website ?? null,
      patch.linkedin ?? null, patch.github ?? null, patch.twitter ?? null,
      patch.profile_image_url ?? null, patch.resume_url ?? null, patch.skills ?? null,
    ],
  );
  return row!;
}

export async function markProfileSubmitted(userId: string, submitted: boolean): Promise<void> {
  await query('UPDATE users SET profile_submitted = $1 WHERE id = $2', [submitted, userId]);
}

/** Replaces the whole list in one transaction — the UI edits it as a set. */
export async function replaceExperiences(
  userId: string,
  items: Omit<ExperienceRow, 'sort_order'>[],
): Promise<void> {
  await withTransaction(async (client) => {
    await client.query('DELETE FROM experiences WHERE user_id = $1', [userId]);
    for (const [i, e] of items.entries()) {
      await client.query(
        `INSERT INTO experiences (id, user_id, company, position, start_date, end_date,
           description, is_current, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [e.id, userId, e.company, e.position, e.start_date, e.end_date,
         e.description, e.is_current, i],
      );
    }
  });
}

export async function replaceEducations(
  userId: string,
  items: Omit<EducationRow, 'sort_order'>[],
): Promise<void> {
  await withTransaction(async (client) => {
    await client.query('DELETE FROM educations WHERE user_id = $1', [userId]);
    for (const [i, e] of items.entries()) {
      await client.query(
        `INSERT INTO educations (id, user_id, institution, degree, field, start_date,
           end_date, gpa, description, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [e.id, userId, e.institution, e.degree, e.field, e.start_date,
         e.end_date, e.gpa, e.description, i],
      );
    }
  });
}
