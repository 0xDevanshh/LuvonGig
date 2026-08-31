import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
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
    categoryId: IDL.Text, // Non-optional in canister (CategoryId is Text)
    title: IDL.Text,
    summary: IDL.Text,
    description: IDL.Text,
    repoUrl: IDL.Text,
    demoUrl: IDL.Text,
    gallery: IDL.Vec(IDL.Text),
    submittedAt: IDL.Int,
    status: SubmissionStatus,
  });

  const HackQuestError = IDL.Variant({
    NotFound: IDL.Text,
    ValidationError: IDL.Text,
    InvalidState: IDL.Text,
    NotAuthorized: IDL.Null,
  });

  return IDL.Service({
    listSubmissions: IDL.Func(
      [IDL.Text, IDL.Opt(IDL.Text)],
      [IDL.Vec(Submission)],
      ['query']
    ),
    updateSubmission: IDL.Func(
      [
        IDL.Text, // submissionId
        IDL.Principal, // principal
        IDL.Record({
          title: IDL.Opt(IDL.Text),
          summary: IDL.Opt(IDL.Text),
          description: IDL.Opt(IDL.Text),
          repoUrl: IDL.Opt(IDL.Text),
          demoUrl: IDL.Opt(IDL.Text),
          status: IDL.Opt(SubmissionStatus),
        }),
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
  return Actor.createActor(hackquestIdl as any, {
    agent,
    canisterId: Principal.fromText(CANISTER_ID),
  });
};

// GET /api/hackquest/submission/[submissionId] - Get submission details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;

    if (!submissionId) {
      return NextResponse.json({
        success: false,
        error: 'Submission ID is required'
      }, { status: 400 });
    }

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    console.log('🔍 Fetching submission:', submissionId);

    const actor: any = await createHackquestActor();
    
    const { searchParams } = new URL(request.url);
    const hackathonId = searchParams.get('hackathonId');
    
    if (!hackathonId) {
      return NextResponse.json({
        success: false,
        error: 'Hackathon ID is required as query parameter'
      }, { status: 400 });
    }

    const submissions = await actor.listSubmissions(hackathonId, []);
    
    const submission = submissions.find((s: any) => s.id === submissionId);
    
    if (!submission) {
      return NextResponse.json({
        success: false,
        error: 'Submission not found'
      }, { status: 404 });
    }

    const transformedSubmission = {
      id: submission.id,
      hackathonId: submission.hackathonId,
      teamId: submission.teamId,
      categoryId: submission.categoryId || null, // categoryId is Text in canister, not optional
      title: submission.title,
      summary: submission.summary,
      description: submission.description,
      repoUrl: submission.repoUrl,
      demoUrl: submission.demoUrl,
      gallery: submission.gallery || [],
      submittedAt: Number(submission.submittedAt),
      status: submission.status,
    };

    console.log(`✅ Submission found: ${transformedSubmission.title}`);

    return NextResponse.json({
      success: true,
      data: transformedSubmission
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch submission',
    }, { status: 500 });
  }
}

// PUT /api/hackquest/submission/[submissionId] - Update submission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const body = await request.json();
    const { principal, title, summary, description, repoUrl, demoUrl, status } = body;

    if (!submissionId) {
      return NextResponse.json({
        success: false,
        error: 'Submission ID is required'
      }, { status: 400 });
    }

    if (!principal) {
      return NextResponse.json({
        success: false,
        error: 'Principal is required'
      }, { status: 400 });
    }

    if (!CANISTER_ID) {
      return NextResponse.json({
        success: false,
        error: 'HackQuest canister ID not configured'
      }, { status: 500 });
    }

    console.log('🔍 Updating submission:', submissionId);

    const userPrincipal = Principal.fromText(principal);
    const actor: any = await createHackquestActor();
    
    // Build update data - all fields must be present in the record, even if optional
    // Optional fields in Motoko are represented as arrays: [] for null, [value] for Some(value)
    // For optional variants like status, pass [] for None or [{ VariantName: null }] for Some
    const updateData: Record<string, any> = {};
    
    // Always include all required keys, even if not updating them
    updateData.title = title !== undefined && title ? [title] : [];
    updateData.summary = summary !== undefined && summary ? [summary] : [];
    updateData.description = description !== undefined && description ? [description] : [];
    updateData.repoUrl = repoUrl !== undefined && repoUrl ? [repoUrl] : [];
    updateData.demoUrl = demoUrl !== undefined && demoUrl ? [demoUrl] : [];
    
    // Handle status - if provided, wrap in array, otherwise pass empty array for None
    if (status !== undefined && status !== null) {
      // If status is provided, wrap it in an array: [{ Draft: null }] etc.
      updateData.status = [status];
    } else {
      // Not updating status, pass empty array for None
      updateData.status = [];
    }
    
    console.log('📝 Update data structure:', {
      hasTitle: 'title' in updateData,
      hasSummary: 'summary' in updateData,
      hasDescription: 'description' in updateData,
      hasRepoUrl: 'repoUrl' in updateData,
      hasDemoUrl: 'demoUrl' in updateData,
      hasStatus: 'status' in updateData,
      keys: Object.keys(updateData),
      data: JSON.stringify(updateData, null, 2)
    });
    
    const result = await actor.updateSubmission(submissionId, userPrincipal, updateData);

    if ('err' in result) {
      const error = result.err;
      let errorMessage = 'Failed to update submission';
      
      if ('ValidationError' in error) {
        errorMessage = error.ValidationError;
      } else if ('InvalidState' in error) {
        errorMessage = error.InvalidState;
      } else if ('NotAuthorized' in error) {
        errorMessage = 'Not authorized to update this submission';
      } else if ('NotFound' in error) {
        errorMessage = error.NotFound;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 400 });
    }

    const submission = result.ok;
    const transformedSubmission = {
      id: submission.id,
      hackathonId: submission.hackathonId,
      teamId: submission.teamId,
      categoryId: submission.categoryId || null,
      title: submission.title,
      summary: submission.summary,
      description: submission.description,
      repoUrl: submission.repoUrl,
      demoUrl: submission.demoUrl,
      gallery: submission.gallery || [],
      submittedAt: Number(submission.submittedAt),
      status: submission.status,
    };

    console.log(`✅ Submission updated: ${transformedSubmission.title}`);

    return NextResponse.json({
      success: true,
      data: transformedSubmission
    });

  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update submission',
    }, { status: 500 });
  }
}
