/**
 * Exports services, packages and bookings from the marketplace canister.
 *
 * `getAllServices()` returns everything in one call. Packages and bookings
 * have no bulk endpoint, so they are gathered per service and per user
 * respectively — which is why this needs the user export to have run first.
 *
 * Amounts are captured as raw e8s. No currency conversion happens here: there
 * is no honest exchange rate between "5 ICP" and a dollar price a freelancer
 * intended, so the import flags these rows for their owner to confirm.
 */
import { config } from '../config.js';
import { getMarketplaceActor, withRetry } from '../lib/agent.js';
import { opt, nsToIso, optNsToIso, variantTag, toBigInt, toNumber } from '../lib/candid.js';
import { writeExport, readExport } from '../lib/output.js';
import type { ExportedUser } from './users.js';

export interface ExportedService {
  id: string;
  freelancerId: string;
  title: string;
  mainCategory: string;
  subCategory: string;
  description: string;
  whatsIncluded: string;
  coverImageUrl: string | null;
  portfolioImages: string[];
  tags: string[];
  status: string | null;
  tierMode: string;
  deliveryTimeDays: number;
  startingFromE8s: string | null;
  totalRating: number;
  reviewCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ExportedPackage {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  priceE8s: string | null;
  deliveryTimeDays: number;
  deliveryTimeline: string | null;
  revisions: number;
  features: string[];
  isActive: boolean;
  createdAt: string | null;
}

export interface ExportedBooking {
  id: string;
  serviceId: string;
  packageId: string;
  clientId: string;
  freelancerId: string;
  title: string;
  description: string;
  requirements: string[];
  specialInstructions: string;
  status: string | null;
  paymentStatus: string | null;
  totalAmountE8s: string | null;
  baseAmountE8s: string | null;
  platformFeeE8s: string | null;
  discountAmountE8s: string | null;
  promoCode: string | null;
  currency: string;
  deliveryDays: number;
  createdAt: string | null;
  updatedAt: string | null;
  deadline: string | null;
  deliveryDeadline: string | null;
  confirmedAt: string | null;
  paymentCompletedAt: string | null;
  workStartedAt: string | null;
  workCompletedAt: string | null;
  clientReviewedAt: string | null;
  freelancerReviewedAt: string | null;
  isPaid: boolean;
  packageSnapshot: Record<string, unknown>;
  clientReview: string | null;
  clientRating: number | null;
  freelancerReview: string | null;
  freelancerRating: number | null;

