/**
 * Jobs and hackathons integration tests.
 *
 * The authorization cases matter most: the old routes took freelancerId,
 * userId and email from the request body, so anyone could bid, post or accept
 * as anyone else. Identity now comes only from the session.
 */
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { query } from '../../db/pool.js';

const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

const app = createApp();
const PASSWORD = 'CorrectHorse1';
const created: string[] = [];

let seq = 0;
const freshEmail = () => `p4-${process.pid}-${Date.now()}-${seq++}@example.test`;

async function signedInUser() {
  const email = freshEmail();
  created.push(email);
  await request(app).post('/api/auth/signup').send({ email, password: PASSWORD });
  const { rows } = await query<{ code: string }>(
    'SELECT code FROM otp_codes WHERE email = $1', [email]);
  const verify = await request(app)
    .post('/api/auth/verify-otp').send({ email, otp: rows[0]!.code });
  const cookie = (verify.headers['set-cookie'] as unknown as string[])[0]!;
  const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
  return { email, cookie, userId: me.body.session.userId as string };
}

afterAll(async () => {
  if (created.length > 0) {
    // job_posts.freelancer_id is ON DELETE SET NULL, so jobs do not block the
    // user delete — but hackathons.organizer_id is RESTRICT and must go first.
    await query(
      `DELETE FROM hackathons WHERE organizer_id IN (SELECT id FROM users WHERE email = ANY($1::citext[]))`,
      [created]);
    await query('DELETE FROM otp_codes WHERE email = ANY($1::citext[])', [created]);
    await query('DELETE FROM users WHERE email = ANY($1::citext[])', [created]);
  }
});

const jobBody = (over: Record<string, unknown> = {}) => ({
  title: 'Build an API',
  description: 'Node and Postgres work',
  required_skills: ['node', 'postgres'],
  budget_type: 'fixed',
  budget_minor: 500000,
  ...over,
});

async function createJob(cookie: string, over: Record<string, unknown> = {}) {
  const res = await request(app).post('/api/job-posts').set('Cookie', cookie).send(jobBody(over));
  expect(res.status).toBe(201);
  return res.body.data;
}

