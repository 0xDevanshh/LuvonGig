/**
 * Imports job posts and proposals.
 *
 * The canister encoded the assignee inside the status variant
 * (#ASSIGNED: UserId) *and* carried a separate freelancerId field, so the two
 * could disagree. The schema's job_assignment_consistent check will not accept
 * an assigned job with no freelancer, so both sources are consulted and any
 * disagreement is reported rather than quietly resolved.
 *
 * budgetAmount / bidAmount are bare Nat with no recorded unit — not even e8s
 * is certain. They land in legacy_*_raw with the minor column at 0 and
 * price_needs_review set.
 */
import type { PoolClient } from 'pg';
import { config } from '../config.js';
import { withTransaction, type ImportReport } from './db.js';
import { readExport } from '../lib/output.js';
import { buildUserLookup, resolveUser } from './users.js';
import type { ExportedJob, ExportedProposal } from '../export/jobs.js';

const CURRENCY = config.importCurrency;

export async function importJobs(report: ImportReport): Promise<void> {
  console.log('Importing job posts and proposals...');

  let jobs: ExportedJob[] = [];
  let proposals: ExportedProposal[] = [];
  try {
    jobs = (await readExport<ExportedJob>('jobs')).records;
    proposals = (await readExport<ExportedProposal>('proposals')).records;
  } catch {
    console.log('  no jobs export found — skipping');
    return;
  }
  if (jobs.length === 0) return;

  const lookup = await buildUserLookup();
  const imported = new Set<string>();

  const STATUS: Record<string, string> = {
    open: 'open', closed: 'closed', assigned: 'assigned',
    completed: 'completed', paid: 'paid',
  };

  await withTransaction(async (client: PoolClient) => {
    for (const j of jobs) {
      const clientId = resolveUser(j.clientId, lookup);
      if (!clientId) {
        report.skip('job_posts', j.id, 'client could not be resolved to a user');
        continue;
      }

      // Prefer the explicit field, fall back to the variant payload.
      const fromField = resolveUser(j.freelancerId, lookup);
      const fromStatus = resolveUser(j.assignedToFromStatus, lookup);
      if (fromField && fromStatus && fromField !== fromStatus) {
        report.warn(`job ${j.id}: freelancerId and #ASSIGNED payload disagree — using freelancerId`);
      }
      let freelancerId = fromField ?? fromStatus;

      let status = STATUS[j.status ?? ''] ?? 'open';

      // Reconcile against job_assignment_consistent rather than letting the
      // insert fail.
      if (status !== 'open' && status !== 'closed' && !freelancerId) {
        report.warn(`job ${j.id}: status "${status}" with no resolvable freelancer — imported as closed`);
        status = 'closed';
      }
      if (status === 'open' && freelancerId) {
        report.warn(`job ${j.id}: open but names a freelancer — assignment dropped`);
        freelancerId = null;
      }
      if (freelancerId && freelancerId === clientId) {
        report.warn(`job ${j.id}: client and freelancer are the same user — assignment dropped`);
        freelancerId = null;
        if (status !== 'open') status = 'closed';
      }

      const hasBudget = j.budgetAmountRaw !== null && j.budgetAmountRaw !== '0';
      const rating = j.clientRating === null ? null : Math.min(5, Math.max(1, Number(j.clientRating)));

      await client.query(
        `INSERT INTO job_posts (id, client_id, title, description, required_skills, budget_type,
           budget_minor, currency, status, freelancer_id, is_paid, completed_at, client_review,
           client_rating, price_needs_review, legacy_budget_raw, created_at)
         VALUES ($1,$2,$3,$4,$5,$6::budget_type,0,$7,$8::job_status,$9,$10,$11,$12,$13,$14,$15,
                 COALESCE($16::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, description = EXCLUDED.description,
           required_skills = EXCLUDED.required_skills, status = EXCLUDED.status,
           freelancer_id = EXCLUDED.freelancer_id, is_paid = EXCLUDED.is_paid,
           completed_at = EXCLUDED.completed_at, client_review = EXCLUDED.client_review,
           client_rating = EXCLUDED.client_rating,
           price_needs_review = EXCLUDED.price_needs_review,
           legacy_budget_raw = EXCLUDED.legacy_budget_raw`,
        [j.id, clientId, j.title || 'Untitled job', j.description, j.requiredSkills,
         j.budgetType === 'hourly' ? 'hourly' : 'fixed', CURRENCY, status, freelancerId,
         j.isPaid, j.completedAt, j.clientReview,
         rating !== null && Number.isFinite(rating) ? rating : null,
         hasBudget, j.budgetAmountRaw, j.createdAt],
      );
      imported.add(j.id);
      report.count('job_posts');
    }

    // UNIQUE (job_id, freelancer_id) and one accepted proposal per job.
    const seenBid = new Set<string>();
    const acceptedFor = new Set<string>();

    for (const p of proposals) {
      if (!imported.has(p.jobId)) {
        report.skip('proposals', p.id, 'parent job was not imported');
        continue;
      }
      const freelancerId = resolveUser(p.freelancerId, lookup);
      if (!freelancerId) {
        report.skip('proposals', p.id, 'freelancer could not be resolved to a user');
        continue;
      }

      const pairKey = `${p.jobId}::${freelancerId}`;
      if (seenBid.has(pairKey)) {
        report.skip('proposals', p.id, 'duplicate bid from the same freelancer on one job');
        continue;
      }
      seenBid.add(pairKey);

      let status = p.status ?? 'pending';
      if (status === 'accepted') {
        if (acceptedFor.has(p.jobId)) {
          report.warn(`job ${p.jobId}: more than one accepted proposal — ${p.id} demoted to shortlisted`);
          status = 'shortlisted';
        } else {
          acceptedFor.add(p.jobId);
        }
      }

      const hasBid = p.bidAmountRaw !== null && p.bidAmountRaw !== '0';

      await client.query(
        `INSERT INTO proposals (id, job_id, freelancer_id, cover_letter, bid_minor, currency,
           estimated_delivery_days, status, price_needs_review, legacy_bid_raw, created_at)
         VALUES ($1,$2,$3,$4,0,$5,$6,$7::proposal_status,$8,$9,COALESCE($10::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET
           cover_letter = EXCLUDED.cover_letter, status = EXCLUDED.status,
           estimated_delivery_days = EXCLUDED.estimated_delivery_days,
           price_needs_review = EXCLUDED.price_needs_review,
           legacy_bid_raw = EXCLUDED.legacy_bid_raw`,
        [p.id, p.jobId, freelancerId, p.coverLetter, CURRENCY,
         Math.max(1, p.estimatedDeliveryDays), status, hasBid, p.bidAmountRaw, p.createdAt],
      );
      report.count('proposals');
    }
  });
}
