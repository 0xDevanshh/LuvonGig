import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
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

  const Participant = IDL.Record({
    principal: IDL.Principal,
    displayName: IDL.Text,
    email: IDL.Text,
    joinedAt: IDL.Int,
  });

  return IDL.Service({
    listSubmissions: IDL.Func(
      [IDL.Text, IDL.Opt(IDL.Text)],
      [IDL.Vec(Submission)],
      ['query']
    ),
    listTeams: IDL.Func(
      [IDL.Text, IDL.Opt(IDL.Text)],
      [IDL.Vec(Team)],
      ['query']
    ),
    getParticipant: IDL.Func(
      [IDL.Principal],
      [IDL.Opt(Participant)],
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

// GET /api/hackquest/submissions?hackathonId=xxx&categoryId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hackathonId = searchParams.get('hackathonId');
    const categoryId = searchParams.get('categoryId');

    if (!hackathonId) {
      return NextResponse.json({
        success: false,
        error: 'Hackathon ID is required'
      }, { status: 400 });
    }

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    console.log(`🔍 Fetching submissions for hackathon: ${hackathonId}, category: ${categoryId || 'all'}`);

    const actor: any = await createHackquestActor();

    // Fetch submissions
    const submissions = await actor.listSubmissions(
      hackathonId,
      categoryId ? [categoryId] : []
    );

    // Fetch all teams for this hackathon
    const teams = await actor.listTeams(hackathonId, []);

    // Create a map of teamId -> team
    const teamMap = new Map<string, any>();
    for (const team of teams) {
      teamMap.set(team.id, team);
    }

    // Fetch participant details for all team members
    const participantMap = new Map<string, any>();
    const allPrincipals = new Set<string>();
    
    for (const team of teams) {
      allPrincipals.add(team.leader.toText());
      for (const member of team.members) {
        allPrincipals.add(member.principal.toText());
      }
    }

    // Fetch participant details
    for (const principalText of allPrincipals) {
      try {
        const principal = Principal.fromText(principalText);
        const participant = await actor.getParticipant(principal);
        if (participant && participant[0]) {
          participantMap.set(principalText, participant[0]);
        }
      } catch (error) {
        console.warn(`Could not fetch participant for ${principalText}:`, error);
      }
    }

    // Transform submissions with team details
    const transformedSubmissions = await Promise.all(
      submissions.map(async (submission: any) => {
        const team = teamMap.get(submission.teamId);
        let teamDetails = null;

        if (team) {
          // Get team leader details
          const leaderPrincipal = team.leader.toText();
          const leaderParticipant = participantMap.get(leaderPrincipal);

          // Get team member details
          const members = await Promise.all(
            team.members.map(async (member: any) => {
              const memberPrincipal = member.principal.toText();
              const memberParticipant = participantMap.get(memberPrincipal);
              return {
                principal: memberPrincipal,
                accepted: member.accepted,
                invitedAt: Number(member.invitedAt),
                acceptedAt: member.acceptedAt && member.acceptedAt[0] ? Number(member.acceptedAt[0]) : null,
                displayName: memberParticipant?.displayName || 'Unknown',
                email: memberParticipant?.email || 'Unknown',
              };
            })
          );

          teamDetails = {
            id: team.id,
            name: team.name,
            leader: {
              principal: leaderPrincipal,
              displayName: leaderParticipant?.displayName || 'Unknown',
              email: leaderParticipant?.email || 'Unknown',
            },
            members,
            categoryId: team.categoryId && team.categoryId[0] ? team.categoryId[0] : null,
            createdAt: Number(team.createdAt),
            submissionId: team.submissionId && team.submissionId[0] ? team.submissionId[0] : null,
          };
        }

        return {
          id: submission.id,
          hackathonId: submission.hackathonId,
          teamId: submission.teamId,
          categoryId: submission.categoryId,
          title: submission.title,
          summary: submission.summary,
          description: submission.description,
          repoUrl: submission.repoUrl,
          demoUrl: submission.demoUrl,
          gallery: submission.gallery || [],
          submittedAt: Number(submission.submittedAt),
          status: submission.status,
          team: teamDetails,
        };
      })
    );

    console.log(`✅ Found ${transformedSubmissions.length} submissions`);

    return NextResponse.json({
      success: true,
      data: transformedSubmissions,
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch submissions',
    }, { status: 500 });
  }
}