d('job posts', () => {
  it('creates a job from the session, ignoring any userId in the body', async () => {
    const client = await signedInUser();
    const attacker = await signedInUser();

    const res = await request(app).post('/api/job-posts').set('Cookie', attacker.cookie)
      // The old route trusted this. It must be ignored.
      .send({ ...jobBody(), userId: client.userId });
    expect(res.status).toBe(201);
    expect(res.body.data.clientId).toBe(attacker.userId);
  });

  it('accepts the legacy { userId, jobData } envelope', async () => {
    const client = await signedInUser();
    const res = await request(app).post('/api/job-posts').set('Cookie', client.cookie).send({
      userId: 'ignored',
      jobData: { title: 'Legacy shape', description: 'x', skills: ['go'], budget: 1000 },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Legacy shape');
    expect(res.body.data.requiredSkills).toEqual(['go']);
  });

  it('lists only open jobs publicly, all of their own to the owner', async () => {
    const client = await signedInUser();
    const job = await createJob(client.cookie, { title: 'Zzyzx-job-marker' });

    const open = await request(app).get('/api/job-posts?limit=100');
    expect(open.body.data.some((j: { id: string }) => j.id === job.id)).toBe(true);
    expect(typeof open.body.total).toBe('number');

    const mine = await request(app)
      .get(`/api/job-posts?client_id=${client.userId}`).set('Cookie', client.cookie);
    expect(mine.body.data.length).toBeGreaterThan(0);
  });

  it('filters by skill', async () => {
    const client = await signedInUser();
    await createJob(client.cookie, { required_skills: ['zzyzx-rare-skill'] });

    const hit = await request(app).get('/api/job-posts?skills=zzyzx-rare-skill');
    expect(hit.body.data.length).toBeGreaterThan(0);

    const miss = await request(app).get('/api/job-posts?skills=nothing-matches-this');
    expect(miss.body.data).toHaveLength(0);
  });

  it('will not let a stranger edit or withdraw a job', async () => {
    const client = await signedInUser();
    const attacker = await signedInUser();
    const job = await createJob(client.cookie);

    const edit = await request(app).put(`/api/job-posts/${job.id}`)
      .set('Cookie', attacker.cookie).send({ title: 'Hijacked' });
    expect(edit.status).toBe(403);

    const del = await request(app).delete(`/api/job-posts/${job.id}`).set('Cookie', attacker.cookie);
    expect(del.status).toBe(404);

    const still = await request(app).get(`/api/job-posts/${job.id}`);
    expect(still.body.data.title).toBe('Build an API');
  });

  describe('bidding', () => {
    it('accepts one bid per freelancer and refuses a second', async () => {
      const client = await signedInUser();
      const freelancer = await signedInUser();
      const job = await createJob(client.cookie);

      const first = await request(app).post(`/api/job-posts/${job.id}/bid`)
        .set('Cookie', freelancer.cookie)
        .send({ coverLetter: 'I can do this', bidAmount: 450000, deliveryDays: 14 });
      expect(first.status).toBe(201);
      expect(first.body.data.freelancerId).toBe(freelancer.userId);

      // UNIQUE (job_id, freelancer_id); the canister allowed duplicates.
      const second = await request(app).post(`/api/job-posts/${job.id}/bid`)
        .set('Cookie', freelancer.cookie)
        .send({ coverLetter: 'Again', bidAmount: 400000, deliveryDays: 10 });
      expect(second.status).toBe(409);
    });

    it('refuses a bid on your own job', async () => {
      const client = await signedInUser();
      const job = await createJob(client.cookie);
      const res = await request(app).post(`/api/job-posts/${job.id}/bid`)
        .set('Cookie', client.cookie).send({ bidAmount: 1, deliveryDays: 1 });
      expect(res.status).toBe(400);
    });

    it('bids as the session user, not a body-supplied freelancerId', async () => {
      const client = await signedInUser();
      const freelancer = await signedInUser();
      const victim = await signedInUser();
      const job = await createJob(client.cookie);

      const res = await request(app).post(`/api/job-posts/${job.id}/bid`)
        .set('Cookie', freelancer.cookie)
        .send({ freelancerId: victim.userId, email: victim.email,
                coverLetter: 'x', bidAmount: 1000, deliveryDays: 5 });
      expect(res.status).toBe(201);
      expect(res.body.data.freelancerId).toBe(freelancer.userId);
    });

    it('shows all bids to the job owner and only their own to a bidder', async () => {
      const client = await signedInUser();
      const a = await signedInUser();
      const b = await signedInUser();
      const job = await createJob(client.cookie);

      for (const f of [a, b]) {
        await request(app).post(`/api/job-posts/${job.id}/bid`)
          .set('Cookie', f.cookie).send({ coverLetter: 'bid', bidAmount: 1000, deliveryDays: 5 });
      }

      const asOwner = await request(app).get(`/api/job-posts/${job.id}`).set('Cookie', client.cookie);
      expect(asOwner.body.data.proposals).toHaveLength(2);

      // Competing bids are commercially sensitive.
      const asBidder = await request(app).get(`/api/job-posts/${job.id}`).set('Cookie', a.cookie);
      expect(asBidder.body.data.proposals).toHaveLength(1);
      expect(asBidder.body.data.proposals[0].freelancerId).toBe(a.userId);

      const anon = await request(app).get(`/api/job-posts/${job.id}`);
      expect(anon.body.data.proposals).toHaveLength(0);
    });
  });

  describe('lifecycle', () => {
    async function withBid() {
      const client = await signedInUser();
      const freelancer = await signedInUser();
      const job = await createJob(client.cookie);
      const bid = await request(app).post(`/api/job-posts/${job.id}/bid`)
        .set('Cookie', freelancer.cookie)
        .send({ coverLetter: 'x', bidAmount: 1000, deliveryDays: 5 });
      return { client, freelancer, job, proposalId: bid.body.data.id as string };
    }

    it('accepts a proposal, assigns the job and rejects the others in one transaction', async () => {
      const { client, freelancer, job, proposalId } = await withBid();
      const other = await signedInUser();
      await request(app).post(`/api/job-posts/${job.id}/bid`)
        .set('Cookie', other.cookie).send({ coverLetter: 'y', bidAmount: 900, deliveryDays: 4 });

      const res = await request(app).post('/api/accept-proposal')
        .set('Cookie', client.cookie).send({ proposalId });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ASSIGNED');
      expect(res.body.data.freelancerId).toBe(freelancer.userId);

      const full = await request(app).get(`/api/job-posts/${job.id}`).set('Cookie', client.cookie);
      const statuses = full.body.data.proposals.map((p: { status: string }) => p.status).sort();
      expect(statuses).toEqual(['ACCEPTED', 'REJECTED']);
    });

    it('lets only the job owner accept a proposal', async () => {
      const { freelancer, proposalId } = await withBid();
      const res = await request(app).post('/api/accept-proposal')
        .set('Cookie', freelancer.cookie).send({ proposalId });
      expect(res.status).toBe(403);
    });

    it('refuses a second assignment', async () => {
      const { client, proposalId } = await withBid();
      await request(app).post('/api/accept-proposal').set('Cookie', client.cookie).send({ proposalId });
      const again = await request(app).post('/api/accept-proposal')
        .set('Cookie', client.cookie).send({ proposalId });
      expect(again.status).toBe(409);
    });

    it('walks assigned -> completed, by the client only', async () => {
      const { client, freelancer, job, proposalId } = await withBid();
      await request(app).post('/api/accept-proposal').set('Cookie', client.cookie).send({ proposalId });

      // A freelancer marking their own job complete would trigger payment.
      const byFreelancer = await request(app)
        .post(`/api/job-posts/${job.id}/complete`).set('Cookie', freelancer.cookie);
      expect(byFreelancer.status).toBe(403);

      const done = await request(app).post(`/api/job-posts/${job.id}/complete`).set('Cookie', client.cookie);
      expect(done.body.data.status).toBe('COMPLETED');
      expect(done.body.data.completedAt).not.toBeNull();
    });

    it('no longer accepts a self-reported payment', async () => {
      const { client, job, proposalId } = await withBid();
      await request(app).post('/api/accept-proposal').set('Cookie', client.cookie).send({ proposalId });
      await request(app).post(`/api/job-posts/${job.id}/complete`).set('Cookie', client.cookie);

      // Retired in Phase 5: a client asserting "I paid" is not evidence that
      // money moved. Payment is recorded only by a signed provider webhook.
      const res = await request(app).post(`/api/job-posts/${job.id}/paid`).set('Cookie', client.cookie);
      expect(res.status).toBe(410);
      expect(res.body.code).toBe('GONE');
    });

    it('takes one review, after completion only', async () => {
      const { client, job, proposalId } = await withBid();
      await request(app).post('/api/accept-proposal').set('Cookie', client.cookie).send({ proposalId });

      const early = await request(app).post(`/api/job-posts/${job.id}/review`)
        .set('Cookie', client.cookie).send({ rating: 5 });
      expect(early.status).toBe(409);

      await request(app).post(`/api/job-posts/${job.id}/complete`).set('Cookie', client.cookie);

      const ok1 = await request(app).post(`/api/job-posts/${job.id}/review`)
        .set('Cookie', client.cookie).send({ rating: 5, comment: 'Great' });
      expect(ok1.status).toBe(200);
      expect(ok1.body.data.clientRating).toBe(5);

      const twice = await request(app).post(`/api/job-posts/${job.id}/review`)
        .set('Cookie', client.cookie).send({ rating: 1 });
      expect(twice.status).toBe(409);
    });

    it('will not let an assigned job be edited or withdrawn', async () => {
      const { client, job, proposalId } = await withBid();
      await request(app).post('/api/accept-proposal').set('Cookie', client.cookie).send({ proposalId });

      expect((await request(app).put(`/api/job-posts/${job.id}`)
        .set('Cookie', client.cookie).send({ title: 'Changed' })).status).toBe(409);
      // Deleting would erase the freelancer's work record.
      expect((await request(app).delete(`/api/job-posts/${job.id}`)
        .set('Cookie', client.cookie)).status).toBe(404);
    });

    it('refuses a bid once the job is assigned', async () => {
      const { client, job, proposalId } = await withBid();
      await request(app).post('/api/accept-proposal').set('Cookie', client.cookie).send({ proposalId });

      const late = await signedInUser();
      const res = await request(app).post(`/api/job-posts/${job.id}/bid`)
        .set('Cookie', late.cookie).send({ bidAmount: 1, deliveryDays: 1 });
      expect(res.status).toBe(409);
    });
  });
});

const hackathonBody = (over: Record<string, unknown> = {}) => ({
  title: 'Build Week',
  tagline: 'Ship something',
  summary: 'A week of building',
  min_team_size: 1,
  max_team_size: 3,
  status: 'ongoing',
  submissions_open_at: new Date(Date.now() - 86_400_000).toISOString(),
  submissions_close_at: new Date(Date.now() + 86_400_000).toISOString(),
  categories: [{ name: 'Open', description: 'Anything' }],
  rewards: [{ title: 'First prize', rank: 1, amount_minor: 100000, category_index: 0 }],
  ...over,
});

async function createHackathon(cookie: string, over: Record<string, unknown> = {}) {
  const res = await request(app).post('/api/hackathons').set('Cookie', cookie).send(hackathonBody(over));
  expect(res.status).toBe(201);
  return res.body.data;
}

d('hackathons', () => {
  it('creates a hackathon with categories and rewards in one transaction', async () => {
    const organizer = await signedInUser();
    const h = await createHackathon(organizer.cookie);

    const full = await request(app).get(`/api/hackathons/${h.id}`);
    expect(full.body.data.categories).toHaveLength(1);
    expect(full.body.data.rewards).toHaveLength(1);
    // The reward resolved to the category created alongside it.
    expect(full.body.data.rewards[0].category_id).toBe(full.body.data.categories[0].id);
    expect(full.body.data.submissions_open).toBe(true);
  });

  it('rejects contradictory sizes and dates', async () => {
    const organizer = await signedInUser();

    const sizes = await request(app).post('/api/hackathons').set('Cookie', organizer.cookie)
      .send(hackathonBody({ min_team_size: 5, max_team_size: 2 }));
    expect(sizes.status).toBe(400);

    const dates = await request(app).post('/api/hackathons').set('Cookie', organizer.cookie)
      .send(hackathonBody({
        start_at: new Date(Date.now() + 86_400_000).toISOString(),
        end_at: new Date(Date.now() - 86_400_000).toISOString(),
      }));
    expect(dates.status).toBe(400);
  });

  it('hides a draft from everyone but its organiser', async () => {
    const organizer = await signedInUser();
    const stranger = await signedInUser();
    const h = await createHackathon(organizer.cookie, { status: 'draft' });

    expect((await request(app).get(`/api/hackathons/${h.id}`).set('Cookie', stranger.cookie)).status).toBe(404);
    expect((await request(app).get(`/api/hackathons/${h.id}`).set('Cookie', organizer.cookie)).status).toBe(200);

    const list = await request(app).get('/api/hackathons?limit=100');
    expect(list.body.hackathons.some((x: { id: string }) => x.id === h.id)).toBe(false);
  });

  it('lets only the organiser edit or delete', async () => {
    const organizer = await signedInUser();
    const attacker = await signedInUser();
    const h = await createHackathon(organizer.cookie);

    expect((await request(app).put(`/api/hackathons/${h.id}`)
      .set('Cookie', attacker.cookie).send({ title: 'Hijacked' })).status).toBe(403);
    expect((await request(app).delete(`/api/hackathons/${h.id}`)
      .set('Cookie', attacker.cookie)).status).toBe(404);
  });

  it('keeps the list envelope hackquest used', async () => {
    const res = await request(app).get('/api/hackathons?limit=5');
    expect(res.body.success).toBe(true);
    // Pages read `hackathons`; `data` is there for new callers.
    expect(Array.isArray(res.body.hackathons)).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  describe('teams', () => {
    async function registered() {
      const organizer = await signedInUser();
      const h = await createHackathon(organizer.cookie);
      const leader = await signedInUser();
      await request(app).post(`/api/hackathons/${h.id}/register`)
        .set('Cookie', leader.cookie).send({ displayName: 'Leader' });
      return { organizer, h, leader };
    }

    it('requires registration before creating a team', async () => {
      const organizer = await signedInUser();
      const h = await createHackathon(organizer.cookie);
      const stranger = await signedInUser();

      const res = await request(app).post('/api/teams').set('Cookie', stranger.cookie)
        .send({ hackathon_id: h.id, name: 'Team A' });
      expect(res.status).toBe(409);
    });

    it('creates a team with the leader already a member', async () => {
      const { h, leader } = await registered();
      const res = await request(app).post('/api/teams').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, name: 'Team A' });
      expect(res.status).toBe(201);
      expect(res.body.data.leader_id).toBe(leader.userId);
      expect(res.body.data.members).toHaveLength(1);
      expect(res.body.data.members[0].accepted).toBe(true);
    });

    it('allows one team per person per hackathon', async () => {
      const { h, leader } = await registered();
      await request(app).post('/api/teams').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, name: 'Team A' });

      const second = await request(app).post('/api/teams').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, name: 'Team B' });
      expect(second.status).toBe(409);
    });

    it('invites by email and handles accept and decline', async () => {
      const { h, leader } = await registered();
      const invitee = await signedInUser();
      await request(app).post(`/api/hackathons/${h.id}/register`)
        .set('Cookie', invitee.cookie).send({ displayName: 'Invitee' });

      const team = await request(app).post('/api/teams').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, name: 'Team A', invite_emails: [invitee.email] });
      expect(team.status).toBe(201);

      const invites = await request(app).get('/api/teams/invitations').set('Cookie', invitee.cookie);
      expect(invites.body.data).toHaveLength(1);
      expect(invites.body.data[0].team_name).toBe('Team A');

      const accept = await request(app).post('/api/teams/respond')
        .set('Cookie', invitee.cookie).send({ team_id: team.body.data.id, accept: true });
      expect(accept.status).toBe(200);

      const after = await request(app).get(`/api/hackathons/${h.id}/teams`);
      expect(after.body.data[0].members.filter((m: { accepted: boolean }) => m.accepted)).toHaveLength(2);
    });

    it('refuses to exceed max_team_size', async () => {
      const organizer = await signedInUser();
      const h = await createHackathon(organizer.cookie, { max_team_size: 1 });
      const leader = await signedInUser();
      const other = await signedInUser();
      await request(app).post(`/api/hackathons/${h.id}/register`).set('Cookie', leader.cookie).send({});

      const res = await request(app).post('/api/teams').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, name: 'Too big', invite_emails: [other.email] });
      expect(res.status).toBe(400);
    });

    it('lets only the leader change the category', async () => {
      const { h, leader } = await registered();
      const stranger = await signedInUser();
      const team = await request(app).post('/api/teams').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, name: 'Team A' });

      const full = await request(app).get(`/api/hackathons/${h.id}`);
      const categoryId = full.body.data.categories[0].id;

      const byStranger = await request(app).post(`/api/teams/${team.body.data.id}/category`)
        .set('Cookie', stranger.cookie).send({ category_id: categoryId });
      expect(byStranger.status).toBe(404);

      const byLeader = await request(app).post(`/api/teams/${team.body.data.id}/category`)
        .set('Cookie', leader.cookie).send({ category_id: categoryId });
      expect(byLeader.status).toBe(200);
      expect(byLeader.body.data.category_id).toBe(categoryId);
    });
  });

  describe('submissions', () => {
    async function withTeam(hackathonOver: Record<string, unknown> = {}) {
      const organizer = await signedInUser();
      const h = await createHackathon(organizer.cookie, hackathonOver);
      const leader = await signedInUser();
      await request(app).post(`/api/hackathons/${h.id}/register`).set('Cookie', leader.cookie).send({});
      const team = await request(app).post('/api/teams').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, name: `Team ${Date.now()}` });
      return { organizer, h, leader, teamId: team.body.data.id as string };
    }

    it('requires a team', async () => {
      const organizer = await signedInUser();
      const h = await createHackathon(organizer.cookie);
      const loner = await signedInUser();
      await request(app).post(`/api/hackathons/${h.id}/register`).set('Cookie', loner.cookie).send({});

      const res = await request(app).post('/api/submissions').set('Cookie', loner.cookie)
        .send({ hackathon_id: h.id, title: 'Solo' });
      expect(res.status).toBe(409);
    });

    it('accepts one submission per team', async () => {
      const { h, leader } = await withTeam();

      const first = await request(app).post('/api/submissions').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, title: 'Our project', repo_url: 'https://example.test/repo' });
      expect(first.status).toBe(201);
      expect(first.body.data.status).toBe('submitted');
      expect(first.body.data.submitted_at).not.toBeNull();

      const second = await request(app).post('/api/submissions').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, title: 'Another' });
      expect(second.status).toBe(409);
    });

    it('refuses a submission outside the window', async () => {
      const { h, leader } = await withTeam({
        submissions_open_at: new Date(Date.now() - 172_800_000).toISOString(),
        submissions_close_at: new Date(Date.now() - 86_400_000).toISOString(),
      });

      const res = await request(app).post('/api/submissions').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, title: 'Late' });
      expect(res.status).toBe(409);
    });

    it('refuses an edit after the window closes — the gap hackquest left', async () => {
      const { h, leader, organizer } = await withTeam();

      const created = await request(app).post('/api/submissions').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, title: 'On time' });
      expect(created.status).toBe(201);

      // Close the window.
      await request(app).put(`/api/hackathons/${h.id}`).set('Cookie', organizer.cookie)
        .send({ submissions_close_at: new Date(Date.now() - 1000).toISOString() });

      // hackquest checked the deadline on create but not on update.
      const late = await request(app).put(`/api/submissions/${created.body.data.id}`)
        .set('Cookie', leader.cookie).send({ title: 'Sneaky rewrite' });
      expect(late.status).toBe(409);
    });

    it("will not let another team edit a submission", async () => {
      const { h, leader } = await withTeam();
      const created = await request(app).post('/api/submissions').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, title: 'Ours' });

      const rival = await signedInUser();
      await request(app).post(`/api/hackathons/${h.id}/register`).set('Cookie', rival.cookie).send({});
      await request(app).post('/api/teams').set('Cookie', rival.cookie)
        .send({ hackathon_id: h.id, name: 'Rivals' });

      const res = await request(app).put(`/api/submissions/${created.body.data.id}`)
        .set('Cookie', rival.cookie).send({ title: 'Stolen' });
      expect(res.status).toBe(403);
    });
  });

  describe('winners', () => {
    it('lets only the organiser assign, and lists them', async () => {
      const organizer = await signedInUser();
      const h = await createHackathon(organizer.cookie);
      const leader = await signedInUser();
      await request(app).post(`/api/hackathons/${h.id}/register`).set('Cookie', leader.cookie).send({});
      await request(app).post('/api/teams').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, name: 'Winners' });
      const submission = await request(app).post('/api/submissions').set('Cookie', leader.cookie)
        .send({ hackathon_id: h.id, title: 'Winning entry' });

      const full = await request(app).get(`/api/hackathons/${h.id}`);
      const rewardId = full.body.data.rewards[0].id;

      const byLeader = await request(app).post(`/api/hackathons/${h.id}/winners`)
        .set('Cookie', leader.cookie)
        .send({ reward_id: rewardId, submission_id: submission.body.data.id });
      expect(byLeader.status).toBe(403);

      const byOrganizer = await request(app).post(`/api/hackathons/${h.id}/winners`)
        .set('Cookie', organizer.cookie)
        .send({ reward_id: rewardId, submission_id: submission.body.data.id, note: 'Excellent' });
      expect(byOrganizer.status).toBe(200);
      expect(byOrganizer.body.data.awarded_submission_id).toBe(submission.body.data.id);

      const winners = await request(app).get(`/api/hackathons/${h.id}/winners`);
      expect(winners.body.data).toHaveLength(1);
    });

    it('refuses a submission from a different hackathon', async () => {
      const organizer = await signedInUser();
      const h1 = await createHackathon(organizer.cookie);
      const h2 = await createHackathon(organizer.cookie, { title: 'Other event' });

      const leader = await signedInUser();
      await request(app).post(`/api/hackathons/${h2.id}/register`).set('Cookie', leader.cookie).send({});
      await request(app).post('/api/teams').set('Cookie', leader.cookie)
        .send({ hackathon_id: h2.id, name: 'Elsewhere' });
      const submission = await request(app).post('/api/submissions').set('Cookie', leader.cookie)
        .send({ hackathon_id: h2.id, title: 'Other entry' });

      const full = await request(app).get(`/api/hackathons/${h1.id}`);
      const res = await request(app).post(`/api/hackathons/${h1.id}/winners`)
        .set('Cookie', organizer.cookie)
        .send({ reward_id: full.body.data.rewards[0].id, submission_id: submission.body.data.id });
      expect(res.status).toBe(400);
    });
  });

  it('reports user stats', async () => {
    const organizer = await signedInUser();
    const h = await createHackathon(organizer.cookie);
    const participant = await signedInUser();
    await request(app).post(`/api/hackathons/${h.id}/register`).set('Cookie', participant.cookie).send({});
    await request(app).post('/api/teams').set('Cookie', participant.cookie)
      .send({ hackathon_id: h.id, name: `Stats ${Date.now()}` });

    const res = await request(app).get('/api/hackathons/stats').set('Cookie', participant.cookie);
    expect(res.body.data.hackathons_joined).toBe(1);
    expect(res.body.data.teams).toBe(1);
    expect(res.body.data.submissions).toBe(0);
  });
});
