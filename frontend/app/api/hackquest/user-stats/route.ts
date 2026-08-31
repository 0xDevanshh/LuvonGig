import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';
import { getPrincipalFromEmail } from '@/lib/principal-utils';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? 'http://127.0.0.1:4943';

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
  const Participant = IDL.Record({
    principal: IDL.Principal,
    displayName: IDL.Text,
    email: IDL.Text,
    joinedAt: IDL.Int,
  });

  const HackathonStatus = IDL.Variant({
    Draft: IDL.Null,
    Upcoming: IDL.Null,
    Ongoing: IDL.Null,
    Judging: IDL.Null,
    Completed: IDL.Null,
    Cancelled: IDL.Null,
  });

  const Hackathon = IDL.Record({
    id: IDL.Text,
    organizer: IDL.Principal,
    title: IDL.Text,
    tagline: IDL.Text,
    summary: IDL.Text,
    bannerUrl: IDL.Text,
    heroVideoUrl: IDL.Text,
    location: IDL.Text,
    theme: IDL.Text,
    prizePool: IDL.Nat64,
    faq: IDL.Vec(IDL.Text),
    resources: IDL.Vec(IDL.Text),
    minTeamSize: IDL.Nat,
    maxTeamSize: IDL.Nat,
    maxTeamsPerCategory: IDL.Nat,
    submissionsOpenAt: IDL.Int,
    submissionsCloseAt: IDL.Int,
    startAt: IDL.Int,
    endAt: IDL.Int,
    createdAt: IDL.Int,
    status: HackathonStatus,
    categories: IDL.Vec(IDL.Text),
    rewards: IDL.Vec(IDL.Text),
  });

  const TeamMember = IDL.Record({
    principal: IDL.Principal,
    accepted: IDL.Bool,
    invitedAt: IDL.Int,
    acceptedAt: IDL.Opt(IDL.Int),
  });

  const Team = IDL.Record({
    id: IDL.Text,
    hackathonId: IDL.Text,
    categoryId: IDL.Opt(IDL.Text),
    name: IDL.Text,
    leader: IDL.Principal,
    members: IDL.Vec(TeamMember),
    createdAt: IDL.Int,
    submissionId: IDL.Opt(IDL.Text),
  });

  const SubmissionStatus = IDL.Variant({
    Draft: IDL.Null,
    Submitted: IDL.Null,
    UnderReview: IDL.Null,
    Selected: IDL.Null,
    Rejected: IDL.Null,
  });

  const Submission = IDL.Record({
    id: IDL.Text,
    hackathonId: IDL.Text,
    teamId: IDL.Text,
    categoryId: IDL.Text,
    title: IDL.Text,
    summary: IDL.Text,
    description: IDL.Text,
    repoUrl: IDL.Text,
    demoUrl: IDL.Text,
    gallery: IDL.Vec(IDL.Text),
    submittedAt: IDL.Int,
    status: SubmissionStatus,
  });

  const RewardTier = IDL.Record({
    id: IDL.Text,
    hackathonId: IDL.Text,
    title: IDL.Text,
    description: IDL.Text,
    amount: IDL.Nat64,
    rank: IDL.Nat,
    categoryId: IDL.Opt(IDL.Text),
    perks: IDL.Vec(IDL.Text),
    awardedSubmissionId: IDL.Opt(IDL.Text),
    awardedTeamId: IDL.Opt(IDL.Text),
    awardedAt: IDL.Opt(IDL.Int),
    awardedBy: IDL.Opt(IDL.Principal),
    note: IDL.Opt(IDL.Text),
  });

  return IDL.Service({
    listHackathons: IDL.Func(
      [IDL.Nat, IDL.Nat, IDL.Opt(HackathonStatus)],
      [IDL.Vec(Hackathon)],
      ['query']
    ),
    listParticipantsForHackathon: IDL.Func(
      [IDL.Text],
      [IDL.Vec(Participant)],
      ['query']
    ),
    listTeams: IDL.Func(
      [IDL.Text, IDL.Opt(IDL.Text)],
      [IDL.Vec(Team)],
      ['query']
    ),
    listSubmissions: IDL.Func(
      [IDL.Text, IDL.Opt(IDL.Text)],
      [IDL.Vec(Submission)],
      ['query']
    ),
    listWinners: IDL.Func(
      [IDL.Text],
      [IDL.Vec(RewardTier)],
      ['query']
    ),
  });
};

