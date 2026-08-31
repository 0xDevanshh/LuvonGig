import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
  return IDL.Service({
    listTeams: IDL.Func(
      [IDL.Text, IDL.Opt(IDL.Text)],
      [IDL.Vec(IDL.Record({
        id: IDL.Text,
        hackathonId: IDL.Text,
        categoryId: IDL.Opt(IDL.Text),
        name: IDL.Text,
        leader: IDL.Principal,
        members: IDL.Vec(IDL.Record({
          principal: IDL.Principal,
          accepted: IDL.Bool,
          invitedAt: IDL.Int,
          acceptedAt: IDL.Opt(IDL.Int),
        })),
        createdAt: IDL.Int,
        submissionId: IDL.Opt(IDL.Text),
      }))],
      ['query']
    ),
    getParticipant: IDL.Func(
      [IDL.Principal],
      [IDL.Opt(IDL.Record({
        principal: IDL.Principal,
        email: IDL.Text,
        displayName: IDL.Text,
        joinedAt: IDL.Int,
      }))],
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

// GET /api/hackquest/teams?hackathonId=xxx&principal=xxx - Get teams for a hackathon, optionally filtered by user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hackathonId = searchParams.get('hackathonId');
    const principal = searchParams.get('principal');

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

    const actor: any = await createHackquestActor();
    
    // Get all teams for the hackathon
    const teamsResult = await actor.listTeams(hackathonId, []);
    
    let teams = teamsResult || [];

    // If principal is provided, filter teams where user is a member
    if (principal) {
      try {
        const userPrincipal = Principal.fromText(principal);
        teams = teams.filter((team: any) => {
          // Check if user is leader
          if (team.leader.toText() === principal) {
            return true;
          }
          // Check if user is a member
          return team.members.some((member: any) => 
            member.principal.toText() === principal
          );
        });

        // Enrich team members with email/displayName from participant records
        for (const team of teams) {
          for (const member of team.members) {
            try {
              const participantResult = await actor.getParticipant(member.principal);
              if (participantResult && participantResult[0]) {
                const participant = participantResult[0];
                (member as any).email = participant.email;
                (member as any).displayName = participant.displayName;
              }
            } catch (error) {
              console.warn(`Could not get participant for ${member.principal.toText()}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error filtering teams by principal:', error);
      }
    }

    const transformedTeams = teams.map((team: any) => ({
      id: team.id,
      name: team.name,
      leader: team.leader.toText(),
      members: team.members.map((member: any) => ({
        principal: member.principal.toText(),
        accepted: member.accepted,
        invitedAt: Number(member.invitedAt),
        acceptedAt: member.acceptedAt && member.acceptedAt[0] ? Number(member.acceptedAt[0]) : null,
        email: (member as any).email || null,
        displayName: (member as any).displayName || null,
      })),
      categoryId: team.categoryId && team.categoryId[0] ? team.categoryId[0] : null,
      createdAt: Number(team.createdAt),
      submissionId: team.submissionId && team.submissionId[0] ? team.submissionId[0] : null,
    }));

    return NextResponse.json({
      success: true,
      teams: transformedTeams
    });

  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch teams',
    }, { status: 500 });
  }
}

