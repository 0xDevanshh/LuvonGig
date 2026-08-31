import type { PoolClient } from 'pg';
import { query, queryOne } from '../../db/pool.js';

export interface ServiceRow {
  id: string;
  freelancer_id: string;
  freelancer_email: string;
  title: string;
  main_category: string;
  sub_category: string;
  description: string;
  description_format: string;
  whats_included: string;
  cover_image_url: string | null;
  portfolio_images: string[];
  tags: string[];
  status: 'active' | 'paused' | 'deleted';
  tier_mode: string;
  delivery_time_days: number;
  starting_from_minor: string;
  currency: string;
  rating_avg: string;
  review_count: number;
  faqs: unknown[];
  client_questions: unknown[];
  price_needs_review: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PackageRow {
  id: string;
  service_id: string;
  tier: 'basic' | 'standard' | 'premium';
  name: string;
  description: string;
  price_minor: string;
  currency: string;
  delivery_time_days: number;
  delivery_timeline: string | null;
  revisions: number;
  features: string[];
  is_active: boolean;
  price_needs_review: boolean;
  created_at: Date;
}

/**
 * freelancer_email comes from a join now. The canister could not join, which
 * is why it was duplicated into a JSON side-store and then reconciled at read
 * time in every route.
 */
const SERVICE_SELECT = `
  SELECT s.*, u.email::text AS freelancer_email
    FROM services s
    JOIN users u ON u.id = s.freelancer_id`;

export interface ServiceFilters {
  limit: number;
  offset: number;
  freelancerId?: string;
  freelancerEmail?: string;
  category?: string;
  search?: string;
  /** Owners see their own paused services; the public listing does not. */
  includeNonActive?: boolean;
}

export async function listServices(
  f: ServiceFilters,
): Promise<{ rows: ServiceRow[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => `$${params.push(v)}`;

  where.push(f.includeNonActive ? `s.status <> 'deleted'` : `s.status = 'active'`);

  if (f.freelancerId) where.push(`s.freelancer_id = ${p(f.freelancerId)}`);
  if (f.freelancerEmail) where.push(`u.email = ${p(f.freelancerEmail)}`);
  if (f.category) where.push(`s.main_category = ${p(f.category)}`);
  if (f.search) {
    // Trigram index on (title || ' ' || description); ILIKE uses it directly.
    where.push(`(s.title || ' ' || s.description) ILIKE ${p(`%${f.search}%`)}`);
  }

  const clause = `WHERE ${where.join(' AND ')}`;

  const totalRow = await queryOne<{ n: string }>(
    `SELECT count(*)::text AS n FROM services s JOIN users u ON u.id = s.freelancer_id ${clause}`,
    params,
  );

  const { rows } = await query<ServiceRow>(
    `${SERVICE_SELECT} ${clause} ORDER BY s.created_at DESC LIMIT ${p(f.limit)} OFFSET ${p(f.offset)}`,
    params,
  );

  return { rows, total: Number(totalRow?.n ?? 0) };
}

export async function getService(id: string): Promise<ServiceRow | null> {
  return queryOne<ServiceRow>(`${SERVICE_SELECT} WHERE s.id = $1`, [id]);
}

export async function getPackages(serviceId: string): Promise<PackageRow[]> {
  const { rows } = await query<PackageRow>(
    // Cheapest first: the UI shows tiers in ascending price order.
    `SELECT * FROM service_packages WHERE service_id = $1 ORDER BY price_minor ASC`,
    [serviceId],
  );
  return rows;
}

export async function getPackage(id: string): Promise<PackageRow | null> {
  return queryOne<PackageRow>('SELECT * FROM service_packages WHERE id = $1', [id]);
}

/** The owner of the service a package belongs to, for authorization. */
export async function getPackageOwner(packageId: string): Promise<string | null> {
  const row = await queryOne<{ freelancer_id: string }>(
    `SELECT s.freelancer_id FROM service_packages p
       JOIN services s ON s.id = p.service_id
      WHERE p.id = $1`,
    [packageId],
  );
  return row?.freelancer_id ?? null;
}

export interface ServiceInput {
  title: string;
  main_category: string;
  sub_category: string;
  description: string;
  description_format: string;
  whats_included: string;
  cover_image_url: string | null;
  portfolio_images: string[];
  tags: string[];
  tier_mode: string;
  delivery_time_days: number;
  starting_from_minor: string;
  currency: string;
  faqs: unknown[];
  client_questions: unknown[];
}

export async function insertService(
  client: PoolClient,
  id: string,
  freelancerId: string,
  input: ServiceInput,
): Promise<void> {
  await client.query(
    `INSERT INTO services (id, freelancer_id, title, main_category, sub_category, description,
       description_format, whats_included, cover_image_url, portfolio_images, tags, tier_mode,
       delivery_time_days, starting_from_minor, currency, faqs, client_questions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb)`,
    [id, freelancerId, input.title, input.main_category, input.sub_category, input.description,
     input.description_format, input.whats_included, input.cover_image_url, input.portfolio_images,
     input.tags, input.tier_mode, input.delivery_time_days, input.starting_from_minor,
     input.currency, JSON.stringify(input.faqs), JSON.stringify(input.client_questions)],
  );
}

/**
 * Updates only the supplied columns. Ownership is part of the WHERE clause
 * rather than a prior check, so a service cannot be edited between the check
 * and the write.
 */
export async function updateService(
  id: string,
  ownerId: string,
  patch: Partial<ServiceInput & { status: string }>,
): Promise<ServiceRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => `$${params.push(v)}`;

  const column = (name: string, value: unknown, cast = '') => {
    if (value !== undefined) sets.push(`${name} = ${p(value)}${cast}`);
  };

  column('title', patch.title);
  column('main_category', patch.main_category);
  column('sub_category', patch.sub_category);
  column('description', patch.description);
  column('description_format', patch.description_format);
  column('whats_included', patch.whats_included);
  column('cover_image_url', patch.cover_image_url);
  column('portfolio_images', patch.portfolio_images);
  column('tags', patch.tags);
  column('tier_mode', patch.tier_mode);
  column('delivery_time_days', patch.delivery_time_days);
  column('starting_from_minor', patch.starting_from_minor);
  if (patch.faqs !== undefined) sets.push(`faqs = ${p(JSON.stringify(patch.faqs))}::jsonb`);
  if (patch.client_questions !== undefined) {
    sets.push(`client_questions = ${p(JSON.stringify(patch.client_questions))}::jsonb`);
  }
  if (patch.status !== undefined) sets.push(`status = ${p(patch.status)}::service_status`);
  // A freelancer editing a migrated service has confirmed its price.
  if (patch.starting_from_minor !== undefined) sets.push(`price_needs_review = false`);

  if (sets.length === 0) return getService(id);

  const idParam = p(id);
  const ownerParam = p(ownerId);

  const updated = await queryOne<{ id: string }>(
    `UPDATE services SET ${sets.join(', ')}
      WHERE id = ${idParam} AND freelancer_id = ${ownerParam} AND status <> 'deleted'
      RETURNING id`,
    params,
  );

  return updated ? getService(id) : null;
}

/**
 * Soft delete, scoped to the owner in the same statement.
 *
 * The canister's deleteService took only a service_id and deleted it for any
 * caller — the ownership check simply did not exist. Returns false when the
 * service is missing OR belongs to someone else; the caller must not
 * distinguish the two, or this becomes an existence oracle.
 */
export async function softDeleteService(id: string, ownerId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `UPDATE services SET status = 'deleted'
      WHERE id = $1 AND freelancer_id = $2 AND status <> 'deleted'
      RETURNING id`,
    [id, ownerId],
  );
  return row !== null;
}

