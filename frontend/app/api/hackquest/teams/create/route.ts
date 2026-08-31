import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';
import { getPrincipalFromEmail } from '@/lib/principal-utils';
import { getUserActor } from '@/lib/ic-agent';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
  const HackQuestError = IDL.Variant({
    NotFound: IDL.Text,
    ValidationError: IDL.Text,
    InvalidState: IDL.Text,
    NotAuthorized: IDL.Null,
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

  const Participant = IDL.Record({
    principal: IDL.Principal,
    displayName: IDL.Text,
    email: IDL.Text,
    joinedAt: IDL.Int,
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

  const CreateTeamRequest = IDL.Record({
    hackathonId: IDL.Text,
    name: IDL.Text,
    categoryId: IDL.Opt(IDL.Text),
    leader: IDL.Principal,
    invitees: IDL.Vec(IDL.Principal),
  });

  return IDL.Service({
    listHackathons: IDL.Func(
      [IDL.Nat, IDL.Nat, IDL.Opt(HackathonStatus)],
      [IDL.Vec(Hackathon)],
      ['query']
    ),
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
      [IDL.Vec(Team)],
      ['query']
    ),
    createTeam: IDL.Func(
      [CreateTeamRequest],
      [IDL.Variant({ ok: Team, err: HackQuestError })],
      []
    ),
  });
};

const createHackquestActor = async (principal?: Principal) => {
  const agent = new HttpAgent({ host: IC_HOST });
  if (IC_HOST.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }
  if (principal) {
    agent.replaceIdentity({
      getPrincipal: () => principal,
      sign: async () => {
        throw new Error('Signing not supported in server-side context');
      },
    } as any);
  }
  return Actor.createActor(hackquestIdl as any, {
    agent,
    canisterId: Principal.fromText(CANISTER_ID),
  });
};


// POST /api/hackquest/teams/create - Create team and invite members by email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hackathonId, categoryId, teamName, inviteeEmails, leaderPrincipal, leaderEmail } = body;

    if (!hackathonId || !teamName) {
      return NextResponse.json({
        success: false,
        error: 'Hackathon ID and team name are required'
      }, { status: 400 });
    }

    // Get leader principal from email if not provided
    let leader: Principal;
    if (leaderPrincipal) {
      leader = Principal.fromText(leaderPrincipal);
    } else if (leaderEmail) {
      try {
        leader = getPrincipalFromEmail(leaderEmail);
      } catch (err) {
        return NextResponse.json({
          success: false,
          error: 'Invalid leader email'
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Leader email or principal is required'
      }, { status: 400 });
    }

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    console.log('🔍 Creating team:', { hackathonId, teamName, inviteeEmails, leader: leader.toText() });
    
    // Convert email addresses to principals
    // Note: This requires the invitees to have registered as participants first
    const inviteePrincipals: Principal[] = [];
    const failedEmails: string[] = [];
    
    if (inviteeEmails && inviteeEmails.length > 0) {
      for (const email of inviteeEmails) {
        try {
          const principal = getPrincipalFromEmail(email);
          inviteePrincipals.push(principal);
          console.log(`✅ Generated principal for ${email}: ${principal.toText()}`);
        } catch (err) {
          failedEmails.push(email);
          console.warn(`⚠️ Cannot generate principal for email ${email}`);
        }
      }
      
      if (failedEmails.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Cannot find participants with the following emails: ${failedEmails.join(', ')}`,
          failedEmails,
          message: 'To invite someone by email, they must:\n1. Register for the hackathon first\n2. Be part of a team OR be a hackathon organizer\n\nNote: If they just registered but haven\'t joined a team yet, they won\'t be found. This is a limitation of the current system. Consider asking them to create a team first, or add them manually using their principal ID.'
        }, { status: 400 });
      }
    }

    const createActor: any = await createHackquestActor();
    
    const createTeamRequest = {
      hackathonId,
      categoryId: categoryId ? [categoryId] : [],
      name: teamName,
      leader: leader,
      invitees: inviteePrincipals,
    };

    const result = await createActor.createTeam(createTeamRequest);

    if ('err' in result) {
      const error = result.err;
      let errorMessage = 'Failed to create team';
      
      if ('ValidationError' in error) {
        errorMessage = error.ValidationError;
      } else if ('InvalidState' in error) {
        errorMessage = error.InvalidState;
      } else if ('NotAuthorized' in error) {
        errorMessage = 'Not authorized to create team';
      } else if ('NotFound' in error) {
        errorMessage = error.NotFound;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 400 });
    }

    const team = result.ok;
    console.log('✅ Team created successfully:', team.id);

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
    console.error('Error creating team:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create team'
    }, { status: 500 });
  }
}

