/**
 * Job post and proposal routes.
 *
 * The canister encoded the assignee inside the status variant
 * (#ASSIGNED: UserId), so "is this open?" and "who has it?" were the same
 * field and could not disagree with themselves — but also could not be queried
 * separately. Here they are `status` and `freelancer_id`, held consistent by
 * the job_assignment_consistent check constraint.
 *
 * Identity always comes from the session. The old routes took freelancerId,
 * userId and email from the request body, which meant anyone could bid or post
 * as anyone else.
 */
import { Router } from 'express';
import { z } from 'zod';
import { withTransaction } from '../../db/pool.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { ok } from '../../lib/http.js';
import { generateId } from '../../lib/ids.js';
import { attachUser, requireAuth } from '../../middleware/requireAuth.js';
import { param, validateBody } from '../../middleware/validate.js';
import * as repo from './repo.js';
import { toJobDto, toProposalDto } from './dto.js';

export const jobsRouter = Router();

const money = z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
  .transform((v) => String(v));

const listQuery = z.object({
  limit: z.coerce.number().int().positive().max(100).default(10),
  offset: z.coerce.number().int().nonnegative().default(0),
  client_id: z.string().optional(),
  freelancer_id: z.string().optional(),
  status: z.enum(['open', 'closed', 'assigned', 'completed', 'paid']).optional(),
  skills: z.string().optional(),
  minBudget: z.string().regex(/^\d+$/).optional(),
  maxBudget: z.string().regex(/^\d+$/).optional(),
  search: z.string().optional(),
});

jobsRouter.get('/', attachUser, async (req, res, next) => {
  try {
    const q = listQuery.parse(req.query);

    // A client listing their own jobs sees every status; the public board
    // shows only what is open.
    const ownListing = Boolean(req.user) && q.client_id === req.user!.userId;

    const { rows, total } = await repo.listJobs({
      limit: q.limit,
      offset: q.offset,
      clientId: q.client_id,
      freelancerId: q.freelancer_id,
      status: q.status,
      skills: q.skills ? q.skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      minBudget: q.minBudget,
      maxBudget: q.maxBudget,
      search: q.search,
      openOnly: !ownListing && !q.freelancer_id && !q.status,
    });

    res.json({ success: true, data: rows.map(toJobDto), total });
  } catch (err) {
    next(err);
  }
});

const jobInput = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(20000).default(''),
  required_skills: z.array(z.string().max(60)).max(30).default([]),
  budget_type: z.enum(['fixed', 'hourly']).default('fixed'),
  budget_minor: money.default('0'),
  currency: z.string().length(3).default('USD'),
});

/**
 * Accepts the old `{ userId, jobData }` envelope as well as a flat body.
 * `userId` is ignored — the poster is whoever holds the session.
 */
function unwrapJobBody(body: unknown): unknown {
  if (body && typeof body === 'object' && 'jobData' in body) {
    const { jobData } = body as { jobData: Record<string, unknown> };
    return {
      title: jobData.title,
      description: jobData.description,
      // The old client sent `skills` and a plain `budget` number.
      required_skills: jobData.skills ?? jobData.required_skills ?? [],
      budget_type: jobData.budget_type ?? 'fixed',
      budget_minor: jobData.budget ?? jobData.budget_minor ?? 0,
      currency: jobData.currency ?? 'USD',
    };
  }
  return body;
}

jobsRouter.post('/', requireAuth, (req, _res, nextFn) => {
  req.body = unwrapJobBody(req.body);
  nextFn();
}, validateBody(jobInput), async (req, res, next) => {
  try {
    const id = generateId('job');
    await repo.insertJob(id, req.user!.userId, req.body);
    res.status(201).json({ success: true, data: toJobDto((await repo.getJob(id))!) });
  } catch (err) {
    next(err);
  }
});

