import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
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

  const HackQuestError = IDL.Variant({
    NotFound: IDL.Text,
    ValidationError: IDL.Text,
    InvalidState: IDL.Text,
    NotAuthorized: IDL.Null,
  });

  return IDL.Service({
    updateTeamCategory: IDL.Func(
      [IDL.Text, IDL.Principal, IDL.Opt(IDL.Text)], // teamId, principal, categoryId
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
  return Actor.createActor(hackquestIdl as any, {
    agent,
    canisterId: Principal.fromText(CANISTER_ID),
  });
};

// POST /api/hackquest/teams/[teamId]/update-category
// Note: Since the canister doesn't have an updateTeam function,
// we'll need to check if the team exists and return an appropriate message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const body = await request.json();
    const { categoryId, principal } = body;

    if (!teamId || !categoryId || !principal) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: teamId, categoryId, principal'
      }, { status: 400 });
    }

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    console.log(`🔄 Updating team category:`, { teamId, categoryId, principal });

    const actor: any = await createHackquestActor();
    const userPrincipal = Principal.fromText(principal);

    const result = await actor.updateTeamCategory(
      teamId,
      userPrincipal,
      categoryId ? [categoryId] : []
    );

    if ('err' in result) {
      const error = result.err;
      let errorMessage = 'Failed to update team category';
      
      if ('NotFound' in error) {
        errorMessage = `Not found: ${error.NotFound}`;
      } else if ('ValidationError' in error) {
        errorMessage = `Validation error: ${error.ValidationError}`;
      } else if ('InvalidState' in error) {
        errorMessage = `Invalid state: ${error.InvalidState}`;
      } else if ('NotAuthorized' in error) {
        errorMessage = 'Not authorized: Only the team leader can update the category';
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
      }, { status: 400 });
    }

    const team = result.ok;
    console.log(`✅ Team category updated successfully`);

    return NextResponse.json({
      success: true,
      data: {
        id: team.id,
        hackathonId: team.hackathonId,
        categoryId: team.categoryId && team.categoryId[0] ? team.categoryId[0] : null,
        name: team.name,
        leader: team.leader.toText(),
      },
    });

  } catch (error) {
    console.error('Error updating team category:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update team category',
    }, { status: 500 });
  }
}

