/**
 * Job and proposal API client.
 *
 * Replaces the direct canister calls these pages used to make
 * (`getJobMarketplaceActor()` then `actor.getJobs(...)`). Those ran in the
 * browser, which meant every page carried the IC agent, hand-built Candid
 * `opt` values as `[x]`/`[]`, and unwrapped BigInt on the way back.
 *
 * Everything here goes through the API, which is where the authorization
 * lives. A page cannot reach past it.
 */

export interface Job {
  id: string;
  clientId: string;
  client_email: string;
  client_name: string;
  title: string;
  description: string;
  requiredSkills: string[];
  budgetType: string;
  budget_minor: string;
  currency: string;
  /** Migrated rows carry a placeholder amount until the client restates it. */
  price_needs_review: boolean;
  status: string;
  freelancerId: string | null;
  freelancer_email: string | null;
  isPaid: boolean;
  completedAt: string | null;
  clientReview: string | null;
  clientRating: number | null;
  proposal_count: number;
  createdAt: string;
}

export interface Proposal {
  id: string;
  jobId: string;
  freelancerId: string;
  freelancer_email: string;
  freelancer_name: string;
  coverLetter: string;
  bid_minor: string;
  currency: string;
  estimatedDeliveryDays: number;
  status: string;
  createdAt: string;
}

export interface JobFilters {
  limit?: number;
  offset?: number;
  clientId?: string;
  freelancerId?: string;
  status?: string;
  skills?: string[];
  minBudget?: string;
  maxBudget?: string;
  search?: string;
}

/** Throws with the API's message so callers can show something useful. */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

  let body: { success?: boolean; data?: T; error?: string; total?: number };
  try {
    body = await res.json();
  } catch {
    throw new Error('The server returned an unreadable response.');
  }

  if (!res.ok || body.success === false) {
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return body as unknown as T;
}

export async function listJobs(f: JobFilters = {}): Promise<{ jobs: Job[]; total: number }> {
  const params = new URLSearchParams();
  if (f.limit !== undefined) params.set('limit', String(f.limit));
  if (f.offset !== undefined) params.set('offset', String(f.offset));
  if (f.clientId) params.set('client_id', f.clientId);
  if (f.freelancerId) params.set('freelancer_id', f.freelancerId);
  if (f.status) params.set('status', f.status);
  // The API takes a comma-separated list, not Candid's [[...]] opt-of-vec.
  if (f.skills?.length) params.set('skills', f.skills.join(','));
  if (f.minBudget) params.set('minBudget', f.minBudget);
  if (f.maxBudget) params.set('maxBudget', f.maxBudget);
  if (f.search) params.set('search', f.search);

  const body = await request<{ data: Job[]; total: number }>(
    `/api/marketplace/job-posts?${params.toString()}`);
  return { jobs: body.data ?? [], total: body.total ?? 0 };
}

/**
 * A job with its proposals.
 *
 * The API decides which proposals you may see: all of them if you posted the
 * job, only your own if you bid on it, none otherwise. The canister returned
 * everything to anyone who asked.
 */
export async function getJob(jobId: string): Promise<Job & { proposals: Proposal[] }> {
  const body = await request<{ data: Job & { proposals: Proposal[] } }>(
    `/api/marketplace/job-posts/${encodeURIComponent(jobId)}`);
  return body.data;
}

export async function createJob(input: {
  title: string;
  description?: string;
  required_skills?: string[];
  budget_type?: 'fixed' | 'hourly';
  budget_minor?: number | string;
  currency?: string;
}): Promise<Job> {
  const body = await request<{ data: Job }>('/api/marketplace/job-posts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.data;
}

export async function updateJob(jobId: string, patch: Partial<{
  title: string; description: string; required_skills: string[];
  budget_type: 'fixed' | 'hourly'; budget_minor: number | string;
}>): Promise<Job> {
  const body = await request<{ data: Job }>(
    `/api/marketplace/job-posts/${encodeURIComponent(jobId)}`,
    { method: 'PUT', body: JSON.stringify(patch) });
  return body.data;
}

export async function withdrawJob(jobId: string): Promise<void> {
  await request(`/api/marketplace/job-posts/${encodeURIComponent(jobId)}`, { method: 'DELETE' });
}

export async function placeBid(jobId: string, input: {
  coverLetter?: string;
  bidAmount: number | string;
  deliveryDays: number;
  currency?: string;
}): Promise<Proposal> {
  const body = await request<{ data: Proposal }>(
    `/api/marketplace/job-posts/${encodeURIComponent(jobId)}/bid`,
    { method: 'POST', body: JSON.stringify(input) });
  return body.data;
}

/** Assigns the job and rejects the other bids, in one transaction server-side. */
export async function acceptProposal(proposalId: string): Promise<Job> {
  const body = await request<{ data: Job }>('/api/job-marketplace/accept-proposal', {
    method: 'POST',
    body: JSON.stringify({ proposalId }),
  });
  return body.data;
}

export async function completeJob(jobId: string): Promise<Job> {
  const body = await request<{ data: Job }>(
    `/api/marketplace/job-posts/${encodeURIComponent(jobId)}/complete`, { method: 'POST' });
  return body.data;
}

export async function reviewJob(jobId: string, rating: number, comment = ''): Promise<Job> {
  const body = await request<{ data: Job }>(
    `/api/marketplace/job-posts/${encodeURIComponent(jobId)}/review`,
    { method: 'POST', body: JSON.stringify({ rating, comment }) });
  return body.data;
}

/**
 * Shortlist or reject a bid. Accepting goes through acceptProposal instead —
 * that assigns the job and rejects the others together.
 */
export async function setProposalStatus(
  jobId: string, proposalId: string, status: 'pending' | 'shortlisted' | 'rejected',
): Promise<Proposal> {
  const body = await request<{ data: Proposal }>(
    `/api/marketplace/job-posts/${encodeURIComponent(jobId)}/proposals/${encodeURIComponent(proposalId)}`,
    { method: 'PUT', body: JSON.stringify({ status }) });
  return body.data;
}
