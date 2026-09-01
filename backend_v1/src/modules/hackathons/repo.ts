import type { PoolClient } from 'pg';
import { query, queryOne } from '../../db/pool.js';

export type HackathonStatus =
  | 'draft' | 'upcoming' | 'ongoing' | 'judging' | 'completed' | 'cancelled';
export type SubmissionStatus =
  | 'draft' | 'submitted' | 'under_review' | 'selected' | 'rejected';

export interface HackathonRow {
  id: string;
  organizer_id: string;
  title: string;
  tagline: string;
  summary: string;
  theme: string;
  location: string;
  banner_url: string | null;
  hero_video_url: string | null;
  prize_pool_minor: string;
  currency: string;
  faq: string[];
  resources: string[];
  min_team_size: number;
  max_team_size: number;
  max_teams_per_category: number;
  submissions_open_at: Date | null;
  submissions_close_at: Date | null;
  start_at: Date | null;
  end_at: Date | null;
  status: HackathonStatus;
  created_at: Date;
  organizer_email: string;
  participant_count: string;
  team_count: string;
  submission_count: string;
}

export interface CategoryRow {
  id: string; hackathon_id: string; name: string; description: string;
  reward_slots: number; judging_criteria: string[];
}

export interface RewardRow {
  id: string; hackathon_id: string; category_id: string | null;
  title: string; description: string; rank: number; perks: string[];
  amount_minor: string; currency: string;
  awarded_submission_id: string | null; awarded_team_id: string | null;
  awarded_by: string | null; awarded_at: Date | null; note: string | null;
}

export interface TeamRow {
  id: string; hackathon_id: string; category_id: string | null;
  name: string; leader_id: string; created_at: Date;
  leader_email: string;
  submission_id: string | null;
}

export interface TeamMemberRow {
  team_id: string; hackathon_id: string; user_id: string;
  accepted: boolean; invited_at: Date; accepted_at: Date | null;
  email: string; display_name: string | null;
}

export interface SubmissionRow {
  id: string; hackathon_id: string; team_id: string; category_id: string | null;
  title: string; summary: string; description: string;
  repo_url: string | null; demo_url: string | null; gallery: string[];
  status: SubmissionStatus; submitted_at: Date | null;
  team_name: string;
}

const HACKATHON_SELECT = `
  SELECT h.*,
         ou.email::text AS organizer_email,
         (SELECT count(*)::text FROM hackathon_registrations r WHERE r.hackathon_id = h.id) AS participant_count,
         (SELECT count(*)::text FROM hackathon_teams t WHERE t.hackathon_id = h.id) AS team_count,
         (SELECT count(*)::text FROM hackathon_submissions s WHERE s.hackathon_id = h.id) AS submission_count
    FROM hackathons h
    JOIN users ou ON ou.id = h.organizer_id`;

