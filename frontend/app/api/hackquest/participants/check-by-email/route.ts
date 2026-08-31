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
    listParticipantsForHackathon: IDL.Func(
      [IDL.Text],
      [IDL.Vec(Participant)],
      ['query']
    ),
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

// GET /api/hackquest/participants/check-by-email?email=xxx&hackathonId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const hackathonId = searchParams.get('hackathonId');

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

    console.log(`🔍 Checking registration for email: ${email}, hackathon: ${hackathonId || 'any'}`);

    const actor: any = await createHackquestActor();
    
    // Generate principal from email
    const userPrincipal = getPrincipalFromEmail(email);
    
    // Check if participant exists (registered globally)
    const participantResult = await actor.getParticipant(userPrincipal);
    const isRegistered = participantResult && participantResult[0] ? true : false;
    
    console.log(`🔍 Registration check for ${email}:`, {
      principal: userPrincipal.toText(),
      isRegistered,
      participantEmail: participantResult && participantResult[0] ? participantResult[0].email : 'N/A'
    });

    // If hackathonId is provided, check if user is registered for that specific hackathon
    // Note: Registration is global, so if they're registered, they're registered for all hackathons
    // But we also check if they're in the hackathon's participant list (organizer, team leader, or team member)
    let isRegisteredForHackathon = isRegistered;
    if (hackathonId && isRegistered) {
      try {
        const hackathonParticipants = await actor.listParticipantsForHackathon(hackathonId);
        const searchEmail = email.toLowerCase();
        const isInHackathonList = hackathonParticipants.some((p: any) => 
          p.email.toLowerCase() === searchEmail
        );
        console.log(`📋 Found ${hackathonParticipants.length} participants for hackathon ${hackathonId}, user in list: ${isInHackathonList}`);
        
        // User is registered for THIS hackathon ONLY if they are in the participant list
        isRegisteredForHackathon = isInHackathonList;
      } catch (error) {
        console.warn('Could not check hackathon-specific registration:', error);
        // Fallback to general registration status
        isRegisteredForHackathon = isRegistered;
      }
    }

    // If hackathonId is provided, also check if user is in any team for that hackathon
    let isInTeam = false;
    if (hackathonId && isRegistered) {
      try {
        const teams = await actor.listTeams(hackathonId, []);
        const principalText = userPrincipal.toText();
        isInTeam = teams.some((team: any) => {
          if (team.leader.toText() === principalText) return true;
          return team.members.some((member: any) => member.principal.toText() === principalText);
        });
      } catch (error) {
        console.warn('Could not check team membership:', error);
      }
    }

    return NextResponse.json({
      success: true,
      isRegistered,
      isRegisteredForHackathon: hackathonId ? isRegisteredForHackathon : isRegistered,
      isInTeam,
      principal: userPrincipal.toText(),
    });

  } catch (error) {
    console.error('Error checking participant:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check participant',
    }, { status: 500 });
  }
}

