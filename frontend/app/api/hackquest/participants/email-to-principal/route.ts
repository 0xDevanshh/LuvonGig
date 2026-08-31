import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';
import { getPrincipalFromEmail } from '@/lib/principal-utils';

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

// GET /api/hackquest/participants/email-to-principal - Get principal from email
// Note: This requires the participant to be registered first
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

    console.log('🔍 Generating principal for email:', email);

    // Generate deterministic principal from email (same method as registration)
    const principal = getPrincipalFromEmail(email);
    const principalText = principal.toText();
    
    console.log(`✅ Generated principal ${principalText} for email ${email}`);

    return NextResponse.json({
      success: true,
      principal: principalText,
      email: email,
    });

  } catch (error) {
    console.error('Error looking up principal:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to look up principal'
    }, { status: 500 });
  }
}

