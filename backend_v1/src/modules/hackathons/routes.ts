/**
 * Hackathon routes — the consolidation of what were three parallel trees
 * (/api/hackathon, /api/hackathons, /api/hackquest) and four Motoko actors.
 * Only hackquest was actually reachable from the UI; the other twelve routes
 * were dead and are deleted rather than ported.
 *
 * IDENTITY: hackquest keyed organisers, leaders and members by IC Principal
 * and carried a parallel email, which is why it needed
 * /participants/email-to-principal and friends. Participants are users now, so
 * those three lookup endpoints are deleted, not migrated.
 *
 * Submission windows are enforced here. hackquest checked them on some paths
 * and not others, so a team could submit after the deadline via the update
 * endpoint.
 */
import { Router } from 'express';
import { z } from 'zod';
import { withTransaction } from '../../db/pool.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { ok } from '../../lib/http.js';
import { generateId } from '../../lib/ids.js';
import { attachUser, requireAuth } from '../../middleware/requireAuth.js';
import { param, validateBody } from '../../middleware/validate.js';
import * as repo from './repo.js';
import { toHackathonDto, toSubmissionDto, toTeamDto, toRewardDto, toCategoryDto } from './dto.js';

export const hackathonsRouter = Router();

const money = z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
  .transform((v) => String(v));
const isoDate = z.string().datetime().nullish();

/** Whether the submission window is currently open. */
function submissionsOpen(h: repo.HackathonRow): boolean {
  const now = Date.now();
  if (h.submissions_open_at && new Date(h.submissions_open_at).getTime() > now) return false;
  if (h.submissions_close_at && new Date(h.submissions_close_at).getTime() < now) return false;
  return h.status === 'ongoing' || h.status === 'upcoming';
}

async function loadAsOrganizer(id: string, userId: string): Promise<repo.HackathonRow> {
  const h = await repo.getHackathon(id);
  if (!h) throw notFound('Hackathon not found');
  if (h.organizer_id !== userId) throw forbidden('Only the organiser can do that');
  return h;
}

// --- Listing ---------------------------------------------------------------

const listQuery = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
  status: z.enum(['draft', 'upcoming', 'ongoing', 'judging', 'completed', 'cancelled']).optional(),
  organizer_id: z.string().optional(),
});

hackathonsRouter.get('/', attachUser, async (req, res, next) => {
  try {
    const q = listQuery.parse(req.query);
    // Drafts are the organiser's private working copies.
    const ownListing = Boolean(req.user) && q.organizer_id === req.user!.userId;

    const { rows, total } = await repo.listHackathons({
      limit: q.limit, offset: q.offset, status: q.status,
      organizerId: q.organizer_id, includeDrafts: ownListing,
    });

    // hackquest's list route answered { success, hackathons, total }; `data` is
    // included too so new callers can use the standard envelope.
    res.json({ success: true, hackathons: rows.map(toHackathonDto), data: rows.map(toHackathonDto), total });
  } catch (err) {
    next(err);
  }
});

hackathonsRouter.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const rows = await repo.listForUser(req.user!.userId);
    res.json({ success: true, hackathons: rows.map(toHackathonDto), data: rows.map(toHackathonDto) });
  } catch (err) {
    next(err);
  }
});

hackathonsRouter.get('/stats', requireAuth, async (req, res, next) => {
  try {
    ok(res, await repo.userStats(req.user!.userId));
  } catch (err) {
    next(err);
  }
});

hackathonsRouter.get('/:hackathonId', attachUser, async (req, res, next) => {
  try {
    const h = await repo.getHackathon(param(req, 'hackathonId'));
    if (!h) return next(notFound('Hackathon not found'));
    if (h.status === 'draft' && req.user?.userId !== h.organizer_id) {
      return next(notFound('Hackathon not found'));
    }

    const [categories, rewards] = await Promise.all([
      repo.getCategories(h.id), repo.getRewards(h.id),
    ]);

    ok(res, {
      ...toHackathonDto(h),
      categories: categories.map(toCategoryDto),
      rewards: rewards.map(toRewardDto),
      submissions_open: submissionsOpen(h),
      registered: req.user ? await repo.isRegistered(h.id, req.user.userId) : false,
    });
  } catch (err) {
    next(err);
  }
});

