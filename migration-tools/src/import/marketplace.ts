/**
 * Imports services, packages and bookings.
 *
 * MONEY: nothing is converted. Every amount lands in its `legacy_*_e8s`
 * column with the minor-unit column left at 0 and `price_needs_review` set.
 * Inventing an ICP->fiat rate would silently reprice the whole catalogue;
 * a zero that is visibly flagged is honest, a plausible wrong number is not.
 * Services carrying a price are also forced to `paused` so nothing is
 * purchasable at the placeholder amount.
 *
 * TIERS: the canister's Package has no tier — the API inferred one on every
 * read from the name prefix ("Basic: ...") or price order. That inference
 * happens once, here, and its conflicts are reported rather than swallowed.
 */
import type { PoolClient } from 'pg';
import { config } from '../config.js';
import { withTransaction, type ImportReport } from './db.js';
import { readExport } from '../lib/output.js';
import { buildUserLookup, resolveUser } from './users.js';
import type { ExportedService, ExportedPackage, ExportedBooking } from '../export/marketplace.js';
import type { ExportedSideStoreEntry } from '../export/sideStore.js';

export const TIERS = ['basic', 'standard', 'premium'] as const;
export type Tier = (typeof TIERS)[number];

/** Mirrors the inference the API did at read time, in the same priority order. */
export function inferTier(
  pkg: Pick<ExportedPackage, 'name'>,
  indexByPrice: number,
  totalForService: number,
): Tier {
  const name = (pkg.name || '').toLowerCase();

  const prefix = /^(basic|standard|advanced|premium)\s*:/.exec(name);
  if (prefix) {
    const t = prefix[1] as string;
    return t === 'advanced' ? 'standard' : (t as Tier);
  }
  if (name.includes('premium') || name.includes('pro')) return 'premium';
  if (name.includes('standard') || name.includes('advanced')) return 'standard';
  if (name.includes('basic') || name.includes('starter')) return 'basic';

  if (totalForService === 1) return 'basic';
  if (totalForService === 2) return indexByPrice === 0 ? 'basic' : 'premium';
  if (indexByPrice === 0) return 'basic';
  if (indexByPrice === totalForService - 1) return 'premium';
  return 'standard';
}

/** Strips a "Basic: " style prefix, as the read path used to. */
export function cleanName(name: string): string {
  const m = /^(?:Basic|Standard|Advanced|Premium)\s*:\s*(.+)$/i.exec(name || '');
  return m ? (m[1] as string) : name;
}

const CURRENCY = config.importCurrency;

