import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
  const HackQuestError = IDL.Variant({
    NotFound: IDL.Text,
    ValidationError: IDL.Text,
    InvalidState: IDL.Text,
    NotAuthorized: IDL.Null,
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

  return IDL.Service({
    respondToInvite: IDL.Func(
      [IDL.Text, IDL.Principal, IDL.Bool], // teamId, principal, accept
      [IDL.Variant({ ok: Team, err: HackQuestError })],
      []
    ),
  });
};

const createHackquestActor = async () => {
  const agent = new HttpAgent({ host: IC_HOST });
  if (IC_HOST.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }
  // No identity needed - principal is passed as parameter to the function
  return Actor.createActor(hackquestIdl as any, {
    agent,
    canisterId: Principal.fromText(CANISTER_ID),
  });
};

// POST /api/hackquest/teams/respond - Accept or decline team invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, accept, principal } = body;

    if (!teamId || typeof accept !== 'boolean' || !principal) {
      return NextResponse.json({
        success: false,
        error: 'Team ID, accept status, and principal are required'
      }, { status: 400 });
    }

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    console.log('🔍 Responding to team invitation:', { teamId, accept, principal });

    const userPrincipal = Principal.fromText(principal);
    const actor: any = await createHackquestActor();
    
    // Pass principal as parameter (no wallet/identity needed)
    const result = await actor.respondToInvite(teamId, userPrincipal, accept);

    if ('err' in result) {
      const error = result.err;
      let errorMessage = 'Failed to respond to invitation';
      
      if ('ValidationError' in error) {
        errorMessage = error.ValidationError;
      } else if ('InvalidState' in error) {
        errorMessage = error.InvalidState;
      } else if ('NotAuthorized' in error) {
        errorMessage = 'Not authorized';
      } else if ('NotFound' in error) {
        errorMessage = error.NotFound;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 400 });
    }

    const team = result.ok;
    console.log('✅ Invitation response processed successfully');

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        hackathonId: team.hackathonId,
        categoryId: team.categoryId[0] || null,
        name: team.name,
        leader: team.leader.toText(),
        members: team.members.map((m: any) => ({
          principal: m.principal.toText(),
          accepted: m.accepted,
          invitedAt: Number(m.invitedAt) / 1_000_000,
          acceptedAt: m.acceptedAt[0] ? Number(m.acceptedAt[0]) / 1_000_000 : null,
        })),
        createdAt: Number(team.createdAt) / 1_000_000,
      }
    });

  } catch (error) {
    console.error('Error responding to invitation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to respond to invitation'
    }, { status: 500 });
  }
}

