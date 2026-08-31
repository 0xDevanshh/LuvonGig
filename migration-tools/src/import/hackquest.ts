/**
 * Imports hackathons and everything hanging off them.
 *
 * The hard part is identity. hackquest keyed organisers, team leaders, team
 * members and award-granters by Principal, which means nothing once the
 * canisters stop. Principals are resolved to users through the emails carried
 * on Participant records; anything unresolvable is skipped and reported, never
 * guessed at.
 *
 * Insert order follows the FKs: hackathons -> categories -> teams ->
 * submissions -> rewards (which reference submissions and teams).
 */
import type { PoolClient } from 'pg';
import { config } from '../config.js';
import { withTransaction, type ImportReport } from './db.js';
import { readExport } from '../lib/output.js';
import { buildUserLookup } from './users.js';
import type {
  ExportedHackathon, ExportedCategory, ExportedReward,
  ExportedParticipant, ExportedTeam, ExportedSubmission,
} from '../export/hackquest.js';

const CURRENCY = config.importCurrency;

const HACKATHON_STATUS: Record<string, string> = {
  draft: 'draft', upcoming: 'upcoming', ongoing: 'ongoing',
  judging: 'judging', completed: 'completed', cancelled: 'cancelled',
};
const SUBMISSION_STATUS: Record<string, string> = {
  draft: 'draft', submitted: 'submitted', underreview: 'under_review',
  selected: 'selected', rejected: 'rejected',
};