  /**
   * The trail back to escrow.mo and the ICP ledger.
   *
   * The canister never stored an escrow id on the booking — the frontend
   * reconstructed one as `serviceId:N` and probed for it — so these four are
   * the only recorded link between a booking and the money that was actually
   * held for it. They are captured verbatim rather than interpreted: after the
   * canisters are deleted, nothing can produce them again, and an escrow whose
   * funds were never released has to be traceable to the booking it belonged
   * to.
   */
  paymentId: string | null;
  transactionId: string | null;
  escrowAmountE8s: string | null;
  ledgerDepositBlock: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function normaliseService(raw: any): ExportedService {
  return {
    id: raw.service_id,
    freelancerId: raw.freelancer_id,
    title: raw.title ?? '',
    mainCategory: raw.main_category ?? '',
    subCategory: raw.sub_category ?? '',
    description: raw.description ?? '',
    whatsIncluded: raw.whats_included ?? '',
    coverImageUrl: opt<string>(raw.cover_image_url),
    portfolioImages: raw.portfolio_images ?? [],
    tags: raw.tags ?? [],
    status: variantTag(raw.status),
    tierMode: raw.tier_mode ?? '3tier',
    deliveryTimeDays: toNumber(raw.delivery_time_days, 7),
    startingFromE8s: toBigInt(raw.starting_from_e8s)?.toString() ?? null,
    totalRating: Number(raw.total_rating ?? 0),
    reviewCount: toNumber(raw.review_count),
    createdAt: nsToIso(raw.created_at),
    updatedAt: nsToIso(raw.updated_at),
  };
}

function normalisePackage(raw: any): ExportedPackage {
  return {
    id: raw.package_id,
    serviceId: raw.service_id,
    name: raw.name ?? '',
    description: raw.description ?? '',
    priceE8s: toBigInt(raw.price_e8s)?.toString() ?? null,
    deliveryTimeDays: toNumber(raw.delivery_time_days, 1),
    deliveryTimeline: raw.delivery_timeline ?? null,
    revisions: toNumber(raw.revisions, 1),
    features: raw.features ?? [],
    isActive: Boolean(raw.is_active),
    createdAt: nsToIso(raw.created_at),
  };
}

/** Exported for the escrow-link tests; not called from outside this module. */
export function normaliseBooking(raw: any): ExportedBooking {
  return {
    id: raw.booking_id,
    serviceId: raw.service_id,
    packageId: raw.package_id,
    clientId: raw.client_id,
    freelancerId: raw.freelancer_id,
    title: raw.title ?? '',
    description: raw.description ?? '',
    requirements: raw.requirements ?? [],
    specialInstructions: raw.special_instructions ?? '',
    status: variantTag(raw.status),
    paymentStatus: variantTag(raw.payment_status),
    totalAmountE8s: toBigInt(raw.total_amount_e8s)?.toString() ?? null,
    baseAmountE8s: toBigInt(raw.base_amount_e8s)?.toString() ?? null,
    platformFeeE8s: toBigInt(raw.platform_fee_e8s)?.toString() ?? null,
    discountAmountE8s: toBigInt(raw.discount_amount_e8s)?.toString() ?? null,
    promoCode: opt<string>(raw.promo_code),
    currency: raw.currency || 'ICP',
    deliveryDays: toNumber(raw.delivery_days, 7),
    createdAt: nsToIso(raw.created_at),
    updatedAt: nsToIso(raw.updated_at),
    deadline: nsToIso(raw.deadline),
    deliveryDeadline: nsToIso(raw.delivery_deadline),
    confirmedAt: optNsToIso(raw.booking_confirmed_at),
    paymentCompletedAt: optNsToIso(raw.payment_completed_at),
    workStartedAt: optNsToIso(raw.work_started_at),
    workCompletedAt: optNsToIso(raw.work_completed_at),
    clientReviewedAt: optNsToIso(raw.client_reviewed_at),
    freelancerReviewedAt: optNsToIso(raw.freelancer_reviewed_at),
    isPaid: Boolean(raw.isPaid),
    // The canister's denormalised package fields become the immutable order
    // snapshot in the new schema — the terms the client actually agreed to.
    packageSnapshot: {
      title: raw.package_title ?? '',
      description: raw.package_description ?? '',
      tier: raw.package_tier ?? '',
      revisions: toNumber(raw.package_revisions),
      features: raw.package_features ?? [],
    },
    clientReview: opt<string>(raw.client_review),
    clientRating: opt<number>(raw.client_rating),
    freelancerReview: opt<string>(raw.freelancer_review),
    freelancerRating: opt<number>(raw.freelancer_rating),
    // Empty strings stay null: the canister used "" for absent, not a value.
    paymentId: raw.payment_id ? String(raw.payment_id) : null,
    transactionId: raw.transaction_id ? String(raw.transaction_id) : null,
    escrowAmountE8s: toBigInt(raw.escrow_amount_e8s)?.toString() ?? null,
    ledgerDepositBlock: toBigInt(opt<bigint>(raw.ledger_deposit_block))?.toString() ?? null,
  };
}

export async function exportMarketplace(): Promise<void> {
  const actor = await getMarketplaceActor();
  const source = {
    canister: 'marketplace',
    canisterId: config.canisters.marketplace,
    host: config.icHost,
  };

  console.log('Exporting services...');
  const rawServices = await withRetry('getAllServices', () => actor.getAllServices());
  const services = (rawServices as any[]).map(normaliseService);
  const byStatus = services.reduce<Record<string, number>>((acc, s) => {
    const k = s.status ?? 'unknown';
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`  ${services.length} service(s):`, JSON.stringify(byStatus));
  await writeExport('services', source, services);

  console.log('Exporting packages (one call per service)...');
  const packages: ExportedPackage[] = [];
  for (const [i, service] of services.entries()) {
    const raw = await withRetry(`getPackagesByServiceId(${service.id})`, () =>
      actor.getPackagesByServiceId(service.id),
    );
    packages.push(...(raw as any[]).map(normalisePackage));
    if ((i + 1) % 25 === 0) console.log(`  ...${i + 1}/${services.length} services`);
  }
  console.log(`  ${packages.length} package(s)`);
  await writeExport('packages', source, packages);

  console.log('Exporting bookings (one call per user, both roles)...');
  const users = await readExport<ExportedUser>('users');
  const bookings = new Map<string, ExportedBooking>();

  for (const [i, user] of users.records.entries()) {
    for (const role of [{ Client: null }, { Freelancer: null }]) {
      const raw = await withRetry(`getUserBookings(${user.id})`, () =>
        actor.getUserBookings(user.id, role, [], BigInt(200), BigInt(0)),
      ).catch((err) => {
        console.warn(`  skipped ${user.id} (${Object.keys(role)[0]}): ${String(err).slice(0, 120)}`);
        return [] as any[];
      });

      for (const b of raw as any[]) {
        const booking = normaliseBooking(b);
        // The same booking is returned to both parties; dedupe by id.
        bookings.set(booking.id, booking);
      }
    }
    if ((i + 1) % 10 === 0) console.log(`  ...${i + 1}/${users.records.length} users`);
  }

  console.log(`  ${bookings.size} distinct booking(s)`);
  await writeExport('bookings', source, [...bookings.values()]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  exportMarketplace().catch((err) => { console.error(err); process.exit(1); });
}