// --- Create / edit ---------------------------------------------------------

const categoryInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(4000).default(''),
  reward_slots: z.number().int().nonnegative().default(0),
  judging_criteria: z.array(z.string().max(300)).max(20).default([]),
});

const rewardInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).default(''),
  rank: z.number().int().positive().default(1),
  perks: z.array(z.string().max(300)).max(20).default([]),
  amount_minor: money.default('0'),
  currency: z.string().length(3).default('USD'),
  category_index: z.number().int().nonnegative().nullish(),
});

const hackathonInput = z.object({
  title: z.string().min(1).max(300),
  tagline: z.string().max(500).default(''),
  summary: z.string().max(20000).default(''),
  theme: z.string().max(200).default(''),
  location: z.string().max(200).default(''),
  banner_url: z.string().max(2000).nullish(),
  hero_video_url: z.string().max(2000).nullish(),
  prize_pool_minor: money.default('0'),
  currency: z.string().length(3).default('USD'),
  faq: z.array(z.string().max(2000)).max(50).default([]),
  resources: z.array(z.string().max(2000)).max(50).default([]),
  min_team_size: z.number().int().positive().default(1),
  max_team_size: z.number().int().positive().default(5),
  max_teams_per_category: z.number().int().nonnegative().default(0),
  submissions_open_at: isoDate,
  submissions_close_at: isoDate,
  start_at: isoDate,
  end_at: isoDate,
  status: z.enum(['draft', 'upcoming', 'ongoing', 'judging', 'completed', 'cancelled']).default('draft'),
  categories: z.array(categoryInput).max(20).default([]),
  rewards: z.array(rewardInput).max(50).default([]),
});

hackathonsRouter.post('/', requireAuth, validateBody(hackathonInput), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof hackathonInput>;

    // team_size_range and hackathon_dates_ordered would reject these; a clear
    // message beats a constraint name.
    if (body.max_team_size < body.min_team_size) {
      return next(badRequest('Maximum team size cannot be smaller than the minimum'));
    }
    if (body.start_at && body.end_at && new Date(body.end_at) < new Date(body.start_at)) {
      return next(badRequest('The end date cannot be before the start date'));
    }
    if (body.submissions_open_at && body.submissions_close_at &&
        new Date(body.submissions_close_at) < new Date(body.submissions_open_at)) {
      return next(badRequest('Submissions cannot close before they open'));
    }

    const id = generateId('hack');

    // Hackathon, categories and rewards land together. hackquest created them
    // in separate calls, so a failure left an event with no categories.
    await withTransaction(async (client) => {
      await repo.insertHackathon(client, id, req.user!.userId, {
        ...body,
        banner_url: body.banner_url ?? null,
        hero_video_url: body.hero_video_url ?? null,
        submissions_open_at: body.submissions_open_at ?? null,
        submissions_close_at: body.submissions_close_at ?? null,
        start_at: body.start_at ?? null,
        end_at: body.end_at ?? null,
      });

      const categoryIds: string[] = [];
      for (const c of body.categories) {
        const cid = generateId('cat');
        categoryIds.push(cid);
        await repo.insertCategory(client, cid, id, c);
      }
      for (const r of body.rewards) {
        await repo.insertReward(client, generateId('rwd'), id, {
          ...r,
          category_id: r.category_index != null ? (categoryIds[r.category_index] ?? null) : null,
        });
      }
    });

    const created = await repo.getHackathon(id);
    res.status(201).json({ success: true, data: toHackathonDto(created!) });
  } catch (err) {
    next(err);
  }
});

hackathonsRouter.put('/:hackathonId', requireAuth,
  validateBody(hackathonInput.partial().omit({ categories: true, rewards: true })),
  async (req, res, next) => {
    try {
      const id = param(req, 'hackathonId');
      await loadAsOrganizer(id, req.user!.userId);
      const updated = await repo.updateHackathon(id, req.user!.userId, req.body);
      if (!updated) return next(notFound('Hackathon not found'));
      ok(res, toHackathonDto(updated));
    } catch (err) {
      next(err);
    }
  });

