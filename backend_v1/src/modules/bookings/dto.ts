/**
 * Booking row -> API shape.
 *
 * client_name, freelancer_name and service_title come from joins here. On the
 * canister they were columns on the Booking record, copied in at creation time
 * and stale ever after — renaming your profile did not update bookings anyone
 * had already made.
 *
 * The `*_readable` string fields are gone: timestamps are ISO strings and the
 * frontend formats them.
 */
import type { BookingRow, StageRow, TimelineRow } from './repo.js';

const TITLE_CASE = (s: string) =>
  s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');

export function toBookingDto(b: BookingRow) {
  return {
    booking_id: b.id,
    service_id: b.service_id,
    package_id: b.package_id,
    client_id: b.client_id,
    freelancer_id: b.freelancer_id,

    // Joined, always current.
    client_email: b.client_email,
    client_name: b.client_name || b.client_email,
    freelancer_email: b.freelancer_email,
    freelancer_name: b.freelancer_name || b.freelancer_email,
    service_title: b.service_title,

    title: b.title,
    description: b.description,
    requirements: b.requirements,
    special_instructions: b.special_instructions,

    status: TITLE_CASE(b.status),
    payment_status: TITLE_CASE(b.payment_status),
    isPaid: b.payment_status === 'released' || b.payment_status === 'held_in_escrow',

    currency: b.currency,
    total_minor: b.total_minor,
    base_amount_minor: b.base_amount_minor,
    platform_fee_minor: b.platform_fee_minor,
    discount_minor: b.discount_minor,
    promo_code: b.promo_code,

    // The terms agreed at booking time, not the package's current state.
    package_snapshot: b.package_snapshot,

    delivery_days: b.delivery_days,
    delivery_deadline: b.delivery_deadline,

    created_at: b.created_at,
    updated_at: b.updated_at,
    confirmed_at: b.confirmed_at,
    payment_completed_at: b.payment_completed_at,
    work_started_at: b.work_started_at,
    work_completed_at: b.work_completed_at,
    client_reviewed_at: b.client_reviewed_at,
    freelancer_reviewed_at: b.freelancer_reviewed_at,
    cancelled_at: b.cancelled_at,
  };
}

export function toStageDto(s: StageRow) {
  return {
    stage_id: s.id,
    booking_id: s.booking_id,
    stage_name: s.name,
    name: s.name,
    description: s.description,
    status: TITLE_CASE(s.status),
    amount_minor: s.amount_minor,
    currency: s.currency,
    due_date: s.due_date,
    completed_at: s.completed_at,
    deliverables: s.deliverables,
    client_approved: s.client_approved,
    freelancer_approved: s.freelancer_approved,
    dispute_reason: s.dispute_reason,
    sort_order: s.sort_order,
    created_at: s.created_at,
  };
}

export function toTimelineDto(e: TimelineRow) {
  return {
    event_id: e.id,
    booking_id: e.booking_id,
    event_type: e.event_type,
    actor_user_id: e.actor_user_id,
    description: e.description,
    metadata: e.metadata,
    created_at: e.created_at,
  };
}
