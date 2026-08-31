import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST;

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
  const Participant = IDL.Record({
    principal: IDL.Principal,
    displayName: IDL.Text,
    email: IDL.Text,
    joinedAt: IDL.Int,
  });

  return IDL.Service({
    listParticipantsForHackathon: IDL.Func(
      [IDL.Text],
      [IDL.Vec(Participant)],
      ['query']
    ),
    getParticipant: IDL.Func(
      [IDL.Principal],
      [IDL.Opt(Participant)],
      ['query']
    ),
    getHackathonDetails: IDL.Func(
      [IDL.Text],
      [IDL.Opt(IDL.Record({
        hackathon: IDL.Record({
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
        }),
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

// GET /api/debug/hackathon-participants?hackathonId=hack-3
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hackathonId = searchParams.get('hackathonId') || 'hack-3';

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    console.log(`🔍 Debug: Fetching participants for hackathon: ${hackathonId}`);

    const actor: any = await createHackquestActor();

    // Get hackathon details
    let hackathonDetails = null;
    try {
      const detailsResult = await actor.getHackathonDetails(hackathonId);
      if (detailsResult && detailsResult[0]) {
        hackathonDetails = {
          id: detailsResult[0].hackathon.id,
          title: detailsResult[0].hackathon.title,
          organizer: detailsResult[0].hackathon.organizer.toText(),
        };
      }
    } catch (error) {
      console.warn('Could not get hackathon details:', error);
    }

    // Get participants from hackathon-specific list (organizers, team leaders, team members)
    const hackathonParticipants = await actor.listParticipantsForHackathon(hackathonId);
    console.log(`📋 Found ${hackathonParticipants.length} participants in hackathon-specific list for ${hackathonId}`);
    
    // Note: listParticipantsForHackathon only includes:
    // - Organizers
    // - Team leaders
    // - Team members
    // It does NOT include participants who just registered but haven't joined a team yet
    // This is a limitation of the current canister design where registration is global
    const participants = hackathonParticipants;

    // Get teams to see team structure
    let teams = [];
    try {
      teams = await actor.listTeams(hackathonId, []);
      console.log(`👥 Found ${teams.length} teams for hackathon ${hackathonId}`);
    } catch (error) {
      console.warn('Could not get teams:', error);
    }

    // Format participants data
    const formattedParticipants = participants.map((p: any) => ({
      principal: p.principal.toText(),
      displayName: p.displayName,
      email: p.email,
      joinedAt: new Date(Number(p.joinedAt) / 1_000_000).toISOString(),
      joinedAtTimestamp: Number(p.joinedAt),
    }));

    // Format teams data
    const formattedTeams = teams.map((team: any) => ({
      id: team.id,
      name: team.name,
      leader: team.leader.toText(),
      leaderEmail: formattedParticipants.find((p: any) => p.principal === team.leader.toText())?.email || 'Unknown',
      members: team.members.map((member: any) => {
        const memberParticipant = formattedParticipants.find((p: any) => p.principal === member.principal.toText());
        return {
          principal: member.principal.toText(),
          email: memberParticipant?.email || 'Unknown',
          displayName: memberParticipant?.displayName || 'Unknown',
          accepted: member.accepted,
          invitedAt: new Date(Number(member.invitedAt) / 1_000_000).toISOString(),
          acceptedAt: member.acceptedAt[0] 
            ? new Date(Number(member.acceptedAt[0]) / 1_000_000).toISOString()
            : null,
        };
      }),
      categoryId: team.categoryId[0] || null,
      createdAt: new Date(Number(team.createdAt) / 1_000_000).toISOString(),
    }));

    // Find participants who are not in any team
    const participantsInTeams = new Set<string>();
    teams.forEach((team: any) => {
      participantsInTeams.add(team.leader.toText());
      team.members.forEach((member: any) => {
        participantsInTeams.add(member.principal.toText());
      });
    });

    const participantsNotInTeams = formattedParticipants.filter(
      (p: any) => !participantsInTeams.has(p.principal)
    );

    return NextResponse.json({
      success: true,
      hackathonId,
      hackathon: hackathonDetails,
      summary: {
        totalParticipants: participants.length,
        totalTeams: teams.length,
        participantsInTeams: participantsInTeams.size,
        participantsNotInTeams: participantsNotInTeams.length,
      },
      participants: formattedParticipants,
      teams: formattedTeams,
      participantsNotInTeams: participantsNotInTeams,
      raw: {
        participantsCount: participants.length,
        teamsCount: teams.length,
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch participants',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