export async function listHackathons(f: {
  limit: number; offset: number; status?: HackathonStatus; organizerId?: string;
  includeDrafts?: boolean;
}): Promise<{ rows: HackathonRow[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => `$${params.push(v)}`;

  // A draft is the organiser's private working copy.
  if (!f.includeDrafts) where.push(`h.status <> 'draft'`);
  if (f.status) where.push(`h.status = ${p(f.status)}::hackathon_status`);
  if (f.organizerId) where.push(`h.organizer_id = ${p(f.organizerId)}`);

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const totalRow = await queryOne<{ n: string }>(
    `SELECT count(*)::text AS n FROM hackathons h ${clause}`, params);

  const { rows } = await query<HackathonRow>(
    `${HACKATHON_SELECT} ${clause} ORDER BY h.start_at DESC NULLS LAST, h.created_at DESC
       LIMIT ${p(f.limit)} OFFSET ${p(f.offset)}`,
    params,
  );
  return { rows, total: Number(totalRow?.n ?? 0) };
}

export async function getHackathon(id: string): Promise<HackathonRow | null> {
  return queryOne<HackathonRow>(`${HACKATHON_SELECT} WHERE h.id = $1`, [id]);
}

/** Hackathons a user has registered for. */
export async function listForUser(userId: string): Promise<HackathonRow[]> {
  const { rows } = await query<HackathonRow>(
    `${HACKATHON_SELECT}
      WHERE h.id IN (SELECT hackathon_id FROM hackathon_registrations WHERE user_id = $1)
      ORDER BY h.start_at DESC NULLS LAST`,
    [userId],
  );
  return rows;
}

export async function getCategories(hackathonId: string): Promise<CategoryRow[]> {
  const { rows } = await query<CategoryRow>(
    'SELECT * FROM hackathon_categories WHERE hackathon_id = $1 ORDER BY name', [hackathonId]);
  return rows;
}

export async function getRewards(hackathonId: string): Promise<RewardRow[]> {
  const { rows } = await query<RewardRow>(
    'SELECT * FROM hackathon_rewards WHERE hackathon_id = $1 ORDER BY rank', [hackathonId]);
  return rows;
}

export async function getReward(id: string): Promise<RewardRow | null> {
  return queryOne<RewardRow>('SELECT * FROM hackathon_rewards WHERE id = $1', [id]);
}

const TEAM_SELECT = `
  SELECT t.*, lu.email::text AS leader_email,
         (SELECT s.id FROM hackathon_submissions s WHERE s.team_id = t.id) AS submission_id
    FROM hackathon_teams t
    JOIN users lu ON lu.id = t.leader_id`;

export async function listTeams(hackathonId: string, categoryId?: string): Promise<TeamRow[]> {
  const params: unknown[] = [hackathonId];
  let clause = 'WHERE t.hackathon_id = $1';
  if (categoryId) { params.push(categoryId); clause += ' AND t.category_id = $2'; }

  const { rows } = await query<TeamRow>(`${TEAM_SELECT} ${clause} ORDER BY t.created_at`, params);
  return rows;
}

export async function getTeam(id: string): Promise<TeamRow | null> {
  return queryOne<TeamRow>(`${TEAM_SELECT} WHERE t.id = $1`, [id]);
}

export async function getTeamMembers(teamId: string): Promise<TeamMemberRow[]> {
  const { rows } = await query<TeamMemberRow>(
    `SELECT m.*, u.email::text AS email, p.display_name
       FROM hackathon_team_members m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN hackathon_participants p ON p.user_id = m.user_id
      WHERE m.team_id = $1 ORDER BY m.invited_at`,
    [teamId],
  );
  return rows;
}

/** Pending invitations for a user across all hackathons. */
export async function listInvitations(userId: string): Promise<(TeamMemberRow & { team_name: string; hackathon_title: string })[]> {
  const { rows } = await query<TeamMemberRow & { team_name: string; hackathon_title: string }>(
    `SELECT m.*, u.email::text AS email, p.display_name,
            t.name AS team_name, h.title AS hackathon_title
       FROM hackathon_team_members m
       JOIN hackathon_teams t ON t.id = m.team_id
       JOIN hackathons h ON h.id = m.hackathon_id
       JOIN users u ON u.id = m.user_id
       LEFT JOIN hackathon_participants p ON p.user_id = m.user_id
      WHERE m.user_id = $1 AND m.accepted = false
      ORDER BY m.invited_at DESC`,
    [userId],
  );
  return rows;
}

const SUBMISSION_SELECT = `
  SELECT s.*, t.name AS team_name
    FROM hackathon_submissions s
    JOIN hackathon_teams t ON t.id = s.team_id`;

export async function listSubmissions(hackathonId: string, categoryId?: string): Promise<SubmissionRow[]> {
  const params: unknown[] = [hackathonId];
  let clause = 'WHERE s.hackathon_id = $1';
  if (categoryId) { params.push(categoryId); clause += ' AND s.category_id = $2'; }
  const { rows } = await query<SubmissionRow>(
    `${SUBMISSION_SELECT} ${clause} ORDER BY s.submitted_at DESC NULLS LAST`, params);
  return rows;
}

export async function getSubmission(id: string): Promise<SubmissionRow | null> {
  return queryOne<SubmissionRow>(`${SUBMISSION_SELECT} WHERE s.id = $1`, [id]);
}

export async function getSubmissionByTeam(teamId: string): Promise<SubmissionRow | null> {
  return queryOne<SubmissionRow>(`${SUBMISSION_SELECT} WHERE s.team_id = $1`, [teamId]);
}

export async function isRegistered(hackathonId: string, userId: string): Promise<boolean> {
  const row = await queryOne<{ user_id: string }>(
    'SELECT user_id FROM hackathon_registrations WHERE hackathon_id = $1 AND user_id = $2',
    [hackathonId, userId],
  );
  return row !== null;
}

export async function teamForUser(hackathonId: string, userId: string): Promise<TeamRow | null> {
  return queryOne<TeamRow>(
    `${TEAM_SELECT}
      WHERE t.hackathon_id = $1
        AND t.id IN (SELECT team_id FROM hackathon_team_members WHERE user_id = $2)`,
    [hackathonId, userId],
  );
}

// --- Writes ----------------------------------------------------------------

export interface HackathonInput {
  title: string; tagline: string; summary: string; theme: string; location: string;
  banner_url: string | null; hero_video_url: string | null;
  prize_pool_minor: string; currency: string;
  faq: string[]; resources: string[];
  min_team_size: number; max_team_size: number; max_teams_per_category: number;
  submissions_open_at: string | null; submissions_close_at: string | null;
  start_at: string | null; end_at: string | null;
  status: HackathonStatus;
}

export async function insertHackathon(
  client: PoolClient, id: string, organizerId: string, h: HackathonInput,
): Promise<void> {
  await client.query(
    `INSERT INTO hackathons (id, organizer_id, title, tagline, summary, theme, location,
       banner_url, hero_video_url, prize_pool_minor, currency, faq, resources,
       min_team_size, max_team_size, max_teams_per_category,
       submissions_open_at, submissions_close_at, start_at, end_at, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
             $17::timestamptz,$18::timestamptz,$19::timestamptz,$20::timestamptz,$21::hackathon_status)`,
    [id, organizerId, h.title, h.tagline, h.summary, h.theme, h.location, h.banner_url,
     h.hero_video_url, h.prize_pool_minor, h.currency, h.faq, h.resources,
     h.min_team_size, h.max_team_size, h.max_teams_per_category,
     h.submissions_open_at, h.submissions_close_at, h.start_at, h.end_at, h.status],
  );
}

export async function updateHackathon(
  id: string, organizerId: string, patch: Partial<HackathonInput>,
): Promise<HackathonRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => `$${params.push(v)}`;

  const set = (col: string, v: unknown, cast = '') => {
    if (v !== undefined) sets.push(`${col} = ${p(v)}${cast}`);
  };

  set('title', patch.title); set('tagline', patch.tagline); set('summary', patch.summary);
  set('theme', patch.theme); set('location', patch.location);
  set('banner_url', patch.banner_url); set('hero_video_url', patch.hero_video_url);
  set('prize_pool_minor', patch.prize_pool_minor); set('faq', patch.faq);
  set('resources', patch.resources);
  set('min_team_size', patch.min_team_size); set('max_team_size', patch.max_team_size);
  set('max_teams_per_category', patch.max_teams_per_category);
  set('submissions_open_at', patch.submissions_open_at, '::timestamptz');
  set('submissions_close_at', patch.submissions_close_at, '::timestamptz');
  set('start_at', patch.start_at, '::timestamptz');
  set('end_at', patch.end_at, '::timestamptz');
  set('status', patch.status, '::hackathon_status');

  if (sets.length === 0) return getHackathon(id);

  const updated = await queryOne<{ id: string }>(
    `UPDATE hackathons SET ${sets.join(', ')}
      WHERE id = ${p(id)} AND organizer_id = ${p(organizerId)} RETURNING id`,
    params,
  );
  return updated ? getHackathon(id) : null;
}

