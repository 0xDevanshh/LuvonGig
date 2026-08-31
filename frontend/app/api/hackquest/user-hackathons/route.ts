import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';
import { getPrincipalFromEmail } from '@/lib/principal-utils';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? ''; // Use testnet directly


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

// IDL for update method version (in case query doesn't work)
const hackquestIdlUpdate = ({ IDL }: typeof import('@dfinity/candid')) => {
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
      [] // Update method (no 'query' annotation)
    ),
    getParticipant: IDL.Func(
      [IDL.Principal],
      [IDL.Opt(Participant)],
      ['query']
    ),
  });
};

const createHackquestActor = async (useUpdate = false) => {
  const agent = new HttpAgent({ host: IC_HOST });
  if (IC_HOST.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }
  const idl = useUpdate ? hackquestIdlUpdate : hackquestIdl;
  return Actor.createActor(idl as any, {
    agent,
    canisterId: Principal.fromText(CANISTER_ID),
  });
};

// GET /api/hackquest/user-hackathons - Get hackathons for a user by email
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

    console.log('🔍 Fetching hackathons for user email:', userEmail);

    // Try query method first, then update method if query fails
    let allHackathons = [];
    let actor: any;
    
    try {
      // First try as query method
      actor = await createHackquestActor(false);
      allHackathons = await actor.listHackathons(BigInt(100), BigInt(0), []);
      console.log(`📋 Retrieved ${allHackathons.length} hackathons from canister (query method)`);
    } catch (queryError: any) {
      console.warn('⚠️ Query method failed, trying update method:', queryError.message);
      try {
        // Try as update method
        actor = await createHackquestActor(true);
        allHackathons = await actor.listHackathons(BigInt(100), BigInt(0), []);
        console.log(`📋 Retrieved ${allHackathons.length} hackathons from canister (update method)`);
      } catch (updateError: any) {
        console.error('❌ Both query and update methods failed:', updateError.message);
        // If both fail, return empty array gracefully
        return NextResponse.json({
          success: true,
          hackathons: [],
          total: 0,
          message: 'The canister does not have the listHackathons method available. Please ensure the canister is deployed with the latest code.'
        });
      }
    }
    
    // Ensure we have an actor for getParticipant calls
    if (!actor) {
      actor = await createHackquestActor(false);
    }

    // Generate principal from user email for comparison
    const userPrincipal = getPrincipalFromEmail(userEmail);
    const userPrincipalText = userPrincipal.toText();
    
    // For each hackathon, check if it was created by the user
    // We include hackathons where:
    // 1. Organizer has participant record AND email matches, OR
    // 2. Organizer principal matches the principal derived from user email (even if no participant record)
    const userHackathons = [];
    for (const hackathon of allHackathons) {
      try {
        const organizerPrincipalText = hackathon.organizer.toText();
        let isUserHackathon = false;
        
        // First, try to get participant record for the organizer
        const participantResult = await actor.getParticipant(hackathon.organizer);
        const participant = participantResult && participantResult[0] ? participantResult[0] : null;
        
        if (participant) {
          // If participant record exists, check if email matches
          if (participant.email === userEmail) {
            isUserHackathon = true;
            console.log(`✅ Hackathon ${hackathon.id}: Created by user ${userEmail} (verified by participant email)`);
          } else {
            console.log(`⚠️ Hackathon ${hackathon.id}: Not created by user - organizer email: "${participant.email}", user email: "${userEmail}"`);
          }
        } else {
          // No participant record - check if organizer principal matches user's derived principal
          if (organizerPrincipalText === userPrincipalText) {
            isUserHackathon = true;
            console.log(`✅ Hackathon ${hackathon.id}: Created by user ${userEmail} (verified by principal match, no participant record)`);
          } else {
            console.log(`⚠️ Hackathon ${hackathon.id}: Organizer ${organizerPrincipalText} has no participant record and principal doesn't match user principal ${userPrincipalText}`);
          }
        }
        
        if (isUserHackathon) {
          // This hackathon was created by the user
          const timestampToDate = (ts: bigint) => {
            const millis = Number(ts) / 1_000_000;
            return new Date(millis).toISOString();
          };

          userHackathons.push({
            hackathon_id: hackathon.id,
            id: hackathon.id,
            title: hackathon.title || 'Untitled Hackathon',
            tagline: hackathon.tagline || '',
            description: hackathon.summary || '',
            summary: hackathon.summary || '',
            theme: hackathon.theme || 'General',
            location: hackathon.location || 'Virtual',
            mode: { Online: null },
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
            updated_at: timestampToDate(BigInt(hackathon.createdAt)),
            organizer: hackathon.organizer.toText(),
            categories: hackathon.categories || [],
            rewards: hackathon.rewards || [],
            isOwner: true,
            canEdit: true,
            canDelete: true,
            participantCount: 0,
            teamsCount: 0,
          });
        }
      } catch (error) {
        // If participant lookup fails, try principal comparison as fallback
        const organizerPrincipalText = hackathon.organizer.toText();
        if (organizerPrincipalText === userPrincipalText) {
          console.log(`✅ Hackathon ${hackathon.id}: Created by user (verified by principal match after lookup error)`);
          const timestampToDate = (ts: bigint) => {
            const millis = Number(ts) / 1_000_000;
            return new Date(millis).toISOString();
          };

          userHackathons.push({
            hackathon_id: hackathon.id,
            id: hackathon.id,
            title: hackathon.title || 'Untitled Hackathon',
            tagline: hackathon.tagline || '',
            description: hackathon.summary || '',
            summary: hackathon.summary || '',
            theme: hackathon.theme || 'General',
            location: hackathon.location || 'Virtual',
            mode: { Online: null },
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
            updated_at: timestampToDate(BigInt(hackathon.createdAt)),
            organizer: hackathon.organizer.toText(),
            categories: hackathon.categories || [],
            rewards: hackathon.rewards || [],
            isOwner: true,
            canEdit: true,
            canDelete: true,
            participantCount: 0,
            teamsCount: 0,
          });
        } else {
          console.warn(`⚠️ Could not verify ownership for hackathon ${hackathon.id} (organizer: ${organizerPrincipalText}):`, error);
        }
      }
    }

    console.log(`✅ Found ${userHackathons.length} hackathons for user ${userEmail}`);

    return NextResponse.json({
      success: true,
      hackathons: userHackathons,
      total: userHackathons.length
    });

  } catch (error) {
    console.error('Error fetching user hackathons:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch hackathons',
      hackathons: []
    }, { status: 500 });
  }
}

