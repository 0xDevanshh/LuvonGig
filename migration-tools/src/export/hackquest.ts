/**
 * Exports hackathons and everything hanging off them from the hackquest
 * canister: categories, reward tiers, participants, teams and submissions.
 *
 * IDENTITY: hackquest keys every actor by Principal — organiser, team leader,
 * team member, winner. Principals stop meaning anything once the canisters are
 * gone, so each one is exported as text and resolved to a real user at import
 * time via the email that `Participant` already carries. Principals with no
 * matching participant record cannot be resolved and are reported by the
 * import rather than silently dropped.
 */
import { config } from '../config.js';
import { getHackquestActor, withRetry } from '../lib/agent.js';
import { opt, nsToIso, optNsToIso, variantTag, toBigInt, toNumber, principalToText } from '../lib/candid.js';
import { writeExport } from '../lib/output.js';

export interface ExportedHackathon {
  id: string;
  organizerPrincipal: string | null;
  title: string;
  tagline: string;
  summary: string;
  bannerUrl: string;
  heroVideoUrl: string;
  location: string;
  theme: string;
  prizePoolE8s: string | null;
  faq: string[];
  resources: string[];
  minTeamSize: number;
  maxTeamSize: number;
  maxTeamsPerCategory: number;
  submissionsOpenAt: string | null;
  submissionsCloseAt: string | null;
  startAt: string | null;
  endAt: string | null;
  status: string | null;
  createdAt: string | null;
}

export interface ExportedCategory {
  id: string;
  hackathonId: string;
  name: string;
  description: string;
  rewardSlots: number;
  judgingCriteria: string[];
}

export interface ExportedReward {
  id: string;
  hackathonId: string;
  categoryId: string | null;
  title: string;
  description: string;
  amountE8s: string | null;
  rank: number;
  perks: string[];
  awardedSubmissionId: string | null;
  awardedTeamId: string | null;
  awardedByPrincipal: string | null;
  awardedAt: string | null;
  note: string | null;
}

export interface ExportedParticipant {
  hackathonId: string;
  principal: string | null;
  displayName: string;
  email: string;
  joinedAt: string | null;
}

export interface ExportedTeam {
  id: string;
  hackathonId: string;
  name: string;
  categoryId: string | null;
  leaderPrincipal: string | null;
  submissionId: string | null;
  createdAt: string | null;
  members: {
    principal: string | null;
    accepted: boolean;
    invitedAt: string | null;
    acceptedAt: string | null;
  }[];
}