hackathonsRouter.delete('/:hackathonId', requireAuth, async (req, res, next) => {
  try {
    const deleted = await repo.deleteHackathon(param(req, 'hackathonId'), req.user!.userId);
    if (!deleted) return next(notFound('Hackathon not found'));
    res.json({ success: true, message: 'Hackathon deleted' });
  } catch (err) {
    next(err);
  }
});

// --- Registration ----------------------------------------------------------

hackathonsRouter.post('/:hackathonId/register', requireAuth,
  validateBody(z.object({ displayName: z.string().max(200).default('') }).passthrough()),
  async (req, res, next) => {
    try {
      const id = param(req, 'hackathonId');
      const h = await repo.getHackathon(id);
      if (!h || h.status === 'draft') return next(notFound('Hackathon not found'));
      if (h.status === 'completed' || h.status === 'cancelled') {
        return next(conflict('Registration for this hackathon has closed'));
      }

      await withTransaction(async (client) => {
        await repo.upsertParticipant(client, req.user!.userId, req.body.displayName ?? '');
        await repo.register(client, id, req.user!.userId);
      });

      ok(res, { hackathon_id: id, registered: true });
    } catch (err) {
      next(err);
    }
  });

hackathonsRouter.get('/:hackathonId/participants', attachUser, async (req, res, next) => {
  try {
    const id = param(req, 'hackathonId');
    const h = await repo.getHackathon(id);
    if (!h) return next(notFound('Hackathon not found'));

    const { rows } = await (await import('../../db/pool.js')).query<{
      user_id: string; email: string; display_name: string | null; registered_at: Date;
    }>(
      `SELECT r.user_id, u.email::text AS email, p.display_name, r.registered_at
         FROM hackathon_registrations r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN hackathon_participants p ON p.user_id = r.user_id
        WHERE r.hackathon_id = $1 ORDER BY r.registered_at`,
      [id],
    );

    ok(res, rows.map((r) => ({
      user_id: r.user_id,
      email: r.email,
      display_name: r.display_name ?? '',
      joined_at: r.registered_at,
    })));
  } catch (err) {
    next(err);
  }
});

// --- Teams -----------------------------------------------------------------

hackathonsRouter.get('/:hackathonId/teams', async (req, res, next) => {
  try {
    const categoryId = typeof req.query.category_id === 'string' ? req.query.category_id : undefined;
    const teams = await repo.listTeams(param(req, 'hackathonId'), categoryId);
    const withMembers = await Promise.all(teams.map(async (t) => ({
      ...toTeamDto(t),
      members: (await repo.getTeamMembers(t.id)).map((m) => ({
        user_id: m.user_id, email: m.email, display_name: m.display_name ?? '',
        accepted: m.accepted, invited_at: m.invited_at, accepted_at: m.accepted_at,
      })),
    })));
    ok(res, withMembers);
  } catch (err) {
    next(err);
  }
});

export const teamsRouter = Router();
teamsRouter.use(requireAuth);

teamsRouter.post('/', validateBody(z.object({
  hackathon_id: z.string().min(1),
  name: z.string().min(1).max(200),
  category_id: z.string().nullish(),
  // Invite by email: the caller has no way to know another person's user id.
  invite_emails: z.array(z.string().email()).max(20).default([]),
})), async (req, res, next) => {
  try {
    const h = await repo.getHackathon(req.body.hackathon_id);
    if (!h || h.status === 'draft') return next(notFound('Hackathon not found'));
    if (!(await repo.isRegistered(h.id, req.user!.userId))) {
      return next(conflict('Register for the hackathon before creating a team'));
    }
    // UNIQUE (hackathon_id, user_id) on members backs this up.
    if (await repo.teamForUser(h.id, req.user!.userId)) {
      return next(conflict('You are already on a team for this hackathon'));
    }

    const invitees: string[] = [];
    if (req.body.invite_emails.length > 0) {
      const { rows } = await (await import('../../db/pool.js')).query<{ id: string }>(
        'SELECT id FROM users WHERE email = ANY($1::citext[])', [req.body.invite_emails]);
      invitees.push(...rows.map((r) => r.id).filter((uid) => uid !== req.user!.userId));
    }

    if (invitees.length + 1 > h.max_team_size) {
      return next(badRequest(`Teams in this hackathon may have at most ${h.max_team_size} members`));
    }

    const teamId = generateId('team');
    await withTransaction(async (client) => {
      await repo.insertTeam(client, teamId, h.id, {
        name: req.body.name,
        categoryId: req.body.category_id ?? null,
        leaderId: req.user!.userId,
      });
      // The leader is a member, already accepted.
      await repo.addTeamMember(client, teamId, h.id, req.user!.userId, true);
      for (const uid of invitees) {
        await repo.addTeamMember(client, teamId, h.id, uid, false);
      }
    });

    const team = await repo.getTeam(teamId);
    res.status(201).json({
      success: true,
      data: { ...toTeamDto(team!), members: (await repo.getTeamMembers(teamId)).map((m) => ({
        user_id: m.user_id, email: m.email, accepted: m.accepted,
      })) },
    });
  } catch (err) {
    next(err);
  }
});

