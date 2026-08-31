import type { PoolClient } from 'pg';
import { query, queryOne } from '../../db/pool.js';
import { newTimelineEventId } from '../../lib/ids.js';

export type BookingStatus = 'pending' | 'active' | 'in_dispute' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'held_in_escrow' | 'released' | 'refunded' | 'disputed';

export interface BookingRow {
  id: string;
  service_id: string;
  package_id: string;
  client_id: string;
  freelancer_id: string;
  title: string;
  description: string;
  requirements: string[];
  special_instructions: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  currency: string;
  total_minor: string;
  base_amount_minor: string;
  platform_fee_minor: string;
  discount_minor: string;
  promo_code: string | null;
  package_snapshot: Record<string, unknown>;
  delivery_days: number;
  delivery_deadline: Date | null;
  confirmed_at: Date | null;
  payment_completed_at: Date | null;
  work_started_at: Date | null;
  work_completed_at: Date | null;
  client_reviewed_at: Date | null;
  freelancer_reviewed_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // Joined
  client_email: string;
  client_name: string;
  freelancer_email: string;
  freelancer_name: string;
  service_title: string;
}

/**
 * The joins that replace the canister's denormalised fields. Booking carried
 * client_name, freelancer_name, package_title, package_features and a parallel
 * set of *_readable date strings purely because actors cannot join — and they
 * went stale the moment anyone edited a profile.
 */
const BOOKING_SELECT = `
  SELECT b.*,
         cu.email::text AS client_email,
         TRIM(COALESCE(cp.first_name,'') || ' ' || COALESCE(cp.last_name,'')) AS client_name,
         fu.email::text AS freelancer_email,
         TRIM(COALESCE(fp.first_name,'') || ' ' || COALESCE(fp.last_name,'')) AS freelancer_name,
         s.title AS service_title
    FROM bookings b
    JOIN users cu ON cu.id = b.client_id
    JOIN users fu ON fu.id = b.freelancer_id
    JOIN services s ON s.id = b.service_id
    LEFT JOIN user_profiles cp ON cp.user_id = b.client_id
    LEFT JOIN user_profiles fp ON fp.user_id = b.freelancer_id`;

export async function getBooking(id: string): Promise<BookingRow | null> {
  return queryOne<BookingRow>(`${BOOKING_SELECT} WHERE b.id = $1`, [id]);
}

export interface BookingFilters {
  userId: string;
  role: 'client' | 'freelancer' | 'any';
  status?: BookingStatus;
  limit: number;
  offset: number;
}

export async function listBookings(
  f: BookingFilters,
): Promise<{ rows: BookingRow[]; total: number }> {
  const params: unknown[] = [];
  const p = (v: unknown) => `$${params.push(v)}`;

  const user = p(f.userId);
  const roleClause =
    f.role === 'client' ? `b.client_id = ${user}`
    : f.role === 'freelancer' ? `b.freelancer_id = ${user}`
    // Never an unscoped listing: a booking is only ever visible to its parties.
    : `(b.client_id = ${user} OR b.freelancer_id = ${user})`;

  const where = [roleClause];
  if (f.status) where.push(`b.status = ${p(f.status)}::booking_status`);
  const clause = `WHERE ${where.join(' AND ')}`;

  const totalRow = await queryOne<{ n: string }>(
    `SELECT count(*)::text AS n FROM bookings b ${clause}`,
    params,
  );

  const { rows } = await query<BookingRow>(
    `${BOOKING_SELECT} ${clause} ORDER BY b.created_at DESC LIMIT ${p(f.limit)} OFFSET ${p(f.offset)}`,
    params,
  );

  return { rows, total: Number(totalRow?.n ?? 0) };
}

