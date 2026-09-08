import type { ExpertBookingRow, ExpertRow } from './repo.js';

export function toExpertDto(e: ExpertRow) {
  const fullName = `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim();
  return {
    id: e.id,
    user_id: e.user_id,
    email: e.email,
    name: fullName || e.email.split('@')[0],
    avatar_url: e.profile_image_url ?? '',
    headline: e.headline,
    bio: e.bio,
    expertise: e.expertise,
    hourly_rate_minor: e.hourly_rate_minor,
    currency: e.currency,
    is_active: e.is_active,
    created_at: e.created_at,
    updated_at: e.updated_at,
  };
}

export function toBookingDto(b: ExpertBookingRow) {
  const expertName = `${b.expert_first_name ?? ''} ${b.expert_last_name ?? ''}`.trim();
  return {
    id: b.id,
    expert_id: b.expert_id,
    client_id: b.client_id,
    scheduled_at: b.scheduled_at,
    duration_minutes: b.duration_minutes,
    amount_minor: b.amount_minor,
    currency: b.currency,
    status: b.status,
    payment_state: b.payment_state,
    notes: b.notes,
    meeting_url: b.meeting_url,
    created_at: b.created_at,
    // Only set on the query that joined for it: client_email on the
    // expert's-own-sales list, expert_name/avatar on the client's purchases list.
    client_email: b.client_email,
    expert_name: expertName || undefined,
    expert_headline: b.expert_headline,
    expert_avatar_url: b.expert_avatar_url ?? undefined,
  };
}