export async function importHackquest(report: ImportReport): Promise<void> {
  console.log('Importing hackathons...');

  let hackathons: ExportedHackathon[] = [];
  let categories: ExportedCategory[] = [];
  let rewards: ExportedReward[] = [];
  let participants: ExportedParticipant[] = [];
  let teams: ExportedTeam[] = [];
  let submissions: ExportedSubmission[] = [];

  try {
    hackathons = (await readExport<ExportedHackathon>('hackathons')).records;
    categories = (await readExport<ExportedCategory>('hackathon_categories')).records;
    rewards = (await readExport<ExportedReward>('hackathon_rewards')).records;
    participants = (await readExport<ExportedParticipant>('hackathon_participants')).records;
    teams = (await readExport<ExportedTeam>('hackathon_teams')).records;
    submissions = (await readExport<ExportedSubmission>('hackathon_submissions')).records;
  } catch {
    console.log('  no hackquest export found — skipping');
    return;
  }
  if (hackathons.length === 0) return;

  const lookup = await buildUserLookup();

  // principal -> user id, via the email on each Participant record.
  const principalToUser = new Map<string, string>();
  const unresolved = new Set<string>();
  for (const p of participants) {
    if (!p.principal) continue;
    const userId = p.email ? lookup.byEmail.get(p.email.trim().toLowerCase()) : undefined;
    if (userId) principalToUser.set(p.principal, userId);
    else unresolved.add(p.principal);
  }

  const resolvePrincipal = (principal: string | null): string | null =>
    principal ? (principalToUser.get(principal) ?? null) : null;

  if (unresolved.size > 0) {
    report.warn(
      `${unresolved.size} hackquest principal(s) have a Participant record whose email ` +
        'matches no imported user — their teams and submissions will be skipped',
    );
  }

  const okHackathons = new Set<string>();
  const okCategories = new Set<string>();
  const okTeams = new Set<string>();
  const okSubmissions = new Set<string>();

  await withTransaction(async (client: PoolClient) => {
    for (const h of hackathons) {
      const organizerId = resolvePrincipal(h.organizerPrincipal);
      if (!organizerId) {
        report.skip('hackathons', h.id, 'organiser principal could not be resolved to a user');
        continue;
      }

      // team_size_range: max must be >= min.
      const minTeam = Math.max(1, h.minTeamSize);
      const maxTeam = Math.max(minTeam, h.maxTeamSize);
      if (maxTeam !== h.maxTeamSize) {
        report.warn(`hackathon ${h.id}: maxTeamSize ${h.maxTeamSize} < minTeamSize ${minTeam} — raised to ${maxTeam}`);
      }

      // hackathon_dates_ordered: end must not precede start.
      let endAt = h.endAt;
      if (h.startAt && endAt && new Date(endAt) < new Date(h.startAt)) {
        report.warn(`hackathon ${h.id}: endAt precedes startAt — endAt dropped`);
        endAt = null;
      }

      const hasPrize = h.prizePoolE8s !== null && h.prizePoolE8s !== '0';

      await client.query(
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
        [h.id, organizerId, h.title || 'Untitled hackathon', h.tagline, h.summary, h.theme,
         h.location, h.bannerUrl || null, h.heroVideoUrl || null, CURRENCY, h.faq, h.resources,
         minTeam, maxTeam, Math.max(0, h.maxTeamsPerCategory), h.submissionsOpenAt,
         h.submissionsCloseAt, h.startAt, endAt,
         HACKATHON_STATUS[h.status ?? ''] ?? 'draft', h.organizerPrincipal,
         hasPrize ? h.prizePoolE8s : null, h.createdAt],
      );
      okHackathons.add(h.id);
      report.count('hackathons');
    }

    for (const c of categories) {
      if (!okHackathons.has(c.hackathonId)) {
        report.skip('hackathon_categories', c.id, 'parent hackathon was not imported');
        continue;
      }
      await client.query(
        `INSERT INTO hackathon_categories (id, hackathon_id, name, description, reward_slots, judging_criteria)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, description = EXCLUDED.description,
           reward_slots = EXCLUDED.reward_slots, judging_criteria = EXCLUDED.judging_criteria`,
        [c.id, c.hackathonId, c.name, c.description, Math.max(0, c.rewardSlots), c.judgingCriteria],
      );
      okCategories.add(c.id);
      report.count('hackathon_categories');
    }

    // Participants: the global registry, then per-hackathon registrations.
    const seenParticipant = new Set<string>();
    for (const p of participants) {
      const userId = resolvePrincipal(p.principal);
      if (!userId) continue; // already counted in the unresolved warning

      if (!seenParticipant.has(userId)) {
        seenParticipant.add(userId);
        await client.query(
          `INSERT INTO hackathon_participants (user_id, display_name, joined_at, legacy_principal)
           VALUES ($1,$2,COALESCE($3::timestamptz, now()),$4)
           ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name`,
          [userId, p.displayName, p.joinedAt, p.principal],
        );
        report.count('hackathon_participants');
      }

      if (okHackathons.has(p.hackathonId)) {
        await client.query(
          `INSERT INTO hackathon_registrations (hackathon_id, user_id, registered_at)
           VALUES ($1,$2,COALESCE($3::timestamptz, now()))
           ON CONFLICT (hackathon_id, user_id) DO NOTHING`,
          [p.hackathonId, userId, p.joinedAt],
        );
        report.count('hackathon_registrations');
      }
    }

    // Teams, then members. UNIQUE (hackathon_id, user_id) means one team each.
    const teamNames = new Set<string>();
    for (const t of teams) {
      if (!okHackathons.has(t.hackathonId)) {
        report.skip('hackathon_teams', t.id, 'parent hackathon was not imported');
        continue;
      }
      const leaderId = resolvePrincipal(t.leaderPrincipal);
      if (!leaderId) {
        report.skip('hackathon_teams', t.id, 'team leader could not be resolved to a user');
        continue;
      }

      // UNIQUE (hackathon_id, name)
      let name = t.name || 'Unnamed team';
      if (teamNames.has(`${t.hackathonId}::${name.toLowerCase()}`)) {
        const suffixed = `${name} (${t.id.slice(-6)})`;
        report.warn(`team ${t.id}: name "${name}" already used in ${t.hackathonId} — renamed to "${suffixed}"`);
        name = suffixed;
      }
      teamNames.add(`${t.hackathonId}::${name.toLowerCase()}`);

      const categoryId = t.categoryId && okCategories.has(t.categoryId) ? t.categoryId : null;

      await client.query(
        `INSERT INTO hackathon_teams (id, hackathon_id, category_id, name, leader_id,
           legacy_leader_principal, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, category_id = EXCLUDED.category_id, leader_id = EXCLUDED.leader_id`,
        [t.id, t.hackathonId, categoryId, name, leaderId, t.leaderPrincipal, t.createdAt],
      );
      okTeams.add(t.id);
      report.count('hackathon_teams');
    }

    const memberOfHackathon = new Set<string>();
    for (const t of teams) {
      if (!okTeams.has(t.id)) continue;

      // The leader is a member too, and goes in first so a conflicting
      // membership elsewhere loses rather than displacing them.
      const leaderId = resolvePrincipal(t.leaderPrincipal);
      const roster = [
        ...(leaderId ? [{ principal: t.leaderPrincipal, userId: leaderId, accepted: true, invitedAt: t.createdAt, acceptedAt: t.createdAt }] : []),
        ...t.members.map((m) => ({
          principal: m.principal, userId: resolvePrincipal(m.principal),
          accepted: m.accepted, invitedAt: m.invitedAt, acceptedAt: m.acceptedAt,
        })),
      ];

      for (const m of roster) {
        if (!m.userId) {
          report.skip('hackathon_team_members', `${t.id}/${m.principal ?? '?'}`,
            'member principal could not be resolved to a user');
          continue;
        }
        const key = `${t.hackathonId}::${m.userId}`;
        if (memberOfHackathon.has(key)) {
          report.skip('hackathon_team_members', `${t.id}/${m.userId}`,
            'user already on another team in this hackathon');
          continue;
        }
        memberOfHackathon.add(key);

        await client.query(
          `INSERT INTO hackathon_team_members (team_id, hackathon_id, user_id, accepted, invited_at, accepted_at, legacy_principal)
           VALUES ($1,$2,$3,$4,COALESCE($5::timestamptz, now()),$6,$7)
           ON CONFLICT (team_id, user_id) DO UPDATE SET
             accepted = EXCLUDED.accepted, accepted_at = EXCLUDED.accepted_at`,
          [t.id, t.hackathonId, m.userId, m.accepted, m.invitedAt, m.acceptedAt, m.principal],
        );
        report.count('hackathon_team_members');
      }
    }

    // UNIQUE (team_id): one submission per team.
    const submittedTeams = new Set<string>();
    for (const s of submissions) {
      if (!okHackathons.has(s.hackathonId)) {
        report.skip('hackathon_submissions', s.id, 'parent hackathon was not imported');
        continue;
      }
      if (!okTeams.has(s.teamId)) {
        report.skip('hackathon_submissions', s.id, 'team was not imported');
        continue;
      }
      if (submittedTeams.has(s.teamId)) {
        report.skip('hackathon_submissions', s.id, 'team already has a submission');
        continue;
      }
      submittedTeams.add(s.teamId);

      await client.query(
        `INSERT INTO hackathon_submissions (id, hackathon_id, team_id, category_id, title, summary,
           description, repo_url, demo_url, gallery, status, submitted_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::submission_status,$12)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, summary = EXCLUDED.summary, description = EXCLUDED.description,
           repo_url = EXCLUDED.repo_url, demo_url = EXCLUDED.demo_url,
           gallery = EXCLUDED.gallery, status = EXCLUDED.status`,
        [s.id, s.hackathonId, s.teamId,
         s.categoryId && okCategories.has(s.categoryId) ? s.categoryId : null,
         s.title || 'Untitled submission', s.summary, s.description,
         s.repoUrl || null, s.demoUrl || null, s.gallery,
         SUBMISSION_STATUS[s.status ?? ''] ?? 'draft', s.submittedAt],
      );
      okSubmissions.add(s.id);
      report.count('hackathon_submissions');
    }

    // Rewards last: they reference submissions and teams.
    for (const r of rewards) {
      if (!okHackathons.has(r.hackathonId)) {
        report.skip('hackathon_rewards', r.id, 'parent hackathon was not imported');
        continue;
      }
      const hasAmount = r.amountE8s !== null && r.amountE8s !== '0';

      await client.query(
        `INSERT INTO hackathon_rewards (id, hackathon_id, category_id, title, description, rank,
           perks, amount_minor, currency, awarded_submission_id, awarded_team_id, awarded_by,
           awarded_at, note, legacy_amount_e8s)
         VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, description = EXCLUDED.description, rank = EXCLUDED.rank,
           awarded_submission_id = EXCLUDED.awarded_submission_id,
           awarded_team_id = EXCLUDED.awarded_team_id, awarded_at = EXCLUDED.awarded_at,
           legacy_amount_e8s = EXCLUDED.legacy_amount_e8s`,
        [r.id, r.hackathonId,
         r.categoryId && okCategories.has(r.categoryId) ? r.categoryId : null,
         r.title || 'Reward', r.description, Math.max(1, r.rank), r.perks, CURRENCY,
         r.awardedSubmissionId && okSubmissions.has(r.awardedSubmissionId) ? r.awardedSubmissionId : null,
         r.awardedTeamId && okTeams.has(r.awardedTeamId) ? r.awardedTeamId : null,
         resolvePrincipal(r.awardedByPrincipal), r.awardedAt, r.note,
         hasAmount ? r.amountE8s : null],
      );
      report.count('hackathon_rewards');
    }
  });
}