jobsRouter.get('/:jobId', attachUser, async (req, res, next) => {
  try {
    const job = await repo.getJob(param(req, 'jobId'));
    if (!job) return next(notFound('Job not found'));

    // Bids are commercially sensitive: only the client who posted the job sees
    // them all. A freelancer sees only their own.
    const isOwner = req.user?.userId === job.client_id;
    const proposals = await repo.listProposals(job.id);
    const visible = isOwner
      ? proposals
      : proposals.filter((p) => p.freelancer_id === req.user?.userId);

    ok(res, { ...toJobDto(job), proposals: visible.map(toProposalDto) });
  } catch (err) {
    next(err);
  }
});

jobsRouter.put('/:jobId', requireAuth, validateBody(jobInput.partial()), async (req, res, next) => {
  try {
    const jobId = param(req, 'jobId');
    const job = await repo.getJob(jobId);
    if (!job) return next(notFound('Job not found'));
    if (job.client_id !== req.user!.userId) {
      return next(forbidden('You can only edit your own job posts'));
    }
    if (job.status !== 'open') {
      return next(conflict('A job cannot be edited once it has been assigned'));
    }

    const updated = await repo.updateJob(jobId, req.user!.userId, req.body);
    if (!updated) return next(notFound('Job not found'));
    ok(res, toJobDto(updated));
  } catch (err) {
    next(err);
  }
});

jobsRouter.delete('/:jobId', requireAuth, async (req, res, next) => {
  try {
    const deleted = await repo.deleteJob(param(req, 'jobId'), req.user!.userId);
    if (!deleted) {
      // Missing, someone else's, or already assigned — deliberately one answer.
      return next(notFound('Job not found, or it can no longer be withdrawn'));
    }
    res.json({ success: true, message: 'Job post withdrawn' });
  } catch (err) {
    next(err);
  }
});

const bidInput = z.object({
  coverLetter: z.string().max(10000).default(''),
  cover_letter: z.string().max(10000).optional(),
  bidAmount: money.optional(),
  bid_minor: money.optional(),
  deliveryDays: z.coerce.number().int().positive().optional(),
  estimated_delivery_days: z.coerce.number().int().positive().optional(),
  currency: z.string().length(3).default('USD'),
}).passthrough();

jobsRouter.post('/:jobId/bid', requireAuth, validateBody(bidInput), async (req, res, next) => {
  try {
    const jobId = param(req, 'jobId');
    const job = await repo.getJob(jobId);
    if (!job) return next(notFound('Job not found'));

    if (job.status !== 'open') return next(conflict('This job is no longer accepting bids'));
    if (job.client_id === req.user!.userId) {
      return next(badRequest('You cannot bid on your own job post'));
    }
    // UNIQUE (job_id, freelancer_id) backs this; the canister allowed duplicates.
    if (await repo.findProposalBy(jobId, req.user!.userId)) {
      return next(conflict('You have already submitted a proposal for this job'));
    }

    const bid = req.body.bid_minor ?? req.body.bidAmount;
    const days = req.body.estimated_delivery_days ?? req.body.deliveryDays;
    if (bid === undefined) return next(badRequest('A bid amount is required'));
    if (days === undefined) return next(badRequest('An estimated delivery time is required'));

    const id = generateId('prp');
    await repo.insertProposal(id, jobId, req.user!.userId, {
      cover_letter: req.body.cover_letter ?? req.body.coverLetter,
      bid_minor: bid,
      currency: req.body.currency,
      estimated_delivery_days: days,
    });

    res.status(201).json({ success: true, data: toProposalDto((await repo.getProposal(id))!) });
  } catch (err) {
    next(err);
  }
});

/**
 * Accepting a proposal assigns the job. Four writes, one transaction: the
 * canister did them as separate calls, so a failure part-way left a job
 * assigned with its other bids still pending, or an accepted bid on an open job.
 */
