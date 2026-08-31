/**
 * Hand-written IDL for the job_marketplace canister, lifted from
 * frontend/lib/job-marketplace-agent.ts.
 *
 * NOTE: that source IDL omits `isPaid`, which job_marketplace.mo's Job record
 * does declare. Candid subtyping means the field is silently dropped on decode
 * rather than erroring. It is added back here so the export captures it —
 * without this, every imported job would arrive with is_paid = false.
 */
export const idlFactory = ({ IDL }) => {
  const JobStatus = IDL.Variant({
    OPEN: IDL.Null,
    CLOSED: IDL.Null,
    ASSIGNED: IDL.Text,
    COMPLETED: IDL.Null,
    PAID: IDL.Null,
  });

  const BudgetType = IDL.Variant({ FIXED: IDL.Null, HOURLY: IDL.Null });

  const ProposalStatus = IDL.Variant({
    PENDING: IDL.Null,
    SHORTLISTED: IDL.Null,
    REJECTED: IDL.Null,
    ACCEPTED: IDL.Null,
  });

  const Job = IDL.Record({
    id: IDL.Text,
    clientId: IDL.Text,
    title: IDL.Text,
    description: IDL.Text,
    requiredSkills: IDL.Vec(IDL.Text),
    budgetType: BudgetType,
    budgetAmount: IDL.Nat,
    status: JobStatus,
    createdAt: IDL.Int,
    freelancerId: IDL.Opt(IDL.Text),
    completedAt: IDL.Opt(IDL.Int),
    isPaid: IDL.Bool,
    clientReview: IDL.Opt(IDL.Text),
    clientRating: IDL.Opt(IDL.Nat),
  });

  const Proposal = IDL.Record({
    id: IDL.Text,
    jobId: IDL.Text,
    freelancerId: IDL.Text,
    coverLetter: IDL.Text,
    bidAmount: IDL.Nat,
    estimatedDeliveryDays: IDL.Nat,
    status: ProposalStatus,
    createdAt: IDL.Int,
  });

  const JobFilter = IDL.Record({
    skills: IDL.Opt(IDL.Vec(IDL.Text)),
    minBudget: IDL.Opt(IDL.Nat),
    maxBudget: IDL.Opt(IDL.Nat),
  });

  return IDL.Service({
    getJobs: IDL.Func(
      [IDL.Opt(JobFilter), IDL.Nat, IDL.Nat],
      [IDL.Record({ jobs: IDL.Vec(Job), total: IDL.Nat })],
      ['query'],
    ),
    getJobById: IDL.Func([IDL.Text], [IDL.Opt(Job)], ['query']),
    getProposalsByJob: IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Variant({ ok: IDL.Vec(Proposal), err: IDL.Text })],
      ['query'],
    ),
  });
};
