import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
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

// GET /api/hackquest/list - Get all hackathons (excluding user-created ones)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('excludeUserEmail'); // Exclude hackathons created by this email

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    console.log('🔍 Fetching all hackathons (excluding user:', userEmail, ')');

    const actor: any = await createHackquestActor();
    
    // Get all hackathons with status Upcoming or Ongoing
    const allHackathons = await actor.listHackathons(BigInt(100), BigInt(0), []);

    // Filter out hackathons created by the user (if email provided)
    // Only exclude hackathons where the user is the ORGANIZER, not where they're a participant
    let filteredHackathons = allHackathons;
    if (userEmail) {
      filteredHackathons = [];
      for (const hackathon of allHackathons) {
        try {
          // Check if the organizer's email matches the user's email
          const organizerParticipantResult = await actor.getParticipant(hackathon.organizer);
          const organizerParticipant = organizerParticipantResult && organizerParticipantResult[0] ? organizerParticipantResult[0] : null;
          
          // Only exclude if the organizer's email matches (user created this hackathon)
          // Don't exclude if user is just a participant
          const isOrganizer = organizerParticipant && organizerParticipant.email === userEmail;
          
          if (!isOrganizer) {
            // Only include Upcoming, Ongoing, or Judging hackathons
            const status = hackathon.status;
            const isActive = status.Upcoming !== null || status.Ongoing !== null || status.Judging !== null;
            
            if (isActive) {
              filteredHackathons.push(hackathon);
            }
          }
        } catch (error) {
          // If participant lookup fails, include the hackathon (safer for public listing)
          console.warn('Could not check organizer for hackathon', hackathon.id, error);
          const status = hackathon.status;
          const isActive = status.Upcoming !== null || status.Ongoing !== null || status.Judging !== null;
          if (isActive) {
            filteredHackathons.push(hackathon);
          }
        }
      }
    } else {
      // If no email provided, just filter by status
      filteredHackathons = allHackathons.filter((h: any) => {
        const status = h.status;
        return status.Upcoming !== null || status.Ongoing !== null || status.Judging !== null;
      });
    }

    const timestampToDate = (ts: bigint) => {
      const millis = Number(ts) / 1_000_000;
      return new Date(millis).toISOString();
    };

    const transformedHackathons = filteredHackathons.map((hackathon: any) => ({
      id: hackathon.id,
      title: hackathon.title || 'Untitled Hackathon',
      tagline: hackathon.tagline || '',
      description: hackathon.summary || '',
      theme: hackathon.theme || 'General',
      location: hackathon.location || 'Virtual',
      bannerUrl: hackathon.bannerUrl || '',
      heroVideoUrl: hackathon.heroVideoUrl || '',
      prizePool: hackathon.prizePool.toString(),
      start_date: timestampToDate(BigInt(hackathon.startAt)),
      end_date: timestampToDate(BigInt(hackathon.endAt)),
      registration_start: timestampToDate(BigInt(hackathon.submissionsOpenAt)),
      registration_end: timestampToDate(BigInt(hackathon.submissionsCloseAt)),
      min_team_size: Number(hackathon.minTeamSize),
      max_team_size: Number(hackathon.maxTeamSize),
      status: hackathon.status,
      created_at: timestampToDate(BigInt(hackathon.createdAt)),
      categories: hackathon.categories || [],
      rewards: hackathon.rewards || [],
    }));

    console.log(`✅ Found ${transformedHackathons.length} hackathons for freelancers`);

    return NextResponse.json({
      success: true,
      hackathons: transformedHackathons,
      total: transformedHackathons.length
    });

  } catch (error) {
    console.error('Error fetching hackathons:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch hackathons',
      hackathons: []
    }, { status: 500 });
  }
}