export async function acceptProposal(
  proposalId: string,
  actingUserId: string,
): Promise<repo.JobRow> {
  const proposal = await repo.getProposal(proposalId);
  if (!proposal) throw notFound('Proposal not found');

  const job = await repo.getJob(proposal.job_id);
  if (!job) throw notFound('Job not found');
  if (job.client_id !== actingUserId) {
    throw forbidden('Only the client who posted this job can accept a proposal');
  }
  if (job.status !== 'open') throw conflict('This job has already been assigned');

  await withTransaction(async (client) => {
    await repo.setProposalStatus(client, proposalId, 'accepted');
    await repo.rejectOtherProposals(client, job.id, proposalId);
    await repo.setJobStatus(client, job.id, 'assigned', proposal.freelancer_id);
  });

  return (await repo.getJob(job.id))!;
}

jobsRouter.post('/:jobId/accept-proposal', requireAuth,
  validateBody(z.object({ proposalId: z.string().min(1) })),
  async (req, res, next) => {
    try {
      ok(res, toJobDto(await acceptProposal(req.body.proposalId, req.user!.userId)));
    } catch (err) {
      next(err);
    }
  });

jobsRouter.post('/:jobId/complete', requireAuth, async (req, res, next) => {
  try {
    const job = await repo.getJob(param(req, 'jobId'));
    if (!job) return next(notFound('Job not found'));
    // Only the client confirms the work is done — a freelancer marking their
    // own job complete would trigger payment.
    if (job.client_id !== req.user!.userId) {
      return next(forbidden('Only the client can mark a job complete'));
    }
    if (job.status !== 'assigned') {
      return next(conflict('Only an assigned job can be completed'));
    }

    await withTransaction((client) => repo.setJobStatus(client, job.id, 'completed'));
    ok(res, toJobDto((await repo.getJob(job.id))!));
  } catch (err) {
    next(err);
  }
});

jobsRouter.post('/:jobId/paid', requireAuth, async (req, res, next) => {
  try {
    const job = await repo.getJob(param(req, 'jobId'));
    if (!job) return next(notFound('Job not found'));
    if (job.client_id !== req.user!.userId) {
      return next(forbidden('Only the client can record payment'));
    }
    if (job.status !== 'completed') {
      return next(conflict('Only a completed job can be marked paid'));
    }

    // Interim, as in Phase 3: a verified provider webhook drives this in Phase 5.
    await withTransaction((client) => repo.setJobStatus(client, job.id, 'paid'));
    ok(res, toJobDto((await repo.getJob(job.id))!));
  } catch (err) {
    next(err);
  }
});

jobsRouter.post('/:jobId/review', requireAuth,
  validateBody(z.object({
    rating: z.number().min(1).max(5),
    review: z.string().max(4000).default(''),
    comment: z.string().max(4000).optional(),
  })),
  async (req, res, next) => {
    try {
      const job = await repo.getJob(param(req, 'jobId'));
      if (!job) return next(notFound('Job not found'));
      if (job.client_id !== req.user!.userId) {
        return next(forbidden('Only the client can review this job'));
      }
      if (job.status !== 'completed' && job.status !== 'paid') {
        return next(conflict('You can only review a completed job'));
      }
      if (job.client_rating !== null) {
        return next(conflict('You have already reviewed this job'));
      }

      await repo.setJobReview(job.id, req.body.rating, req.body.comment ?? req.body.review);
      ok(res, toJobDto((await repo.getJob(job.id))!));
    } catch (err) {
      next(err);
    }
  });

/** Standalone /api/job-marketplace/accept-proposal, which carries no job id. */
export const acceptProposalRouter = Router();
acceptProposalRouter.post('/', requireAuth,
  validateBody(z.object({ proposalId: z.string().min(1) }).passthrough()),
  async (req, res, next) => {
    try {
      ok(res, toJobDto(await acceptProposal(req.body.proposalId, req.user!.userId)));
    } catch (err) {
      next(err);
    }
  });
