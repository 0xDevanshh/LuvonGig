/**
 * Exports job posts and proposals from the job_marketplace canister.
 *
 * `getJobs` is paginated, so this walks pages until it has `total`. Proposals
 * have no bulk endpoint: `getProposalsByJob(jobId, requesterId)` is scoped to
 * the requester, and the canister returns #err for anyone who is not the job's
 * client. Each job is therefore queried as its own client.
 *
 * budgetAmount / bidAmount are Nat with no declared unit. The canister never
 * recorded whether they are e8s, whole ICP, or something a client typed —
 * so they are exported raw and flagged for review on import rather than being
 * guessed at.
 */
import { config } from '../config.js';
import { getJobMarketplaceActor, withRetry } from '../lib/agent.js';
import { opt, nsToIso, optNsToIso, variantTag, variantValue, toBigInt, toNumber } from '../lib/candid.js';
import { writeExport } from '../lib/output.js';

export interface ExportedJob {
  id: string;
  clientId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  budgetType: string | null;
  budgetAmountRaw: string | null;
  status: string | null;
  /** #ASSIGNED carries the assignee inside the variant. */
  assignedToFromStatus: string | null;
  freelancerId: string | null;
  isPaid: boolean;
  completedAt: string | null;
  clientReview: string | null;
  clientRating: number | null;
  createdAt: string | null;
}

export interface ExportedProposal {
  id: string;
  jobId: string;
  freelancerId: string;
  coverLetter: string;
  bidAmountRaw: string | null;
  estimatedDeliveryDays: number;
  status: string | null;
  createdAt: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function normaliseJob(raw: any): ExportedJob {
  const statusTag = variantTag(raw.status);
  return {
    id: raw.id,
    clientId: raw.clientId,
    title: raw.title ?? '',
    description: raw.description ?? '',
    requiredSkills: raw.requiredSkills ?? [],
    budgetType: variantTag(raw.budgetType),
    budgetAmountRaw: toBigInt(raw.budgetAmount)?.toString() ?? null,
    status: statusTag,
    assignedToFromStatus: statusTag === 'assigned' ? variantValue<string>(raw.status) : null,
    freelancerId: opt<string>(raw.freelancerId),
    isPaid: Boolean(raw.isPaid),
    completedAt: optNsToIso(raw.completedAt),
    clientReview: opt<string>(raw.clientReview),
    clientRating: (() => {
      const r = opt<unknown>(raw.clientRating);
      return r === null ? null : toNumber(r);
    })(),
    createdAt: nsToIso(raw.createdAt),
  };
}

function normaliseProposal(raw: any): ExportedProposal {
  return {
    id: raw.id,
    jobId: raw.jobId,
    freelancerId: raw.freelancerId,
    coverLetter: raw.coverLetter ?? '',
    bidAmountRaw: toBigInt(raw.bidAmount)?.toString() ?? null,
    estimatedDeliveryDays: toNumber(raw.estimatedDeliveryDays, 1),
    status: variantTag(raw.status),
    createdAt: nsToIso(raw.createdAt),
  };
}

const PAGE_SIZE = 100;

export async function exportJobs(): Promise<void> {
  if (!config.canisters.jobMarketplace) {
    console.log('Skipping jobs: JOB_MARKETPLACE_CANISTER_ID is not set.');
    return;
  }

  const actor = await getJobMarketplaceActor();
  const source = {
    canister: 'job_marketplace',
    canisterId: config.canisters.jobMarketplace,
    host: config.icHost,
  };

  console.log('Exporting job posts...');
  const jobs: ExportedJob[] = [];
  let offset = 0;
  let total = Infinity;

  while (jobs.length < total) {
    const page: any = await withRetry(`getJobs(offset=${offset})`, () =>
      actor.getJobs([], BigInt(PAGE_SIZE), BigInt(offset)),
    );

    total = toNumber(page.total);
    const batch = (page.jobs ?? []) as any[];
    if (batch.length === 0) break; // guards against a total that never resolves

    jobs.push(...batch.map(normaliseJob));
    offset += batch.length;
    console.log(`  ...${jobs.length}/${total}`);
  }

  const byStatus = jobs.reduce<Record<string, number>>((acc, j) => {
    const k = j.status ?? 'unknown';
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`  ${jobs.length} job(s):`, JSON.stringify(byStatus));
  await writeExport('jobs', source, jobs);

  console.log('Exporting proposals (one call per job, as that job\'s client)...');
  const proposals: ExportedProposal[] = [];
  let denied = 0;

  for (const [i, job] of jobs.entries()) {
    const result: any = await withRetry(`getProposalsByJob(${job.id})`, () =>
      actor.getProposalsByJob(job.id, job.clientId),
    ).catch((err) => {
      console.warn(`  skipped ${job.id}: ${String(err).slice(0, 120)}`);
      return { err: 'transport' };
    });

    if (result && 'ok' in result) {
      proposals.push(...(result.ok as any[]).map(normaliseProposal));
    } else {
      denied++;
    }

    if ((i + 1) % 25 === 0) console.log(`  ...${i + 1}/${jobs.length} jobs`);
  }

  console.log(`  ${proposals.length} proposal(s)${denied ? `; ${denied} job(s) returned an error` : ''}`);
  await writeExport('proposals', source, proposals);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  exportJobs().catch((err) => { console.error(err); process.exit(1); });
}