export async function importServices(report: ImportReport): Promise<void> {
  console.log('Importing services and packages...');

  const services = (await readExport<ExportedService>('services')).records;
  const packages = (await readExport<ExportedPackage>('packages')).records;

  let sideStore: ExportedSideStoreEntry[] = [];
  try {
    sideStore = (await readExport<ExportedSideStoreEntry>('service_side_store')).records;
  } catch {
    report.warn('service_side_store.json missing — FAQs, client questions and tier mode will be empty');
  }
  const side = new Map(sideStore.map((s) => [s.serviceId, s]));

  const lookup = await buildUserLookup();
  const importedServices = new Set<string>();

  await withTransaction(async (client: PoolClient) => {
    for (const s of services) {
      const extra = side.get(s.id);

      // freelancer_id may hold an id or an email; the side-store carries a
      // definite email when it exists.
      const freelancerId =
        resolveUser(s.freelancerId, lookup) ?? resolveUser(extra?.freelancerEmail, lookup);

      if (!freelancerId) {
        report.skip('services', s.id, 'freelancer could not be resolved to a user');
        continue;
      }

      const hasPrice = s.startingFromE8s !== null && s.startingFromE8s !== '0';
      // 'deleted' services stay deleted; priced ones are parked until repriced.
      const status = s.status === 'deleted' ? 'deleted' : hasPrice ? 'paused' : (s.status ?? 'active');

      await client.query(
        `INSERT INTO services (id, freelancer_id, title, main_category, sub_category, description,
           description_format, whats_included, cover_image_url, portfolio_images, tags, status,
           tier_mode, delivery_time_days, starting_from_minor, currency, rating_avg, review_count,
           faqs, client_questions, price_needs_review, legacy_starting_from_e8s, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::service_status,$13,$14,0,$15,$16,$17,
                 $18::jsonb,$19::jsonb,$20,$21,COALESCE($22::timestamptz, now()),COALESCE($23::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, main_category = EXCLUDED.main_category,
           sub_category = EXCLUDED.sub_category, description = EXCLUDED.description,
           whats_included = EXCLUDED.whats_included, cover_image_url = EXCLUDED.cover_image_url,
           portfolio_images = EXCLUDED.portfolio_images, tags = EXCLUDED.tags,
           status = EXCLUDED.status, tier_mode = EXCLUDED.tier_mode,
           faqs = EXCLUDED.faqs, client_questions = EXCLUDED.client_questions,
           price_needs_review = EXCLUDED.price_needs_review,
           legacy_starting_from_e8s = EXCLUDED.legacy_starting_from_e8s`,
        [
          s.id, freelancerId, s.title, s.mainCategory, s.subCategory, s.description,
          extra?.descriptionFormat ?? 'markdown', s.whatsIncluded,
          extra?.coverImageUrl ?? s.coverImageUrl,
          extra?.portfolioImages?.length ? extra.portfolioImages : s.portfolioImages,
          s.tags, status, extra?.tierMode ?? s.tierMode ?? '3tier', Math.max(1, s.deliveryTimeDays),
          CURRENCY,
          // rating_avg / review_count are recomputed by trigger once reviews
          // land; seeded here so a service with no reviews still reads sanely.
          Number.isFinite(s.totalRating) ? Math.min(5, Math.max(0, s.totalRating)) : 0,
          Math.max(0, s.reviewCount),
          JSON.stringify(extra?.faqs ?? []), JSON.stringify(extra?.clientQuestions ?? []),
          hasPrice, s.startingFromE8s, s.createdAt, s.updatedAt,
        ],
      );
      importedServices.add(s.id);
      report.count('services');
    }

    // Group packages by service and resolve tiers per group.
    const byService = new Map<string, ExportedPackage[]>();
    for (const p of packages) {
      if (!importedServices.has(p.serviceId)) {
        report.skip('service_packages', p.id, 'parent service was not imported');
        continue;
      }
      byService.set(p.serviceId, [...(byService.get(p.serviceId) ?? []), p]);
    }

    for (const [serviceId, group] of byService) {
      const ordered = [...group].sort(
        (a, b) => Number(BigInt(a.priceE8s ?? '0') - BigInt(b.priceE8s ?? '0')),
      );

      const used = new Set<Tier>();
      for (const [i, p] of ordered.entries()) {
        let tier = inferTier(p, i, ordered.length);

        // UNIQUE (service_id, tier): take the next free tier, or drop.
        if (used.has(tier)) {
          const free = TIERS.find((t) => !used.has(t));
          if (!free) {
            report.skip('service_packages', p.id,
              `service ${serviceId} has more than 3 packages — extras cannot be tiered`);
            continue;
          }
          report.warn(`package ${p.id}: tier "${tier}" already taken on ${serviceId}, assigned "${free}"`);
          tier = free;
        }
        used.add(tier);

        const hasPrice = p.priceE8s !== null && p.priceE8s !== '0';

        await client.query(
          `INSERT INTO service_packages (id, service_id, tier, name, description, price_minor,
             currency, delivery_time_days, delivery_timeline, revisions, features, is_active,
             price_needs_review, legacy_price_e8s, created_at)
           VALUES ($1,$2,$3::package_tier,$4,$5,0,$6,$7,$8,$9,$10,$11,$12,$13,
                   COALESCE($14::timestamptz, now()))
           ON CONFLICT (id) DO UPDATE SET
             tier = EXCLUDED.tier, name = EXCLUDED.name, description = EXCLUDED.description,
             delivery_time_days = EXCLUDED.delivery_time_days,
             delivery_timeline = EXCLUDED.delivery_timeline, revisions = EXCLUDED.revisions,
             features = EXCLUDED.features, is_active = EXCLUDED.is_active,
             price_needs_review = EXCLUDED.price_needs_review,
             legacy_price_e8s = EXCLUDED.legacy_price_e8s`,
          [p.id, serviceId, tier, cleanName(p.name), p.description, CURRENCY,
           Math.max(1, p.deliveryTimeDays), p.deliveryTimeline, Math.max(0, p.revisions),
           p.features, p.isActive, hasPrice, p.priceE8s, p.createdAt],
        );
        report.count('service_packages');
      }
    }
  });
}

