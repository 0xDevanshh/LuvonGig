import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent, AnonymousIdentity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';
import { getPrincipalFromEmail } from '@/lib/principal-utils';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
  const HackQuestError = IDL.Variant({
    NotFound: IDL.Text,
    ValidationError: IDL.Text,
    InvalidState: IDL.Text,
    NotAuthorized: IDL.Null,
  });

  const Participant = IDL.Record({
    principal: IDL.Principal,
    displayName: IDL.Text,
    email: IDL.Text,
    joinedAt: IDL.Int,
  });

  return IDL.Service({
    registerParticipant: IDL.Func(
      [IDL.Principal, IDL.Text, IDL.Text], // principal, displayName, email
      [IDL.Variant({ ok: Participant, err: HackQuestError })],
      []
    ),
    registerForHackathon: IDL.Func(
      [IDL.Text, IDL.Principal], // hackathonId, principal
      [IDL.Variant({ ok: IDL.Null, err: HackQuestError })],
      []
    ),
  });
};

const createHackquestActor = async (principal?: Principal) => {
  const agent = new HttpAgent({ host: IC_HOST });
  if (IC_HOST.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }
  // Use anonymous identity - note: this won't work for authenticated shared functions
  // The registration should ideally be done client-side with wallet authentication
  // For now, we use anonymous identity which will fail for shared functions
  const identity = new AnonymousIdentity();
  agent.replaceIdentity(identity);
  return Actor.createActor(hackquestIdl as any, {
    agent,
    canisterId: Principal.fromText(CANISTER_ID),
  });
};

// POST /api/hackquest/register - Register as participant (and optionally for a hackathon)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { displayName, email, hackathonId } = body;

    if (!displayName || !email) {
      return NextResponse.json({
        success: false,
        error: 'Display name and email are required'
      }, { status: 400 });
    }

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    // Generate a deterministic principal from email
    // This ensures each email gets a unique principal without requiring wallet connection
    const userPrincipal = getPrincipalFromEmail(email);
    console.log('🔍 Registering participant:', { displayName, email, principal: userPrincipal.toText(), hackathonId });

    const actor: any = await createHackquestActor();
    
    // Step 1: Register participant globally
    const result = await actor.registerParticipant(userPrincipal, displayName, email);

    if ('err' in result) {
      const error = result.err;
      let errorMessage = 'Failed to register participant';
      
      if ('ValidationError' in error) {
        errorMessage = error.ValidationError;
      } else if ('InvalidState' in error) {
        errorMessage = error.InvalidState;
      } else if ('NotAuthorized' in error) {
        errorMessage = 'Not authorized to register';
      } else if ('NotFound' in error) {
        errorMessage = error.NotFound;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 400 });
    }

    const participant = result.ok;
    console.log('✅ Participant registered globally');

    // Step 2: If hackathonId is provided, register for that specific hackathon
    if (hackathonId) {
      try {
        const hackathonResult = await actor.registerForHackathon(hackathonId, userPrincipal);
        if ('err' in hackathonResult) {
          const error = hackathonResult.err;
          let errorMessage = 'Failed to register for hackathon';
          
          if ('ValidationError' in error) {
            errorMessage = error.ValidationError;
          } else if ('NotFound' in error) {
            errorMessage = error.NotFound;
          }
          
          console.warn('⚠️ Failed to register for hackathon:', errorMessage);
          // Still return success for global registration, but warn about hackathon registration
          return NextResponse.json({
            success: true,
            participant: {
              principal: participant.principal.toText(),
              displayName: participant.displayName,
              email: participant.email,
              joinedAt: Number(participant.joinedAt) / 1_000_000,
            },
            warning: errorMessage
          });
        }
        console.log('✅ Participant registered for hackathon:', hackathonId);
      } catch (error) {
        console.warn('⚠️ Error registering for hackathon:', error);
        // Continue even if hackathon registration fails
      }
    }

    return NextResponse.json({
      success: true,
      participant: {
        principal: participant.principal.toText(),
        displayName: participant.displayName,
        email: participant.email,
        joinedAt: Number(participant.joinedAt) / 1_000_000,
      }
    });

  } catch (error) {
    console.error('Error registering participant:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register participant'
    }, { status: 500 });
  }
}