teamsRouter.get('/invitations', async (req, res, next) => {
  try {
    const rows = await repo.listInvitations(req.user!.userId);
    ok(res, rows.map((r) => ({
      team_id: r.team_id,
      team_name: r.team_name,
      hackathon_id: r.hackathon_id,
      hackathon_title: r.hackathon_title,
      invited_at: r.invited_at,
    })));
  } catch (err) {
    next(err);
  }
});

teamsRouter.post('/respond', validateBody(z.object({
  team_id: z.string().min(1),
  accept: z.boolean(),
})), async (req, res, next) => {
  try {
    const team = await repo.getTeam(req.body.team_id);
    if (!team) return next(notFound('Team not found'));

    // Accepting a second invitation in the same hackathon would violate
    // UNIQUE (hackathon_id, user_id); say so rather than surfacing a constraint.
    if (req.body.accept) {
      const existing = await repo.teamForUser(team.hackathon_id, req.user!.userId);
      if (existing && existing.id !== team.id) {
        return next(conflict('You are already on another team for this hackathon'));
      }
      const members = await repo.getTeamMembers(team.id);
      const h = await repo.getHackathon(team.hackathon_id);
      if (h && members.filter((m) => m.accepted).length >= h.max_team_size) {
        return next(conflict('That team is already full'));
      }
    }

    const done = await repo.respondToInvite(team.id, req.user!.userId, req.body.accept);
    if (!done) return next(notFound('No pending invitation found'));

    ok(res, { team_id: team.id, accepted: req.body.accept });
  } catch (err) {
    next(err);
  }
});

teamsRouter.post('/:teamId/category', validateBody(z.object({
  category_id: z.string().nullish(),
})), async (req, res, next) => {
  try {
    const teamId = param(req, 'teamId');
    const updated = await repo.setTeamCategory(teamId, req.user!.userId, req.body.category_id ?? null);
    // Not the leader, or no such team — one answer either way.
    if (!updated) return next(notFound('Team not found, or you are not its leader'));
    ok(res, toTeamDto(updated));
  } catch (err) {
    next(err);
  }
});

// --- Submissions -----------------------------------------------------------

export const submissionsRouter = Router();

submissionsRouter.get('/', async (req, res, next) => {
  try {
    const hackathonId = typeof req.query.hackathon_id === 'string' ? req.query.hackathon_id : undefined;
    if (!hackathonId) return ok(res, []);
    const categoryId = typeof req.query.category_id === 'string' ? req.query.category_id : undefined;
    ok(res, (await repo.listSubmissions(hackathonId, categoryId)).map(toSubmissionDto));
  } catch (err) {
    next(err);
  }
});

submissionsRouter.get('/:submissionId', async (req, res, next) => {
  try {
    const s = await repo.getSubmission(param(req, 'submissionId'));
    if (!s) return next(notFound('Submission not found'));
    ok(res, toSubmissionDto(s));
  } catch (err) {
    next(err);
  }
});

