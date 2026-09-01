import type { PoolClient } from 'pg';
import { query, queryOne } from '../../db/pool.js';

export type JobStatus = 'open' | 'closed' | 'assigned' | 'completed' | 'paid';
export type ProposalStatus = 'pending' | 'shortlisted' | 'rejected' | 'accepted';

export interface JobRow {
  id: string;
  client_id: string;
  title: string;
  description: string;
  required_skills: string[];
  budget_type: 'fixed' | 'hourly';
  budget_minor: string;
  currency: string;
  status: JobStatus;
  freelancer_id: string | null;
  is_paid: boolean;
  completed_at: Date | null;
  client_review: string | null;
  client_rating: string | null;
  price_needs_review: boolean;
  created_at: Date;
  updated_at: Date;
  // Joined
  client_email: string;
  client_name: string;
  freelancer_email: string | null;
  proposal_count: string;
}

export interface ProposalRow {
  id: string;
  job_id: string;
  freelancer_id: string;
  cover_letter: string;
  bid_minor: string;
  currency: string;
  estimated_delivery_days: number;
  status: ProposalStatus;
  price_needs_review: boolean;
  created_at: Date;
  // Joined
  freelancer_email: string;
  freelancer_name: string;
}

const JOB_SELECT = `
  SELECT j.*,
         cu.email::text AS client_email,
         TRIM(COALESCE(cp.first_name,'') || ' ' || COALESCE(cp.last_name,'')) AS client_name,
         fu.email::text AS freelancer_email,
         (SELECT count(*)::text FROM proposals p WHERE p.job_id = j.id) AS proposal_count
    FROM job_posts j
    JOIN users cu ON cu.id = j.client_id
    LEFT JOIN users fu ON fu.id = j.freelancer_id
    LEFT JOIN user_profiles cp ON cp.user_id = j.client_id`;

const PROPOSAL_SELECT = `
  SELECT p.*,
         fu.email::text AS freelancer_email,
         TRIM(COALESCE(fp.first_name,'') || ' ' || COALESCE(fp.last_name,'')) AS freelancer_name
    FROM proposals p
    JOIN users fu ON fu.id = p.freelancer_id
    LEFT JOIN user_profiles fp ON fp.user_id = p.freelancer_id`;

export interface JobFilters {
  limit: number;
  offset: number;
  clientId?: string;
  freelancerId?: string;
  status?: JobStatus;
  skills?: string[];
  minBudget?: string;
  maxBudget?: string;
  search?: string;
  /** Only the owner sees their closed or draft jobs in a listing. */
  openOnly?: boolean;
}

