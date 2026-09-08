import { query, queryOne } from '../../db/pool.js';

export interface ExpertRow {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  headline: string;
  bio: string;
  expertise: string[];
  hourly_rate_minor: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpertBookingRow {
  id: string;
  expert_id: string;
  client_id: string;
  scheduled_at: string;
  duration_minutes: number;
  amount_minor: string;
  currency: string;
  status: string;
  payment_state: string;
  notes: string | null;
  meeting_url: string | null;
  created_at: string;
  // Present only on the query that joined for it — see the two list*
  // functions below.
  client_email?: string;
  expert_headline?: string;
  expert_first_name?: string | null;
  expert_last_name?: string | null;
  expert_avatar_url?: string | null;
  updated_at: string;
}

/**
 * Joins the same way services/repo.ts's SERVICE_SELECT does: the profile
 * fields come from a join rather than being duplicated onto `experts`.
 */
const EXPERT_SELECT = `
  SELECT e.*, u.email::text AS email, p.first_name, p.last_name, p.profile_image_url
    FROM experts e
    JOIN users u ON u.id = e.user_id
    LEFT JOIN user_profiles p ON p.user_id = e.user_id`;

export async function getExpert(id: string): Promise<ExpertRow | null> {
  return queryOne<ExpertRow>(`${EXPERT_SELECT} WHERE e.id = $1`, [id]);
}

export async function getExpertByUserId(userId: string): Promise<ExpertRow | null> {
  return queryOne<ExpertRow>(`${EXPERT_SELECT} WHERE e.user_id = $1`, [userId]);
}

export interface ListExpertsFilters {
  limit: number;
  offset: number;
}

export async function listExperts(f: ListExpertsFilters): Promise<{ rows: ExpertRow[]; total: number }> {
  const [{ rows }, count] = await Promise.all([
    query<ExpertRow>(
      `${EXPERT_SELECT} WHERE e.is_active ORDER BY e.created_at DESC LIMIT $1 OFFSET $2`,
      [f.limit, f.offset],
    ),
    queryOne<{ n: string }>('SELECT count(*)::text AS n FROM experts WHERE is_active', []),
  ]);
  return { rows, total: Number(count?.n ?? 0) };
}

export interface ExpertInput {
  headline: string;
  bio: string;
  expertise: string[];
  hourly_rate_minor: string;
  currency: string;
}

/**
 * `experts.user_id` is UNIQUE, so registering twice edits the existing
 * profile instead of erroring — there is exactly one expert profile per user.
 */
export async function upsertExpert(id: string, userId: string, input: ExpertInput): Promise<void> {
  await query(
    `INSERT INTO experts (id, user_id, headline, bio, expertise, hourly_rate_minor, currency)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (user_id) DO UPDATE SET
       headline = EXCLUDED.headline,
       bio = EXCLUDED.bio,
       expertise = EXCLUDED.expertise,
       hourly_rate_minor = EXCLUDED.hourly_rate_minor,
       currency = EXCLUDED.currency`,
    [id, userId, input.headline, input.bio, input.expertise, input.hourly_rate_minor, input.currency],
  );
}

/**
 * Column names are interpolated below, which is only safe because `patch`'s
 * type restricts its keys to this fixed, known set — never an arbitrary
 * string from the request body.
 */
export async function updateExpert(
  userId: string,
  patch: Partial<ExpertInput> & { is_active?: boolean },
): Promise<ExpertRow | null> {
  const fields = Object.keys(patch) as (keyof typeof patch)[];
  if (fields.length === 0) return getExpertByUserId(userId);

  const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const values = fields.map((f) => patch[f]);

  await query(`UPDATE experts SET ${sets} WHERE user_id = $1`, [userId, ...values]);
  return getExpertByUserId(userId);
}

/**
 * Two different counterparties depending on which side is asking: an expert
 * viewing their sales wants the client's email; a client viewing their
 * purchases wants the expert's display name. Each query joins only the one
 * it needs.
 */
export async function listBookingsForExpert(
  expertId: string,
  f: { limit: number; offset: number },
): Promise<ExpertBookingRow[]> {
  const { rows } = await query<ExpertBookingRow>(
    `SELECT eb.*, c.email::text AS client_email
       FROM expert_bookings eb
       JOIN users c ON c.id = eb.client_id
      WHERE eb.expert_id = $1
      ORDER BY eb.scheduled_at DESC LIMIT $2 OFFSET $3`,
    [expertId, f.limit, f.offset],
  );
  return rows;
}

export async function listBookingsForClient(
  clientId: string,
  f: { limit: number; offset: number },
): Promise<ExpertBookingRow[]> {
  const { rows } = await query<ExpertBookingRow>(
    `SELECT eb.*, e.headline AS expert_headline,
            p.first_name AS expert_first_name, p.last_name AS expert_last_name,
            p.profile_image_url AS expert_avatar_url
       FROM expert_bookings eb
       JOIN experts e ON e.id = eb.expert_id
       JOIN users u ON u.id = e.user_id
       LEFT JOIN user_profiles p ON p.user_id = e.user_id
      WHERE eb.client_id = $1
      ORDER BY eb.scheduled_at DESC LIMIT $2 OFFSET $3`,
    [clientId, f.limit, f.offset],
  );
  return rows;
}