const submissionInput = z.object({
  hackathon_id: z.string().min(1),
  category_id: z.string().nullish(),
  title: z.string().min(1).max(300),
  summary: z.string().max(4000).default(''),
  description: z.string().max(20000).default(''),
  repo_url: z.string().max(2000).nullish(),
  demo_url: z.string().max(2000).nullish(),
  gallery: z.array(z.string().max(2000)).max(30).default([]),
  status: z.enum(['draft', 'submitted']).default('submitted'),
});

submissionsRouter.post('/', requireAuth, validateBody(submissionInput), async (req, res, next) => {
  try {
    const h = await repo.getHackathon(req.body.hackathon_id);
    if (!h) return next(notFound('Hackathon not found'));

    const team = await repo.teamForUser(h.id, req.user!.userId);
    if (!team) return next(conflict('Join a team before submitting a project'));

    // UNIQUE (team_id): one submission per team.
    if (await repo.getSubmissionByTeam(team.id)) {
      return next(conflict('Your team has already submitted a project'));
    }
    // hackquest checked the window on create but not on update.
    if (req.body.status === 'submitted' && !submissionsOpen(h)) {
      return next(conflict('Submissions are not open for this hackathon'));
    }

    const id = generateId('sub');
    await withTransaction(async (client) => {
      await repo.insertSubmission(client, id, {
        hackathonId: h.id,
        teamId: team.id,
        categoryId: req.body.category_id ?? team.category_id,
        title: req.body.title,
        summary: req.body.summary,
        description: req.body.description,
        repoUrl: req.body.repo_url ?? null,
        demoUrl: req.body.demo_url ?? null,
        gallery: req.body.gallery,
        status: req.body.status,
      });
    });

    res.status(201).json({ success: true, data: toSubmissionDto((await repo.getSubmission(id))!) });
  } catch (err) {
    next(err);
  }
});

submissionsRouter.put('/:submissionId', requireAuth,
  validateBody(submissionInput.partial().omit({ hackathon_id: true })),
  async (req, res, next) => {
    try {
      const s = await repo.getSubmission(param(req, 'submissionId'));
      if (!s) return next(notFound('Submission not found'));

      const team = await repo.teamForUser(s.hackathon_id, req.user!.userId);
      if (!team || team.id !== s.team_id) {
        return next(forbidden('Only your own team can edit this submission'));
      }

      const h = await repo.getHackathon(s.hackathon_id);
      // The gap hackquest left: editing after the deadline was unchecked.
      if (h && !submissionsOpen(h)) {
        return next(conflict('Submissions are closed and can no longer be edited'));
      }

      const updated = await repo.updateSubmission(s.id, {
        title: req.body.title,
        summary: req.body.summary,
        description: req.body.description,
        repoUrl: req.body.repo_url,
        demoUrl: req.body.demo_url,
        gallery: req.body.gallery,
        categoryId: req.body.category_id,
        status: req.body.status,
      });
      ok(res, toSubmissionDto(updated!));
    } catch (err) {
      next(err);
    }
  });

// --- Winners ---------------------------------------------------------------

hackathonsRouter.get('/:hackathonId/winners', async (req, res, next) => {
  try {
    ok(res, (await repo.listWinners(param(req, 'hackathonId'))).map(toRewardDto));
  } catch (err) {
    next(err);
  }
});

hackathonsRouter.post('/:hackathonId/winners', requireAuth, validateBody(z.object({
  reward_id: z.string().min(1),
  submission_id: z.string().min(1),
  note: z.string().max(2000).nullish(),
})), async (req, res, next) => {
  try {
    const h = await loadAsOrganizer(param(req, 'hackathonId'), req.user!.userId);

    const reward = await repo.getReward(req.body.reward_id);
    if (!reward || reward.hackathon_id !== h.id) return next(notFound('Reward not found'));

    const submission = await repo.getSubmission(req.body.submission_id);
    if (!submission || submission.hackathon_id !== h.id) {
      return next(badRequest('That submission is not part of this hackathon'));
    }

    const updated = await repo.assignWinner(
      reward.id, submission.id, submission.team_id, req.user!.userId, req.body.note ?? null);
    ok(res, toRewardDto(updated!));
  } catch (err) {
    next(err);
  }
});