export async function deleteHackathon(id: string, organizerId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    'DELETE FROM hackathons WHERE id = $1 AND organizer_id = $2 RETURNING id',
    [id, organizerId],
  );
  return row !== null;
}

export async function insertCategory(
  client: PoolClient, id: string, hackathonId: string,
  c: { name: string; description: string; reward_slots: number; judging_criteria: string[] },
): Promise<void> {
  await client.query(
    `INSERT INTO hackathon_categories (id, hackathon_id, name, description, reward_slots, judging_criteria)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, hackathonId, c.name, c.description, c.reward_slots, c.judging_criteria],
  );
}

export async function insertReward(
  client: PoolClient, id: string, hackathonId: string,
  r: { category_id: string | null; title: string; description: string; rank: number;
       perks: string[]; amount_minor: string; currency: string },
): Promise<void> {
  await client.query(
    `INSERT INTO hackathon_rewards (id, hackathon_id, category_id, title, description, rank,
       perks, amount_minor, currency)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, hackathonId, r.category_id, r.title, r.description, r.rank, r.perks,
     r.amount_minor, r.currency],
  );
}

/**
 * Participants are users now. hackquest keyed them by Principal and kept a
 * separate email, which is why it needed email-to-principal lookup endpoints.
 */
export async function upsertParticipant(
  client: PoolClient, userId: string, displayName: string,
): Promise<void> {
  await client.query(
    `INSERT INTO hackathon_participants (user_id, display_name)
     VALUES ($1,$2)
     ON CONFLICT (user_id) DO UPDATE SET display_name = COALESCE(NULLIF(EXCLUDED.display_name,''), hackathon_participants.display_name)`,
    [userId, displayName],
  );
}

