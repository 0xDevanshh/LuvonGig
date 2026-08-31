import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
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

  const SubmissionStatus = IDL.Variant({
    Draft: IDL.Null,
    Submitted: IDL.Null,
    UnderReview: IDL.Null,
    Selected: IDL.Null,
    Rejected: IDL.Null,
  });

  const Submission = IDL.Record({
    id: IDL.Text,
    hackathonId: IDL.Text,
    teamId: IDL.Text,
    categoryId: IDL.Text,
    title: IDL.Text,
    summary: IDL.Text,
    description: IDL.Text,
    repoUrl: IDL.Text,
    demoUrl: IDL.Text,
    gallery: IDL.Vec(IDL.Text),
    submittedAt: IDL.Int,
    status: SubmissionStatus,
  });

  return IDL.Service({
    submitProject: IDL.Func(
      [
        IDL.Record({
          teamId: IDL.Text,
          title: IDL.Text,
          summary: IDL.Text,
          description: IDL.Text,
          repoUrl: IDL.Text,
          demoUrl: IDL.Text,
          gallery: IDL.Vec(IDL.Text),
        }),
        IDL.Principal, // principal parameter
      ],
      [IDL.Variant({ ok: Submission, err: HackQuestError })],
      []
    ),
  });
};

const createHackquestActor = async () => {
  const agent = new HttpAgent({ host: IC_HOST });
  if (IC_HOST.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }
  // No identity needed - principal is passed as parameter to the function
  return Actor.createActor(hackquestIdl as any, {
    agent,
    canisterId: Principal.fromText(CANISTER_ID),
  });
};

// POST /api/hackquest/submit-project - Submit a project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, principal, title, summary, description, repoUrl, demoUrl, gallery } = body;

    if (!teamId || !principal || !title || !summary || !description) {
      return NextResponse.json({
        success: false,
        error: 'Team ID, principal, title, summary, and description are required'
      }, { status: 400 });
    }

    if (!repoUrl && !demoUrl) {
      return NextResponse.json({
        success: false,
        error: 'At least one of repository URL or demo URL is required'
      }, { status: 400 });
    }

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    console.log('🔍 Submitting project:', { teamId, principal, title });

    const userPrincipal = Principal.fromText(principal);
    const actor: any = await createHackquestActor();
    
    // Pass principal as parameter (no wallet/identity needed)
    const result = await actor.submitProject(
      {
        teamId,
        title,
        summary,
        description,
        repoUrl: repoUrl || '',
        demoUrl: demoUrl || '',
        gallery: gallery || [],
      },
      userPrincipal
    );

    if ('err' in result) {
      const error = result.err;
      let errorMessage = 'Failed to submit project';
      
      if ('ValidationError' in error) {
        errorMessage = error.ValidationError;
      } else if ('InvalidState' in error) {
        errorMessage = error.InvalidState;
      } else if ('NotAuthorized' in error) {
        errorMessage = 'Not authorized to submit for this team';
      } else if ('NotFound' in error) {
        errorMessage = error.NotFound;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 400 });
    }

    const submission = result.ok;
    console.log('✅ Project submitted successfully');

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        hackathonId: submission.hackathonId,
        teamId: submission.teamId,
        categoryId: submission.categoryId,
        title: submission.title,
        summary: submission.summary,
        description: submission.description,
        repoUrl: submission.repoUrl,
        demoUrl: submission.demoUrl,
        gallery: submission.gallery,
        submittedAt: Number(submission.submittedAt) / 1_000_000,
        status: submission.status,
      }
    });

  } catch (error) {
    console.error('Error submitting project:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit project'
    }, { status: 500 });
  }
}