export interface PackageInput {
  tier: 'basic' | 'standard' | 'premium';
  name: string;
  description: string;
  price_minor: string;
  currency: string;
  delivery_time_days: number;
  delivery_timeline: string | null;
  revisions: number;
  features: string[];
  is_active: boolean;
}

export async function insertPackage(
  client: PoolClient,
  id: string,
  serviceId: string,
  input: PackageInput,
): Promise<void> {
  await client.query(
    `INSERT INTO service_packages (id, service_id, tier, name, description, price_minor,
       currency, delivery_time_days, delivery_timeline, revisions, features, is_active)
     VALUES ($1,$2,$3::package_tier,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [id, serviceId, input.tier, input.name, input.description, input.price_minor, input.currency,
     input.delivery_time_days, input.delivery_timeline, input.revisions, input.features,
     input.is_active],
  );
}

export async function updatePackage(
  id: string,
  patch: Partial<PackageInput>,
): Promise<PackageRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => `$${params.push(v)}`;

  if (patch.tier !== undefined) sets.push(`tier = ${p(patch.tier)}::package_tier`);
  if (patch.name !== undefined) sets.push(`name = ${p(patch.name)}`);
  if (patch.description !== undefined) sets.push(`description = ${p(patch.description)}`);
  if (patch.price_minor !== undefined) {
    sets.push(`price_minor = ${p(patch.price_minor)}`, 'price_needs_review = false');
  }
  if (patch.delivery_time_days !== undefined) sets.push(`delivery_time_days = ${p(patch.delivery_time_days)}`);
  if (patch.delivery_timeline !== undefined) sets.push(`delivery_timeline = ${p(patch.delivery_timeline)}`);
  if (patch.revisions !== undefined) sets.push(`revisions = ${p(patch.revisions)}`);
  if (patch.features !== undefined) sets.push(`features = ${p(patch.features)}`);
  if (patch.is_active !== undefined) sets.push(`is_active = ${p(patch.is_active)}`);

  if (sets.length === 0) return getPackage(id);

  return queryOne<PackageRow>(
    `UPDATE service_packages SET ${sets.join(', ')} WHERE id = ${p(id)} RETURNING *`,
    params,
  );
}

export async function deletePackage(id: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    'DELETE FROM service_packages WHERE id = $1 RETURNING id',
    [id],
  );
  return row !== null;
}

/** Cheapest active package, used to keep services.starting_from_minor honest. */
export async function refreshStartingPrice(serviceId: string): Promise<void> {
  await query(
    `UPDATE services SET starting_from_minor = COALESCE(
       (SELECT MIN(price_minor) FROM service_packages WHERE service_id = $1 AND is_active), 0)
     WHERE id = $1`,
    [serviceId],
  );
}