export async function register(
  client: PoolClient, hackathonId: string, userId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO hackathon_registrations (hackathon_id, user_id)
     VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [hackathonId, userId],
  );
}

export async function insertTeam(
  client: PoolClient, id: string, hackathonId: string,
  t: { name: string; categoryId: string | null; leaderId: string },
): Promise<void> {
  await client.query(
    `INSERT INTO hackathon_teams (id, hackathon_id, category_id, name, leader_id)
     VALUES ($1,$2,$3,$4,$5)`,
    [id, hackathonId, t.categoryId, t.name, t.leaderId],
  );
}

export async function addTeamMember(
  client: PoolClient, teamId: string, hackathonId: string, userId: string, accepted: boolean,
): Promise<void> {
  await client.query(
    `INSERT INTO hackathon_team_members (team_id, hackathon_id, user_id, accepted, accepted_at)
     VALUES ($1,$2,$3,$4, CASE WHEN $4 THEN now() ELSE NULL END)
     ON CONFLICT (team_id, user_id) DO NOTHING`,
    [teamId, hackathonId, userId, accepted],
  );
}

export async function respondToInvite(
  teamId: string, userId: string, accept: boolean,
): Promise<boolean> {
  if (!accept) {
    const row = await queryOne<{ team_id: string }>(
      'DELETE FROM hackathon_team_members WHERE team_id = $1 AND user_id = $2 AND accepted = false RETURNING team_id',
      [teamId, userId],
    );
    return row !== null;
  }
  const row = await queryOne<{ team_id: string }>(
    `UPDATE hackathon_team_members SET accepted = true, accepted_at = now()
      WHERE team_id = $1 AND user_id = $2 RETURNING team_id`,
    [teamId, userId],
  );
  return row !== null;
}

export async function setTeamCategory(
  teamId: string, leaderId: string, categoryId: string | null,
): Promise<TeamRow | null> {
  const row = await queryOne<{ id: string }>(
    'UPDATE hackathon_teams SET category_id = $3 WHERE id = $1 AND leader_id = $2 RETURNING id',
    [teamId, leaderId, categoryId],
  );
  return row ? getTeam(teamId) : null;
}

