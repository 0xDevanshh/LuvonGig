import { NextRequest, NextResponse } from 'next/server';
import { getJobMarketplaceActor, serializeBigInts } from '@/lib/job-marketplace-agent';

// GET /api/marketplace/job-posts/[jobId] - Get specific job post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const actor = await getJobMarketplaceActor();
    const result = await actor.getJobById(jobId);

    if (result && result.length > 0) {
      return NextResponse.json({
        success: true,
        data: serializeBigInts(result[0]),
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Job post not found'
      }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Error fetching job post:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

// PUT /api/marketplace/job-posts/[jobId] - Update job post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json({
        success: false,
        error: 'User ID and updates are required'
      }, { status: 400 });
    }

    const actor = await getJobMarketplaceActor();

    // Map updates to canister parameters
    const budgetRaw = updates.budgetAmount || 0;
    const budgetFloat = typeof budgetRaw === 'string' ? parseFloat(budgetRaw) : Number(budgetRaw);
    const budgetAmount = BigInt(Math.floor(budgetFloat * 100000000));

    const budgetType = updates.budgetType?.HOURLY !== undefined ? { HOURLY: null } : { FIXED: null };
    const requiredSkills = updates.requiredSkills || [];

    const result = await actor.updateJob(
      jobId,
      userId,
      updates.title,
      updates.description,
      requiredSkills,
      budgetType,
      budgetAmount
    );

    if ('ok' in result) {
      return NextResponse.json({
        success: true,
        data: result.ok
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.err
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error updating job post:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

// DELETE /api/marketplace/job-posts/[jobId] - Delete job post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const actor = await getJobMarketplaceActor();
    const result = await actor.deleteJob(jobId, userId);

    if ('ok' in result) {
      return NextResponse.json({
        success: true,
        data: result.ok
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.err
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error deleting job post:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}