export interface TimelineRow {
  id: string;
  booking_id: string;
  event_type: string;
  actor_user_id: string | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export async function getTimeline(bookingId: string): Promise<TimelineRow[]> {
  const { rows } = await query<TimelineRow>(
    'SELECT * FROM booking_timeline_events WHERE booking_id = $1 ORDER BY created_at ASC',
    [bookingId],
  );
  return rows;
}

/**
 * Appends a timeline event. Takes a client so it can share the caller's
 * transaction — an event that records something which then rolled back is
 * worse than no event.
 */
export async function addTimelineEvent(
  client: PoolClient,
  bookingId: string,
  eventType: string,
  actorUserId: string | null,
  description: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await client.query(
    `INSERT INTO booking_timeline_events (id, booking_id, event_type, actor_user_id, description, metadata)
     VALUES ($1,$2,$3::timeline_event_type,$4,$5,$6::jsonb)`,
    [newTimelineEventId(), bookingId, eventType, actorUserId, description, JSON.stringify(metadata)],
  );
}

export interface CreateBookingInput {
  id: string;
  serviceId: string;
  packageId: string;
  clientId: string;
  freelancerId: string;
  title: string;
  description: string;
  requirements: string[];
  specialInstructions: string;
  currency: string;
  totalMinor: bigint;
  baseMinor: bigint;
  feeMinor: bigint;
  discountMinor: bigint;
  promoCode: string | null;
  packageSnapshot: Record<string, unknown>;
  deliveryDays: number;
}

export async function insertBooking(client: PoolClient, b: CreateBookingInput): Promise<void> {
  await client.query(
    `INSERT INTO bookings (id, service_id, package_id, client_id, freelancer_id, title, description,
       requirements, special_instructions, currency, total_minor, base_amount_minor,
       platform_fee_minor, discount_minor, promo_code, package_snapshot, delivery_days,
       delivery_deadline)
     -- $17 is cast on both uses: reused bare, Postgres deduces integer from
     -- delivery_days and text from the concatenation, and refuses the query.
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::integer,
             now() + ($17::text || ' days')::interval)`,
    [b.id, b.serviceId, b.packageId, b.clientId, b.freelancerId, b.title, b.description,
     b.requirements, b.specialInstructions, b.currency, b.totalMinor.toString(),
     b.baseMinor.toString(), b.feeMinor.toString(), b.discountMinor.toString(), b.promoCode,
     JSON.stringify(b.packageSnapshot), b.deliveryDays],
  );
}

/** Timestamp column stamped when a booking enters each status. */
const STATUS_TIMESTAMP: Partial<Record<BookingStatus, string>> = {
  active: 'work_started_at',
  completed: 'work_completed_at',
  cancelled: 'cancelled_at',
};

export async function setStatus(
  client: PoolClient,
  bookingId: string,
  status: BookingStatus,
): Promise<void> {
  const stamp = STATUS_TIMESTAMP[status];
  await client.query(
    `UPDATE bookings SET status = $2::booking_status
       ${stamp ? `, ${stamp} = COALESCE(${stamp}, now())` : ''}
     WHERE id = $1`,
    [bookingId, status],
  );
}

export async function setPaymentStatus(
  client: PoolClient,
  bookingId: string,
  status: PaymentStatus,
): Promise<void> {
  await client.query(
    `UPDATE bookings SET payment_status = $2::payment_status
       ${status === 'held_in_escrow' ? ', payment_completed_at = COALESCE(payment_completed_at, now()), confirmed_at = COALESCE(confirmed_at, now())' : ''}
     WHERE id = $1`,
    [bookingId, status],
  );
}

export async function markReviewed(
  client: PoolClient,
  bookingId: string,
  side: 'client' | 'freelancer',
): Promise<void> {
  const column = side === 'client' ? 'client_reviewed_at' : 'freelancer_reviewed_at';
  await client.query(`UPDATE bookings SET ${column} = now() WHERE id = $1`, [bookingId]);
}

// --- Stages ----------------------------------------------------------------

export interface StageRow {
  id: string;
  booking_id: string;
  name: string;
  description: string;
  status: string;
  amount_minor: string;
  currency: string;
  due_date: Date | null;
  completed_at: Date | null;
  deliverables: string[];
  client_approved: boolean;
  freelancer_approved: boolean;
  dispute_reason: string | null;
  sort_order: number;
  created_at: Date;
}

export async function listStages(bookingId: string): Promise<StageRow[]> {
  const { rows } = await query<StageRow>(
    'SELECT * FROM booking_stages WHERE booking_id = $1 ORDER BY sort_order, created_at',
    [bookingId],
  );
  return rows;
}

export async function getStage(id: string): Promise<StageRow | null> {
  return queryOne<StageRow>('SELECT * FROM booking_stages WHERE id = $1', [id]);
}

export async function insertStage(
  client: PoolClient,
  id: string,
  bookingId: string,
  input: { name: string; description: string; amountMinor: string; currency: string;
           dueDate: string | null; sortOrder: number },
): Promise<void> {
  await client.query(
    `INSERT INTO booking_stages (id, booking_id, name, description, amount_minor, currency,
       due_date, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7::timestamptz,$8)`,
    [id, bookingId, input.name, input.description, input.amountMinor, input.currency,
     input.dueDate, input.sortOrder],
  );
}

export async function updateStage(
  client: PoolClient,
  id: string,
  patch: { status?: string; name?: string; description?: string; deliverables?: string[];
           clientApproved?: boolean; freelancerApproved?: boolean; disputeReason?: string | null },
): Promise<StageRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => `$${params.push(v)}`;

  if (patch.status !== undefined) {
    sets.push(`status = ${p(patch.status)}::stage_status`);
    if (patch.status === 'completed' || patch.status === 'approved') {
      sets.push('completed_at = COALESCE(completed_at, now())');
    }
  }
  if (patch.name !== undefined) sets.push(`name = ${p(patch.name)}`);
  if (patch.description !== undefined) sets.push(`description = ${p(patch.description)}`);
  if (patch.deliverables !== undefined) sets.push(`deliverables = ${p(patch.deliverables)}`);
  if (patch.clientApproved !== undefined) sets.push(`client_approved = ${p(patch.clientApproved)}`);
  if (patch.freelancerApproved !== undefined) sets.push(`freelancer_approved = ${p(patch.freelancerApproved)}`);
  if (patch.disputeReason !== undefined) sets.push(`dispute_reason = ${p(patch.disputeReason)}`);

  if (sets.length === 0) return getStage(id);

  const { rows } = await client.query<StageRow>(
    `UPDATE booking_stages SET ${sets.join(', ')} WHERE id = ${p(id)} RETURNING *`,
    params,
  );
  return rows[0] ?? null;
}

// --- Reviews ---------------------------------------------------------------

export async function insertReview(
  client: PoolClient,
  input: { id: string; bookingId: string; reviewerId: string; revieweeId: string;
           serviceId: string; rating: number; comment: string },
): Promise<void> {
  await client.query(
    `INSERT INTO reviews (id, booking_id, reviewer_id, reviewee_id, service_id, rating, comment)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [input.id, input.bookingId, input.reviewerId, input.revieweeId, input.serviceId,
     input.rating, input.comment],
  );
}

export async function findReview(bookingId: string, reviewerId: string) {
  return queryOne<{ id: string }>(
    'SELECT id FROM reviews WHERE booking_id = $1 AND reviewer_id = $2',
    [bookingId, reviewerId],
  );
}