export async function insertSubmission(
  client: PoolClient, id: string,
  s: { hackathonId: string; teamId: string; categoryId: string | null; title: string;
       summary: string; description: string; repoUrl: string | null; demoUrl: string | null;
       gallery: string[]; status: SubmissionStatus },
): Promise<void> {
  await client.query(
    `INSERT INTO hackathon_submissions (id, hackathon_id, team_id, category_id, title, summary,
       description, repo_url, demo_url, gallery, status, submitted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::submission_status,
             CASE WHEN $11 = 'submitted' THEN now() ELSE NULL END)`,
    [id, s.hackathonId, s.teamId, s.categoryId, s.title, s.summary, s.description,
     s.repoUrl, s.demoUrl, s.gallery, s.status],
  );
}

export async function updateSubmission(
  id: string,
  patch: { title?: string; summary?: string; description?: string; repoUrl?: string | null;
           demoUrl?: string | null; gallery?: string[]; status?: SubmissionStatus;
           categoryId?: string | null },
): Promise<SubmissionRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => `$${params.push(v)}`;

  if (patch.title !== undefined) sets.push(`title = ${p(patch.title)}`);
  if (patch.summary !== undefined) sets.push(`summary = ${p(patch.summary)}`);
  if (patch.description !== undefined) sets.push(`description = ${p(patch.description)}`);
  if (patch.repoUrl !== undefined) sets.push(`repo_url = ${p(patch.repoUrl)}`);
  if (patch.demoUrl !== undefined) sets.push(`demo_url = ${p(patch.demoUrl)}`);
  if (patch.gallery !== undefined) sets.push(`gallery = ${p(patch.gallery)}`);
  if (patch.categoryId !== undefined) sets.push(`category_id = ${p(patch.categoryId)}`);
  if (patch.status !== undefined) {
    sets.push(`status = ${p(patch.status)}::submission_status`);
    if (patch.status === 'submitted') sets.push('submitted_at = COALESCE(submitted_at, now())');
  }

  if (sets.length === 0) return getSubmission(id);

  const row = await queryOne<{ id: string }>(
    `UPDATE hackathon_submissions SET ${sets.join(', ')} WHERE id = ${p(id)} RETURNING id`,
    params,
  );
  return row ? getSubmission(id) : null;
}

export async function assignWinner(
  rewardId: string, submissionId: string, teamId: string, awardedBy: string, note: string | null,
): Promise<RewardRow | null> {
  const row = await queryOne<{ id: string }>(
    `UPDATE hackathon_rewards
        SET awarded_submission_id = $2, awarded_team_id = $3,
            awarded_by = $4, awarded_at = now(), note = $5
      WHERE id = $1 RETURNING id`,
    [rewardId, submissionId, teamId, awardedBy, note],
  );
  return row ? getReward(rewardId) : null;
}

export async function listWinners(hackathonId: string): Promise<RewardRow[]> {
  const { rows } = await query<RewardRow>(
    `SELECT * FROM hackathon_rewards
      WHERE hackathon_id = $1 AND awarded_submission_id IS NOT NULL
      ORDER BY rank`,
    [hackathonId],
  );
  return rows;
}

export async function userStats(userId: string): Promise<{
  hackathons_joined: number; teams: number; submissions: number; wins: number;
}> {
  const row = await queryOne<Record<string, string>>(
    `SELECT
       (SELECT count(*)::text FROM hackathon_registrations WHERE user_id = $1) AS hackathons_joined,
       (SELECT count(*)::text FROM hackathon_team_members WHERE user_id = $1 AND accepted) AS teams,
       (SELECT count(*)::text FROM hackathon_submissions s
          WHERE s.team_id IN (SELECT team_id FROM hackathon_team_members WHERE user_id = $1 AND accepted)) AS submissions,
       (SELECT count(*)::text FROM hackathon_rewards r
          WHERE r.awarded_team_id IN (SELECT team_id FROM hackathon_team_members WHERE user_id = $1 AND accepted)) AS wins`,
    [userId],
  );
  return {
    hackathons_joined: Number(row?.hackathons_joined ?? 0),
    teams: Number(row?.teams ?? 0),
    submissions: Number(row?.submissions ?? 0),
    wins: Number(row?.wins ?? 0),
  };
}