export async function listJobs(f: JobFilters): Promise<{ rows: JobRow[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => `$${params.push(v)}`;

  if (f.openOnly) where.push(`j.status = 'open'`);
  if (f.status) where.push(`j.status = ${p(f.status)}::job_status`);
  if (f.clientId) where.push(`j.client_id = ${p(f.clientId)}`);
  if (f.freelancerId) where.push(`j.freelancer_id = ${p(f.freelancerId)}`);
  // Overlap: a job matches if it wants ANY of the requested skills.
  if (f.skills?.length) where.push(`j.required_skills && ${p(f.skills)}::text[]`);
  if (f.minBudget) where.push(`j.budget_minor >= ${p(f.minBudget)}`);
  if (f.maxBudget) where.push(`j.budget_minor <= ${p(f.maxBudget)}`);
  if (f.search) where.push(`(j.title || ' ' || j.description) ILIKE ${p(`%${f.search}%`)}`);

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const totalRow = await queryOne<{ n: string }>(
    `SELECT count(*)::text AS n FROM job_posts j ${clause}`,
    params,
  );

  const { rows } = await query<JobRow>(
    `${JOB_SELECT} ${clause} ORDER BY j.created_at DESC LIMIT ${p(f.limit)} OFFSET ${p(f.offset)}`,
    params,
  );

  return { rows, total: Number(totalRow?.n ?? 0) };
}

export async function getJob(id: string): Promise<JobRow | null> {
  return queryOne<JobRow>(`${JOB_SELECT} WHERE j.id = $1`, [id]);
}

export async function listProposals(jobId: string): Promise<ProposalRow[]> {
  const { rows } = await query<ProposalRow>(
    `${PROPOSAL_SELECT} WHERE p.job_id = $1 ORDER BY p.created_at DESC`,
    [jobId],
  );
  return rows;
}

export async function getProposal(id: string): Promise<ProposalRow | null> {
  return queryOne<ProposalRow>(`${PROPOSAL_SELECT} WHERE p.id = $1`, [id]);
}

export async function findProposalBy(jobId: string, freelancerId: string) {
  return queryOne<{ id: string }>(
    'SELECT id FROM proposals WHERE job_id = $1 AND freelancer_id = $2',
    [jobId, freelancerId],
  );
}

export interface JobInput {
  title: string;
  description: string;
  required_skills: string[];
  budget_type: 'fixed' | 'hourly';
  budget_minor: string;
  currency: string;
}

export async function insertJob(id: string, clientId: string, input: JobInput): Promise<void> {
  await query(
    `INSERT INTO job_posts (id, client_id, title, description, required_skills, budget_type,
       budget_minor, currency)
     VALUES ($1,$2,$3,$4,$5,$6::budget_type,$7,$8)`,
    [id, clientId, input.title, input.description, input.required_skills, input.budget_type,
     input.budget_minor, input.currency],
  );
}

/** Ownership is in the WHERE clause, never a prior check. */
export async function updateJob(
  id: string,
  ownerId: string,
  patch: Partial<JobInput>,
): Promise<JobRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => `$${params.push(v)}`;

  if (patch.title !== undefined) sets.push(`title = ${p(patch.title)}`);
  if (patch.description !== undefined) sets.push(`description = ${p(patch.description)}`);
  if (patch.required_skills !== undefined) sets.push(`required_skills = ${p(patch.required_skills)}`);
  if (patch.budget_type !== undefined) sets.push(`budget_type = ${p(patch.budget_type)}::budget_type`);
  if (patch.budget_minor !== undefined) {
    sets.push(`budget_minor = ${p(patch.budget_minor)}`, 'price_needs_review = false');
  }

  if (sets.length === 0) return getJob(id);

  const updated = await queryOne<{ id: string }>(
    `UPDATE job_posts SET ${sets.join(', ')}
      WHERE id = ${p(id)} AND client_id = ${p(ownerId)}
      RETURNING id`,
    params,
  );
  return updated ? getJob(id) : null;
}

/**
 * Only an open job with no accepted proposal can be withdrawn. Deleting one
 * that a freelancer has already been assigned would erase their work record.
 */
export async function deleteJob(id: string, ownerId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `DELETE FROM job_posts WHERE id = $1 AND client_id = $2 AND status = 'open' RETURNING id`,
    [id, ownerId],
  );
  return row !== null;
}

export async function setJobStatus(
  client: PoolClient,
  id: string,
  status: JobStatus,
  freelancerId?: string | null,
): Promise<void> {
  await client.query(
    `UPDATE job_posts SET status = $2::job_status
       ${freelancerId !== undefined ? ', freelancer_id = $3' : ''}
       ${status === 'completed' ? ', completed_at = COALESCE(completed_at, now())' : ''}
       ${status === 'paid' ? ', is_paid = true' : ''}
     WHERE id = $1`,
    freelancerId !== undefined ? [id, status, freelancerId] : [id, status],
  );
}

export async function setJobReview(
  id: string,
  rating: number,
  review: string,
): Promise<void> {
  await query('UPDATE job_posts SET client_rating = $2, client_review = $3 WHERE id = $1',
    [id, rating, review]);
}

export interface ProposalInput {
  cover_letter: string;
  bid_minor: string;
  currency: string;
  estimated_delivery_days: number;
}

export async function insertProposal(
  id: string,
  jobId: string,
  freelancerId: string,
  input: ProposalInput,
): Promise<void> {
  await query(
    `INSERT INTO proposals (id, job_id, freelancer_id, cover_letter, bid_minor, currency,
       estimated_delivery_days)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, jobId, freelancerId, input.cover_letter, input.bid_minor, input.currency,
     input.estimated_delivery_days],
  );
}

export async function setProposalStatus(
  client: PoolClient,
  id: string,
  status: ProposalStatus,
): Promise<void> {
  await client.query('UPDATE proposals SET status = $2::proposal_status WHERE id = $1', [id, status]);
}

/** Every other bid is rejected when one is accepted. */
export async function rejectOtherProposals(
  client: PoolClient,
  jobId: string,
  keepId: string,
): Promise<void> {
  await client.query(
    `UPDATE proposals SET status = 'rejected'
      WHERE job_id = $1 AND id <> $2 AND status <> 'rejected'`,
    [jobId, keepId],
  );
}
