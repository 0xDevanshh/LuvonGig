import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
  const Participant = IDL.Record({
    principal: IDL.Principal,
    displayName: IDL.Text,
    email: IDL.Text,
    joinedAt: IDL.Int,
  });

  return IDL.Service({
    getParticipant: IDL.Func(
      [IDL.Principal],
      [IDL.Opt(Participant)],
      ['query']
    ),
    listTeams: IDL.Func(
      [IDL.Text, IDL.Opt(IDL.Text)],
      [IDL.Vec(IDL.Record({
        id: IDL.Text,
        hackathonId: IDL.Text,
        leader: IDL.Principal,
        members: IDL.Vec(IDL.Record({
          principal: IDL.Principal,
          accepted: IDL.Bool,
        })),
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

// GET /api/hackquest/participants/check?principal=xxx&hackathonId=xxx - Check if user is registered
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const principal = searchParams.get('principal');
    const hackathonId = searchParams.get('hackathonId');

    if (!principal) {
      return NextResponse.json({
        success: false,
        error: 'Principal is required'
      }, { status: 400 });
    }

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    const actor: any = await createHackquestActor();
    const userPrincipal = Principal.fromText(principal);

    // Check if participant exists (registered)
    const participantResult = await actor.getParticipant(userPrincipal);
    const isRegistered = participantResult && participantResult[0] ? true : false;

    // If hackathonId is provided, also check if user is in any team for that hackathon
    let isInTeam = false;
    if (hackathonId && isRegistered) {
      try {
        const teams = await actor.listTeams(hackathonId, []);
        isInTeam = teams.some((team: any) => {
          if (team.leader.toText() === principal) return true;
          return team.members.some((member: any) => member.principal.toText() === principal);
        });
      } catch (error) {
        console.warn('Could not check team membership:', error);
      }
    }

    return NextResponse.json({
      success: true,
      isRegistered,
      isInTeam,
    });

  } catch (error) {
    console.error('Error checking participant:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check participant',
    }, { status: 500 });
  }
}