export async function importBookings(report: ImportReport): Promise<void> {
  console.log('Importing bookings...');
  const bookings = (await readExport<ExportedBooking>('bookings')).records;
  if (bookings.length === 0) return;

  const lookup = await buildUserLookup();
  const { query } = await import('./db.js');
  const services = new Set((await query<{ id: string }>('SELECT id FROM services')).rows.map((r) => r.id));
  const packages = new Set((await query<{ id: string }>('SELECT id FROM service_packages')).rows.map((r) => r.id));

  // The canister had no 'paid' booking status; the schema folds it into
  // payment_status, where it belongs.
  const STATUS: Record<string, string> = {
    pending: 'pending', active: 'active', indispute: 'in_dispute',
    completed: 'completed', paid: 'completed', cancelled: 'cancelled',
  };
  const PAYMENT: Record<string, string> = {
    pending: 'pending', heldinescrow: 'held_in_escrow', released: 'released',
    refunded: 'refunded', disputed: 'disputed',
  };

  await withTransaction(async (client: PoolClient) => {
    for (const b of bookings) {
      const clientId = resolveUser(b.clientId, lookup);
      const freelancerId = resolveUser(b.freelancerId, lookup);

      if (!clientId || !freelancerId) {
        report.skip('bookings', b.id, 'client or freelancer could not be resolved');
        continue;
      }
      if (clientId === freelancerId) {
        // booking_parties_differ would reject this.
        report.skip('bookings', b.id, 'client and freelancer resolve to the same user');
        continue;
      }
      if (!services.has(b.serviceId)) {
        report.skip('bookings', b.id, 'service missing (FK would fail)');
        continue;
      }
      if (!packages.has(b.packageId)) {
        report.skip('bookings', b.id, 'package missing (FK would fail)');
        continue;
      }

      const status = STATUS[b.status ?? ''] ?? 'pending';
      // A booking the canister marked #Paid is completed work with a settled
      // payment; keep that fact rather than losing it in the status collapse.
      const paymentStatus =
        b.status === 'paid' || b.isPaid ? 'released' : (PAYMENT[b.paymentStatus ?? ''] ?? 'pending');

      await client.query(
        `INSERT INTO bookings (id, service_id, package_id, client_id, freelancer_id, title,
           description, requirements, special_instructions, status, payment_status, currency,
           total_minor, base_amount_minor, platform_fee_minor, discount_minor, promo_code,
           package_snapshot, delivery_days, delivery_deadline, confirmed_at, payment_completed_at,
           work_started_at, work_completed_at, client_reviewed_at, freelancer_reviewed_at,
           cancelled_at, legacy_total_e8s, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::booking_status,$11::payment_status,$12,
                 0,0,0,0,$13,$14::jsonb,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
                 COALESCE($25::timestamptz, now()),COALESCE($26::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status, payment_status = EXCLUDED.payment_status,
           title = EXCLUDED.title, description = EXCLUDED.description,
           requirements = EXCLUDED.requirements, package_snapshot = EXCLUDED.package_snapshot,
           legacy_total_e8s = EXCLUDED.legacy_total_e8s`,
        [
          b.id, b.serviceId, b.packageId, clientId, freelancerId, b.title || 'Untitled booking',
          b.description, b.requirements, b.specialInstructions, status, paymentStatus, CURRENCY,
          b.promoCode, JSON.stringify(b.packageSnapshot), Math.max(1, b.deliveryDays),
          b.deliveryDeadline, b.confirmedAt, b.paymentCompletedAt, b.workStartedAt,
          b.workCompletedAt, b.clientReviewedAt, b.freelancerReviewedAt,
          status === 'cancelled' ? b.updatedAt : null,
          b.totalAmountE8s, b.createdAt, b.updatedAt,
        ],
      );
      report.count('bookings');

      // Reviews lived as fields on the canister's Booking rather than as rows.
      for (const side of [
        { rating: b.clientRating, comment: b.clientReview, reviewer: clientId, reviewee: freelancerId, tag: 'client' },
        { rating: b.freelancerRating, comment: b.freelancerReview, reviewer: freelancerId, reviewee: clientId, tag: 'freelancer' },
      ]) {
        if (side.rating === null || side.rating === undefined) continue;
        const rating = Math.min(5, Math.max(1, Number(side.rating)));
        if (!Number.isFinite(rating)) continue;

        await client.query(
          `INSERT INTO reviews (id, booking_id, reviewer_id, reviewee_id, service_id, rating, comment, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8::timestamptz, now()))
           ON CONFLICT (booking_id, reviewer_id) DO UPDATE SET
             rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
          [`rv_${b.id}_${side.tag}`, b.id, side.reviewer, side.reviewee, b.serviceId,
           rating, side.comment ?? '', b.updatedAt],
        );
        report.count('reviews');
      }
    }
  });
}
