import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';
import { getPrincipalFromEmail } from '@/lib/principal-utils';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
  const Team = IDL.Record({
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
    status: IDL.Variant({
      Draft: IDL.Null,
      Upcoming: IDL.Null,
      Ongoing: IDL.Null,
      Judging: IDL.Null,
      Completed: IDL.Null,
      Cancelled: IDL.Null,
    }),
    categories: IDL.Vec(IDL.Text),
    rewards: IDL.Vec(IDL.Text),
  });

  const Participant = IDL.Record({
    principal: IDL.Principal,
    displayName: IDL.Text,
    email: IDL.Text,
    joinedAt: IDL.Int,
  });

  const HackathonStatus = IDL.Variant({
    Draft: IDL.Null,
    Upcoming: IDL.Null,
    Ongoing: IDL.Null,
    Judging: IDL.Null,
    Completed: IDL.Null,
    Cancelled: IDL.Null,
  });

  return IDL.Service({
    listHackathons: IDL.Func(
      [IDL.Nat, IDL.Nat, IDL.Opt(HackathonStatus)],
      [IDL.Vec(Hackathon)],
      ['query']
    ),
    listTeams: IDL.Func(
      [IDL.Text, IDL.Opt(IDL.Text)],
      [IDL.Vec(Team)],
      ['query']
    ),
    getHackathonDetails: IDL.Func(
      [IDL.Text],
      [IDL.Opt(IDL.Record({
        hackathon: Hackathon,
        categories: IDL.Vec(IDL.Record({
          id: IDL.Text,
          hackathonId: IDL.Text,
          name: IDL.Text,
          description: IDL.Text,
          rewardSlots: IDL.Nat,
          judgingCriteria: IDL.Vec(IDL.Text),
        })),
        rewards: IDL.Vec(IDL.Record({
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
        })),
      }))],
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

// GET /api/hackquest/teams/invitations - Get team invitations for a user by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'User email is required'
      }, { status: 400 });
    }

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    console.log('🔍 Fetching team invitations for user:', userEmail);

    const actor: any = await createHackquestActor();
    
    const userPrincipal = getPrincipalFromEmail(userEmail);
    const userPrincipalText = userPrincipal.toText();
    
    // Get all hackathons to check teams
    const allHackathons = await actor.listHackathons(BigInt(100), BigInt(0), []);
    
    const invitations: any[] = [];

    // For each hackathon, get teams and check if user is invited
    for (const hackathon of allHackathons) {
      try {
        const teams = await actor.listTeams(hackathon.id, []);
        
        for (const team of teams) {
          // Check if user is in the team members (and not accepted yet)
          for (const member of team.members) {
            if (member.principal.toText() === userPrincipalText && !member.accepted) {
              // Get hackathon details
              const hackathonDetails = await actor.getHackathonDetails(hackathon.id);
              
              invitations.push({
                teamId: team.id,
                teamName: team.name,
                hackathonId: hackathon.id,
                hackathonTitle: hackathon.title,
                hackathonTagline: hackathon.tagline,
                categoryId: team.categoryId[0] || null,
                leader: team.leader.toText(),
                invitedAt: Number(member.invitedAt) / 1_000_000,
                hackathonDetails: hackathonDetails[0] ? {
                  bannerUrl: hackathon.bannerUrl,
                  theme: hackathon.theme,
                  location: hackathon.location,
                } : null,
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Could not get teams for hackathon ${hackathon.id}:`, error);
      }
    }

    console.log(`✅ Found ${invitations.length} invitations for user ${userEmail}`);

    return NextResponse.json({
      success: true,
      invitations,
      total: invitations.length
    });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch invitations',
      invitations: []
    }, { status: 500 });
  }
}

