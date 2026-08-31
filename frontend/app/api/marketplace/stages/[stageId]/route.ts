import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceActor, handleApiError, validateMarketplaceConfig } from '@/lib/ic-marketplace-agent';

// GET /api/marketplace/stages/[stageId] - Get stage by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stageId: string }> }
) {
  try {
    // Validate configuration
    try {
      validateMarketplaceConfig();
    } catch (configError) {
      console.warn('Marketplace configuration missing:', configError);
      return NextResponse.json({
        success: false,
        error: 'Marketplace service not configured'
      }, { status: 503 });
    }

    const { stageId } = await params;

    if (!stageId) {
      return NextResponse.json({
        success: false,
        error: 'Stage ID is required'
      }, { status: 400 });
    }

    // Use mock agent for testing
    const actor = await getMarketplaceActor();
    const result = await actor.getStageById(stageId);

    if ('ok' in result) {
      return NextResponse.json({
        success: true,
        data: result.ok
      });
    } else {
      return NextResponse.json({
        success: false,
        error: handleApiError(result.err)
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching stage:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}

// PUT /api/marketplace/stages/[stageId] - Submit, approve, or reject stage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ stageId: string }> }
) {
  try {
    const { stageId } = await params;
    const body = await request.json();
    const { action, userId, notes, artifacts, reason } = body;

    if (!action || !['submit', 'approve', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Action must be submit, approve, or reject'
      }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Use mock agent for testing
    const actor = await getMarketplaceActor();
    let result;

    switch (action) {
      case 'submit':
        if (!notes) {
          return NextResponse.json({
            success: false,
            error: 'Submission notes are required'
          }, { status: 400 });
        }
        result = await actor.submitStage(userId, stageId, notes, artifacts || []);
        break;
      
      case 'approve':
        result = await actor.approveStage(userId, stageId);
        break;
      
      case 'reject':
        if (!reason) {
          return NextResponse.json({
            success: false,
            error: 'Rejection reason is required'
          }, { status: 400 });
        }
        result = await actor.rejectStage(userId, stageId, reason);
        break;
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    if ('ok' in result) {
      return NextResponse.json({
        success: true,
        data: result.ok,
        action: action
      });
    } else {
      return NextResponse.json({
        success: false,
        error: handleApiError(result.err)
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating stage:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}
