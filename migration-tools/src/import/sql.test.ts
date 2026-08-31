/**
 * Validates every INSERT the importers issue against the real schema.
 *
 * Each statement is run through Postgres PREPARE, which parses and plans it —
 * catching a misspelled column, a wrong parameter count, a bad enum cast or a
 * missing conflict target — and then discarded. Nothing is inserted, updated
 * or read, so this is safe to point at any database that has the schema.
 *
 * The statements are copied from the importer modules. If you change one
 * there, change it here: a mismatch surfaces as a failure on the next real
 * import, which is exactly the point at which it is most expensive.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { query, closePool } from './db.js';

const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

let n = 0;
async function prepares(sql: string): Promise<void> {
  const name = `mt_check_${process.pid}_${n++}`;
  try {
    await query(`PREPARE ${name} AS ${sql}`);
  } finally {
    await query(`DEALLOCATE ${name}`).catch(() => {});
  }
}

d('importer SQL matches the schema', () => {
  afterAll(async () => { await closePool(); });

  it('users', async () => {
    await prepares(
      `INSERT INTO users (id, email, password_hash, is_verified, profile_submitted,
                          last_login_at, created_at, legacy_wallet_principal, legacy_wallet_account_id)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::timestamptz, now()),$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
         is_verified = EXCLUDED.is_verified, profile_submitted = EXCLUDED.profile_submitted,
         last_login_at = EXCLUDED.last_login_at,
         legacy_wallet_principal = EXCLUDED.legacy_wallet_principal,
         legacy_wallet_account_id = EXCLUDED.legacy_wallet_account_id`,
    );
  });

  it('user_profiles', async () => {
    await prepares(
      `INSERT INTO user_profiles (user_id, first_name, last_name, bio, phone, location,
         website, linkedin, github, twitter, profile_image_url, resume_url, skills)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (user_id) DO UPDATE SET
         first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
         bio = EXCLUDED.bio, phone = EXCLUDED.phone, location = EXCLUDED.location,
         website = EXCLUDED.website, linkedin = EXCLUDED.linkedin, github = EXCLUDED.github,
         twitter = EXCLUDED.twitter, profile_image_url = EXCLUDED.profile_image_url,
         resume_url = EXCLUDED.resume_url, skills = EXCLUDED.skills`,
    );
  });

  it('experiences', async () => {
    await prepares(
      `INSERT INTO experiences (id, user_id, company, position, start_date, end_date,
         description, is_current, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         company = EXCLUDED.company, position = EXCLUDED.position,
         start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date,
         description = EXCLUDED.description, is_current = EXCLUDED.is_current,
         sort_order = EXCLUDED.sort_order`,
    );
  });

  it('educations', async () => {
    await prepares(
      `INSERT INTO educations (id, user_id, institution, degree, field, start_date,
         end_date, gpa, description, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         institution = EXCLUDED.institution, degree = EXCLUDED.degree,
         field = EXCLUDED.field, start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date, gpa = EXCLUDED.gpa,
         description = EXCLUDED.description, sort_order = EXCLUDED.sort_order`,
    );
  });

  it('services', async () => {
    await prepares(
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
    );
  });

  it('service_packages', async () => {
    await prepares(
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
    );
  });

  it('bookings', async () => {
    await prepares(
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
    );
  });

  it('reviews', async () => {
    await prepares(
      `INSERT INTO reviews (id, booking_id, reviewer_id, reviewee_id, service_id, rating, comment, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8::timestamptz, now()))
       ON CONFLICT (booking_id, reviewer_id) DO UPDATE SET
         rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
    );
  });

  it('job_posts', async () => {
    await prepares(
      `INSERT INTO job_posts (id, client_id, title, description, required_skills, budget_type,
         budget_minor, currency, status, freelancer_id, is_paid, completed_at, client_review,
         client_rating, price_needs_review, legacy_budget_raw, created_at)
       VALUES ($1,$2,$3,$4,$5,$6::budget_type,0,$7,$8::job_status,$9,$10,$11,$12,$13,$14,$15,
               COALESCE($16::timestamptz, now()))
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, description = EXCLUDED.description,
         required_skills = EXCLUDED.required_skills, status = EXCLUDED.status,
         freelancer_id = EXCLUDED.freelancer_id, is_paid = EXCLUDED.is_paid,
         completed_at = EXCLUDED.completed_at, client_review = EXCLUDED.client_review,
         client_rating = EXCLUDED.client_rating,
         price_needs_review = EXCLUDED.price_needs_review,
         legacy_budget_raw = EXCLUDED.legacy_budget_raw`,
    );
  });

  it('proposals', async () => {
    await prepares(
      `INSERT INTO proposals (id, job_id, freelancer_id, cover_letter, bid_minor, currency,
         estimated_delivery_days, status, price_needs_review, legacy_bid_raw, created_at)
       VALUES ($1,$2,$3,$4,0,$5,$6,$7::proposal_status,$8,$9,COALESCE($10::timestamptz, now()))
       ON CONFLICT (id) DO UPDATE SET
         cover_letter = EXCLUDED.cover_letter, status = EXCLUDED.status,
         estimated_delivery_days = EXCLUDED.estimated_delivery_days,
         price_needs_review = EXCLUDED.price_needs_review,
         legacy_bid_raw = EXCLUDED.legacy_bid_raw`,
    );
  });

  it('hackathons', async () => {
    await prepares(
      `INSERT INTO hackathons (id, organizer_id, title, tagline, summary, theme, location,
         banner_url, hero_video_url, prize_pool_minor, currency, faq, resources,
         min_team_size, max_team_size, max_teams_per_category, submissions_open_at,
         submissions_close_at, start_at, end_at, status, legacy_organizer_principal,
         legacy_prize_pool_e8s, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
               $20::hackathon_status,$21,$22,COALESCE($23::timestamptz, now()))
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, tagline = EXCLUDED.tagline, summary = EXCLUDED.summary,
         status = EXCLUDED.status, start_at = EXCLUDED.start_at, end_at = EXCLUDED.end_at,
         legacy_prize_pool_e8s = EXCLUDED.legacy_prize_pool_e8s`,
    );
  });

  it('hackathon_categories', async () => {
    await prepares(
      `INSERT INTO hackathon_categories (id, hackathon_id, name, description, reward_slots, judging_criteria)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, description = EXCLUDED.description,
         reward_slots = EXCLUDED.reward_slots, judging_criteria = EXCLUDED.judging_criteria`,
    );
  });

  it('hackathon_participants', async () => {
    await prepares(
      `INSERT INTO hackathon_participants (user_id, display_name, joined_at, legacy_principal)
       VALUES ($1,$2,COALESCE($3::timestamptz, now()),$4)
       ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name`,
    );
  });

  it('hackathon_registrations', async () => {
    await prepares(
      `INSERT INTO hackathon_registrations (hackathon_id, user_id, registered_at)
       VALUES ($1,$2,COALESCE($3::timestamptz, now()))
       ON CONFLICT (hackathon_id, user_id) DO NOTHING`,
    );
  });

  it('hackathon_teams', async () => {
    await prepares(
      `INSERT INTO hackathon_teams (id, hackathon_id, category_id, name, leader_id,
         legacy_leader_principal, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::timestamptz, now()))
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, category_id = EXCLUDED.category_id, leader_id = EXCLUDED.leader_id`,
    );
  });

  it('hackathon_team_members', async () => {
    await prepares(
      `INSERT INTO hackathon_team_members (team_id, hackathon_id, user_id, accepted, invited_at, accepted_at, legacy_principal)
       VALUES ($1,$2,$3,$4,COALESCE($5::timestamptz, now()),$6,$7)
       ON CONFLICT (team_id, user_id) DO UPDATE SET
         accepted = EXCLUDED.accepted, accepted_at = EXCLUDED.accepted_at`,
    );
  });

  it('hackathon_submissions', async () => {
    await prepares(
      `INSERT INTO hackathon_submissions (id, hackathon_id, team_id, category_id, title, summary,
         description, repo_url, demo_url, gallery, status, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::submission_status,$12)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, summary = EXCLUDED.summary, description = EXCLUDED.description,
         repo_url = EXCLUDED.repo_url, demo_url = EXCLUDED.demo_url,
         gallery = EXCLUDED.gallery, status = EXCLUDED.status`,
    );
  });

  it('hackathon_rewards', async () => {
    await prepares(
      `INSERT INTO hackathon_rewards (id, hackathon_id, category_id, title, description, rank,
         perks, amount_minor, currency, awarded_submission_id, awarded_team_id, awarded_by,
         awarded_at, note, legacy_amount_e8s)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, description = EXCLUDED.description, rank = EXCLUDED.rank,
         awarded_submission_id = EXCLUDED.awarded_submission_id,
         awarded_team_id = EXCLUDED.awarded_team_id, awarded_at = EXCLUDED.awarded_at,
         legacy_amount_e8s = EXCLUDED.legacy_amount_e8s`,
    );
  });

  it('reconcile queries run', async () => {
    // These read, so run them for real — the schema is empty.
    const r = await query<{ n: string }>(
      `SELECT count(*)::text n FROM services WHERE price_needs_review`);
    expect(Number(r.rows[0]?.n)).toBe(0);

    const bad = await query<{ n: string }>(
      `SELECT count(*)::text n FROM users WHERE password_hash NOT LIKE '$argon2id$%'`);
    expect(Number(bad.rows[0]?.n)).toBe(0);
  });
});
