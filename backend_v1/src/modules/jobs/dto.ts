/**
 * Job and proposal row -> API shape.
 *
 * Keeps the field names the pages already read (`id`, `clientId`, camelCase),
 * while adding the joined client/freelancer identity the canister could not
 * produce.
 */
import type { JobRow, ProposalRow } from './repo.js';

export function toJobDto(j: JobRow) {
  return {
    id: j.id,
    clientId: j.client_id,
    client_id: j.client_id,
    client_email: j.client_email,
    client_name: j.client_name || j.client_email,

    title: j.title,
    description: j.description,
    requiredSkills: j.required_skills,
    required_skills: j.required_skills,

    budgetType: j.budget_type.toUpperCase(),
    budget_type: j.budget_type,
    budget_minor: j.budget_minor,
    currency: j.currency,
    // The canister stored a bare Nat with no recorded unit, so a migrated job
    // carries its original number in legacy_budget_raw and is flagged here
    // until the client restates it.
    price_needs_review: j.price_needs_review,

    status: j.status.toUpperCase(),
    freelancerId: j.freelancer_id,
    freelancer_id: j.freelancer_id,
    freelancer_email: j.freelancer_email,

    isPaid: j.is_paid,
    completedAt: j.completed_at,
    clientReview: j.client_review,
    clientRating: j.client_rating === null ? null : Number(j.client_rating),

    proposal_count: Number(j.proposal_count),
    createdAt: j.created_at,
    created_at: j.created_at,
    updated_at: j.updated_at,
  };
}

export function toProposalDto(p: ProposalRow) {
  return {
    id: p.id,
    jobId: p.job_id,
    job_id: p.job_id,
    freelancerId: p.freelancer_id,
    freelancer_id: p.freelancer_id,
    freelancer_email: p.freelancer_email,
    freelancer_name: p.freelancer_name || p.freelancer_email,

    coverLetter: p.cover_letter,
    cover_letter: p.cover_letter,
    bid_minor: p.bid_minor,
    currency: p.currency,
    price_needs_review: p.price_needs_review,

    estimatedDeliveryDays: p.estimated_delivery_days,
    estimated_delivery_days: p.estimated_delivery_days,

    status: p.status.toUpperCase(),
    createdAt: p.created_at,
    created_at: p.created_at,
  };
}