const createHackquestActor = async () => {
  const agent = new HttpAgent({ host: IC_HOST });
  if (IC_HOST.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }
  return Actor.createActor(hackquestIdl as any, {
    agent,
    canisterId: Principal.fromText(CANISTER_ID),
  });
};

// GET /api/hackquest/user-stats?email=user@example.com
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    console.log(`📊 Fetching hackathon stats for user: ${email}`);

    const actor: any = await createHackquestActor();
    const userPrincipal = getPrincipalFromEmail(email);

    // Get all hackathons (use a large limit to get all, status = null to get all statuses)
    let allHackathons = [];
    try {
      // Call with limit=1000, offset=0, status=null to get all hackathons
      allHackathons = await actor.listHackathons(1000, 0, []);
    } catch (error) {
      console.warn('Could not list hackathons:', error);
    }

    // Count participations (hackathons where user is registered)
    let totalParticipations = 0;
    const userHackathonIds = new Set<string>();

    for (const hackathon of allHackathons) {
      try {
        const participants = await actor.listParticipantsForHackathon(hackathon.id);
        const isParticipant = participants.some((p: any) => 
          p.principal.toText() === userPrincipal.toText()
        );
        if (isParticipant) {
          totalParticipations++;
          userHackathonIds.add(hackathon.id);
        }
      } catch (error) {
        console.warn(`Could not check participation for hackathon ${hackathon.id}:`, error);
      }
    }

    // Count teams created (where user is leader)
    let teamsCreated = 0;
    const userTeamIds = new Set<string>();

    for (const hackathonId of userHackathonIds) {
      try {
        const teams = await actor.listTeams(hackathonId, []);
        for (const team of teams) {
          if (team.leader.toText() === userPrincipal.toText()) {
            teamsCreated++;
            userTeamIds.add(team.id);
          }
        }
      } catch (error) {
        console.warn(`Could not list teams for hackathon ${hackathonId}:`, error);
      }
    }

    // Count prizes won (submissions that won rewards) and track which hackathons
    let prizesWon = 0;
    const userSubmissionIds = new Set<string>();
    const achievements: Array<{ hackathonId: string; hackathonTitle: string; rewardTitle: string; rank: number }> = [];

    // First, get all submissions from user's teams
    for (const hackathonId of userHackathonIds) {
      try {
        const teams = await actor.listTeams(hackathonId, []);
        for (const team of teams) {
          // Check if user is leader or member
          const isLeader = team.leader.toText() === userPrincipal.toText();
          const isMember = team.members.some((m: any) => 
            m.principal.toText() === userPrincipal.toText() && m.accepted
          );

          if ((isLeader || isMember) && team.submissionId && team.submissionId[0]) {
            userSubmissionIds.add(team.submissionId[0]);
          }
        }
      } catch (error) {
        console.warn(`Could not get teams for hackathon ${hackathonId}:`, error);
      }
    }

    // Check which submissions won prizes and track hackathon info
    for (const hackathonId of userHackathonIds) {
      try {
        const winners = await actor.listWinners(hackathonId);
        // Find the hackathon title
        const hackathon = allHackathons.find((h: any) => h.id === hackathonId);
        const hackathonTitle = hackathon ? hackathon.title : 'Unknown Hackathon';

        for (const winner of winners) {
          if (winner.awardedSubmissionId && winner.awardedSubmissionId[0]) {
            const submissionId = winner.awardedSubmissionId[0];
            if (userSubmissionIds.has(submissionId)) {
              prizesWon++;
              achievements.push({
                hackathonId,
                hackathonTitle,
                rewardTitle: winner.title || 'Winner',
                rank: Number(winner.rank) || 0,
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Could not list winners for hackathon ${hackathonId}:`, error);
      }
    }

    // Calculate success rate (prizes won / total participations)
    const successRate = totalParticipations > 0 
      ? ((prizesWon / totalParticipations) * 100).toFixed(1)
      : '0';

    const stats = {
      totalParticipations,
      teamsCreated,
      prizesWon,
      successRate: `${successRate}%`,
      achievements, // Add achievements array
    };

    console.log(`✅ User stats calculated:`, stats);

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Error fetching user hackathon stats:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user stats',
    }, { status: 500 });
  }
}