export interface ExportedSubmission {
  id: string;
  hackathonId: string;
  teamId: string;
  categoryId: string;
  title: string;
  summary: string;
  description: string;
  repoUrl: string;
  demoUrl: string;
  gallery: string[];
  status: string | null;
  submittedAt: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function normaliseHackathon(raw: any): ExportedHackathon {
  return {
    id: raw.id,
    organizerPrincipal: principalToText(raw.organizer),
    title: raw.title ?? '',
    tagline: raw.tagline ?? '',
    summary: raw.summary ?? '',
    bannerUrl: raw.bannerUrl ?? '',
    heroVideoUrl: raw.heroVideoUrl ?? '',
    location: raw.location ?? '',
    theme: raw.theme ?? '',
    prizePoolE8s: toBigInt(raw.prizePool)?.toString() ?? null,
    faq: raw.faq ?? [],
    resources: raw.resources ?? [],
    minTeamSize: toNumber(raw.minTeamSize, 1),
    maxTeamSize: toNumber(raw.maxTeamSize, 5),
    maxTeamsPerCategory: toNumber(raw.maxTeamsPerCategory),
    submissionsOpenAt: nsToIso(raw.submissionsOpenAt),
    submissionsCloseAt: nsToIso(raw.submissionsCloseAt),
    startAt: nsToIso(raw.startAt),
    endAt: nsToIso(raw.endAt),
    status: variantTag(raw.status),
    createdAt: nsToIso(raw.createdAt),
  };
}

const normaliseCategory = (raw: any): ExportedCategory => ({
  id: raw.id,
  hackathonId: raw.hackathonId,
  name: raw.name ?? '',
  description: raw.description ?? '',
  rewardSlots: toNumber(raw.rewardSlots),
  judgingCriteria: raw.judgingCriteria ?? [],
});

const normaliseReward = (raw: any): ExportedReward => ({
  id: raw.id,
  hackathonId: raw.hackathonId,
  categoryId: opt<string>(raw.categoryId),
  title: raw.title ?? '',
  description: raw.description ?? '',
  amountE8s: toBigInt(raw.amount)?.toString() ?? null,
  rank: toNumber(raw.rank, 1),
  perks: raw.perks ?? [],
  awardedSubmissionId: opt<string>(raw.awardedSubmissionId),
  awardedTeamId: opt<string>(raw.awardedTeamId),
  awardedByPrincipal: principalToText(opt(raw.awardedBy)),
  awardedAt: optNsToIso(raw.awardedAt),
  note: opt<string>(raw.note),
});

const normaliseParticipant = (raw: any, hackathonId: string): ExportedParticipant => ({
  hackathonId,
  principal: principalToText(raw.principal),
  displayName: raw.displayName ?? '',
  email: raw.email ?? '',
  joinedAt: nsToIso(raw.joinedAt),
});

const normaliseTeam = (raw: any): ExportedTeam => ({
  id: raw.id,
  hackathonId: raw.hackathonId,
  name: raw.name ?? '',
  categoryId: opt<string>(raw.categoryId),
  leaderPrincipal: principalToText(raw.leader),
  submissionId: opt<string>(raw.submissionId),
  createdAt: nsToIso(raw.createdAt),
  members: (raw.members ?? []).map((m: any) => ({
    principal: principalToText(m.principal),
    accepted: Boolean(m.accepted),
    invitedAt: nsToIso(m.invitedAt),
    acceptedAt: optNsToIso(m.acceptedAt),
  })),
});

const normaliseSubmission = (raw: any): ExportedSubmission => ({
  id: raw.id,
  hackathonId: raw.hackathonId,
  teamId: raw.teamId,
  categoryId: raw.categoryId,
  title: raw.title ?? '',
  summary: raw.summary ?? '',
  description: raw.description ?? '',
  repoUrl: raw.repoUrl ?? '',
  demoUrl: raw.demoUrl ?? '',
  gallery: raw.gallery ?? [],
  status: variantTag(raw.status),
  submittedAt: nsToIso(raw.submittedAt),
});

const PAGE_SIZE = 100;

export async function exportHackquest(): Promise<void> {
  if (!config.canisters.hackquest) {
    console.log('Skipping hackquest: HACKQUEST_CANISTER_ID is not set.');
    return;
  }

  const actor = await getHackquestActor();
  const source = {
    canister: 'hackquest',
    canisterId: config.canisters.hackquest,
    host: config.icHost,
  };

  console.log('Exporting hackathons...');
  const hackathons: ExportedHackathon[] = [];
  let offset = 0;

  // listHackathons has no total; page until a short page comes back.
  for (;;) {
    const page = (await withRetry(`listHackathons(offset=${offset})`, () =>
      actor.listHackathons(BigInt(PAGE_SIZE), BigInt(offset), []),
    )) as any[];

    hackathons.push(...page.map(normaliseHackathon));
    if (page.length < PAGE_SIZE) break;
    offset += page.length;
  }
  console.log(`  ${hackathons.length} hackathon(s)`);
  await writeExport('hackathons', source, hackathons);

  const categories: ExportedCategory[] = [];
  const rewards: ExportedReward[] = [];
  const participants: ExportedParticipant[] = [];
  const teams: ExportedTeam[] = [];
  const submissions: ExportedSubmission[] = [];

  console.log('Exporting per-hackathon detail...');
  for (const [i, h] of hackathons.entries()) {
    // getHackathonDetails returns categories and rewards together.
    const details = opt<any>(
      await withRetry(`getHackathonDetails(${h.id})`, () => actor.getHackathonDetails(h.id)),
    );
    if (details) {
      categories.push(...(details.categories ?? []).map(normaliseCategory));
      rewards.push(...(details.rewards ?? []).map(normaliseReward));
    }

    const parts = (await withRetry(`listParticipantsForHackathon(${h.id})`, () =>
      actor.listParticipantsForHackathon(h.id),
    )) as any[];
    participants.push(...parts.map((p) => normaliseParticipant(p, h.id)));

    // categoryId is an opt filter; [] means "all".
    const ts = (await withRetry(`listTeams(${h.id})`, () => actor.listTeams(h.id, []))) as any[];
    teams.push(...ts.map(normaliseTeam));

    const subs = (await withRetry(`listSubmissions(${h.id})`, () =>
      actor.listSubmissions(h.id, []),
    )) as any[];
    submissions.push(...subs.map(normaliseSubmission));

    console.log(`  ...${i + 1}/${hackathons.length}`);
  }

  console.log(
    `  ${categories.length} categor(ies), ${rewards.length} reward(s), ` +
      `${participants.length} participant row(s), ${teams.length} team(s), ${submissions.length} submission(s)`,
  );

  await writeExport('hackathon_categories', source, categories);
  await writeExport('hackathon_rewards', source, rewards);
  await writeExport('hackathon_participants', source, participants);
  await writeExport('hackathon_teams', source, teams);
  await writeExport('hackathon_submissions', source, submissions);

  // Every principal the import will need to resolve to a real user.
  const principals = new Set<string>();
  for (const h of hackathons) if (h.organizerPrincipal) principals.add(h.organizerPrincipal);
  for (const t of teams) {
    if (t.leaderPrincipal) principals.add(t.leaderPrincipal);
    for (const m of t.members) if (m.principal) principals.add(m.principal);
  }
  for (const r of rewards) if (r.awardedByPrincipal) principals.add(r.awardedByPrincipal);

  const known = new Map(participants.filter((p) => p.principal).map((p) => [p.principal as string, p.email]));
  const unresolvable = [...principals].filter((p) => !known.has(p));

  if (unresolvable.length > 0) {
    console.warn(
      `\n  WARNING: ${unresolvable.length} principal(s) appear as organiser/leader/member ` +
        'but have no Participant record, so they carry no email and cannot be mapped to a user.',
    );
    console.warn('  These need manual mapping before the hackathon import.\n');
  }

  await writeExport('hackathon_principal_map', source,
    [...principals].map((p) => ({ principal: p, email: known.get(p) ?? null })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  exportHackquest().catch((err) => { console.error(err); process.exit(1); });
}
