import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';
import { getPrincipalFromEmail } from '@/lib/principal-utils';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';


const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
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

  const HackQuestError = IDL.Variant({
    NotFound: IDL.Text,
    ValidationError: IDL.Text,
    InvalidState: IDL.Text,
    NotAuthorized: IDL.Null,
  });

  return IDL.Service({
    assignWinner: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Principal, IDL.Opt(IDL.Text)], // hackathonId, rewardId, submissionId, organizer, note
      [IDL.Variant({ ok: RewardTier, err: HackQuestError })],
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

// POST /api/hackquest/winners/assign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hackathonId, rewardId, submissionId, note, organizerEmail } = body;

    if (!hackathonId || !rewardId || !submissionId || !organizerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: hackathonId, rewardId, submissionId, organizerEmail'
      }, { status: 400 });
    }

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    console.log(`🏆 Assigning winner:`, { hackathonId, rewardId, submissionId, note });

    const actor: any = await createHackquestActor();
    const organizerPrincipal = getPrincipalFromEmail(organizerEmail);

    const result = await actor.assignWinner(
      hackathonId,
      rewardId,
      submissionId,
      organizerPrincipal,
      note ? [note] : []
    );

    if ('err' in result) {
      const error = result.err;
      let errorMessage = 'Failed to assign winner';
      
      if ('NotFound' in error) {
        errorMessage = `Not found: ${error.NotFound}`;
      } else if ('ValidationError' in error) {
        errorMessage = `Validation error: ${error.ValidationError}`;
      } else if ('InvalidState' in error) {
        errorMessage = `Invalid state: ${error.InvalidState}`;
      } else if ('NotAuthorized' in error) {
        errorMessage = 'Not authorized: Only the hackathon organizer can assign winners';
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
      }, { status: 400 });
    }

    const reward = result.ok;
    console.log(`✅ Winner assigned successfully`);

    return NextResponse.json({
      success: true,
      data: {
        rewardId: reward.id,
        submissionId: reward.awardedSubmissionId && reward.awardedSubmissionId[0] ? reward.awardedSubmissionId[0] : null,
        teamId: reward.awardedTeamId && reward.awardedTeamId[0] ? reward.awardedTeamId[0] : null,
        awardedAt: reward.awardedAt && reward.awardedAt[0] ? Number(reward.awardedAt[0]) : null,
        note: reward.note && reward.note[0] ? reward.note[0] : null,
      },
    });

  } catch (error) {
    console.error('Error assigning winner:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign winner',
    }, { status: 500 });
  }
}

