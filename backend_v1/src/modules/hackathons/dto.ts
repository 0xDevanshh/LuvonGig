/**
 * Hackathon row -> API shape.
 *
 * Field names follow what the hackquest routes returned (the tree the pages
 * actually use): `description` for the summary, snake_case dates. Principals
 * are gone — organisers and members are identified by user id and email.
 */
import type {
  CategoryRow, HackathonRow, RewardRow, SubmissionRow, TeamRow,
} from './repo.js';

export function toHackathonDto(h: HackathonRow) {
  return {
    id: h.id,
    organizer_id: h.organizer_id,
    organizer_email: h.organizer_email,

    title: h.title,
    tagline: h.tagline,
    // hackquest's list route exposed `summary` as `description`.
    description: h.summary,
    summary: h.summary,
    theme: h.theme || 'General',
    location: h.location || 'Virtual',
    bannerUrl: h.banner_url ?? '',
    heroVideoUrl: h.hero_video_url ?? '',

    prize_pool_minor: h.prize_pool_minor,
    currency: h.currency,

    faq: h.faq,
    resources: h.resources,

    min_team_size: h.min_team_size,
    max_team_size: h.max_team_size,
    max_teams_per_category: h.max_teams_per_category,

    // ISO strings, not nanosecond numbers.
    registration_start: h.submissions_open_at,
    registration_end: h.submissions_close_at,
    submissions_open_at: h.submissions_open_at,
    submissions_close_at: h.submissions_close_at,
    start_date: h.start_at,
    end_date: h.end_at,
    start_at: h.start_at,
    end_at: h.end_at,

    status: h.status,
    created_at: h.created_at,

    participant_count: Number(h.participant_count),
    team_count: Number(h.team_count),
    submission_count: Number(h.submission_count),
  };
}

export const toCategoryDto = (c: CategoryRow) => ({
  id: c.id,
  hackathon_id: c.hackathon_id,
  name: c.name,
  description: c.description,
  reward_slots: c.reward_slots,
  judging_criteria: c.judging_criteria,
});

export const toRewardDto = (r: RewardRow) => ({
  id: r.id,
  hackathon_id: r.hackathon_id,
  category_id: r.category_id,
  title: r.title,
  description: r.description,
  rank: r.rank,
  perks: r.perks,
  amount_minor: r.amount_minor,
  currency: r.currency,
  awarded_submission_id: r.awarded_submission_id,
  awarded_team_id: r.awarded_team_id,
  awarded_by: r.awarded_by,
  awarded_at: r.awarded_at,
  note: r.note,
});

export const toTeamDto = (t: TeamRow) => ({
  id: t.id,
  hackathon_id: t.hackathon_id,
  category_id: t.category_id,
  name: t.name,
  leader_id: t.leader_id,
  leader_email: t.leader_email,
  submission_id: t.submission_id,
  created_at: t.created_at,
});

export const toSubmissionDto = (s: SubmissionRow) => ({
  id: s.id,
  hackathon_id: s.hackathon_id,
  team_id: s.team_id,
  team_name: s.team_name,
  category_id: s.category_id,
  title: s.title,
  summary: s.summary,
  description: s.description,
  repoUrl: s.repo_url ?? '',
  demoUrl: s.demo_url ?? '',
  repo_url: s.repo_url,
  demo_url: s.demo_url,
  gallery: s.gallery,
  status: s.status,
  submitted_at: s.submitted_at,
});
