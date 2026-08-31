/**
 * Row -> API shape.
 *
 * Field names match what the canister-backed routes returned (snake_case,
 * `service_id` rather than `id`, `Active`/`Paused` capitalised) so pages and
 * hooks keep working through the proxy. Phase 7 can normalise these once the
 * frontend is being edited anyway.
 *
 * Two deliberate improvements the old shape could not express:
 *   - timestamps are ISO strings, not nanosecond numbers, so the frontend's
 *     `if (t > 1e15) t / 1e6` guessing has nothing left to do
 *   - `tier` is a real value rather than something inferred per request
 */
import type { PackageRow, ServiceRow } from './repo.js';

const TITLE_CASE: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  deleted: 'Deleted',
};

export function toPackageDto(p: PackageRow) {
  return {
    package_id: p.id,
    service_id: p.service_id,
    tier: p.tier.charAt(0).toUpperCase() + p.tier.slice(1),
    title: p.name,
    name: p.name,
    description: p.description,
    // Minor units as a string: a number would lose precision on large amounts,
    // and the frontend only ever formats this for display.
    price_minor: p.price_minor,
    currency: p.currency,
    delivery_days: p.delivery_time_days,
    delivery_timeline: p.delivery_timeline ?? `${p.delivery_time_days} days`,
    revisions_included: p.revisions,
    features: p.features,
    status: p.is_active ? 'Available' : 'Unavailable',
    price_needs_review: p.price_needs_review,
    created_at: p.created_at,
  };
}

export function toServiceDto(s: ServiceRow, packages: PackageRow[]) {
  return {
    service_id: s.id,
    freelancer_id: s.freelancer_id,
    freelancer_email: s.freelancer_email,
    title: s.title,
    main_category: s.main_category,
    sub_category: s.sub_category,
    description: s.description,
    description_format: s.description_format,
    whats_included: s.whats_included,
    cover_image_url: s.cover_image_url ?? '',
    portfolio_images: s.portfolio_images,
    tags: s.tags,
    status: TITLE_CASE[s.status] ?? 'Active',
    tier_mode: s.tier_mode,
    delivery_time_days: s.delivery_time_days,
    min_delivery_days: s.delivery_time_days,
    max_delivery_days: s.delivery_time_days,
    delivery_timeline: `${s.delivery_time_days} days`,
    starting_from_minor: s.starting_from_minor,
    currency: s.currency,
    rating_avg: Number(s.rating_avg),
    total_rating: Number(s.rating_avg),
    review_count: s.review_count,
    total_orders: s.review_count,
    faqs: s.faqs,
    client_questions: s.client_questions,
    // Migrated services carry their original ICP amount and are paused until
    // the freelancer confirms a real price.
    price_needs_review: s.price_needs_review,
    packages: packages.map(toPackageDto),
    created_at: s.created_at,
    updated_at: s.updated_at,
  };
}
