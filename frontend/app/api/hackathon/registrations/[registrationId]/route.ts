import { NextRequest, NextResponse } from 'next/server';
import { HackathonCanister } from '@/lib/hackathon-canister';

// GET /api/hackathon/registrations/[registrationId] - Get registration by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const { registrationId } = await params;

    if (!registrationId) {
      return NextResponse.json({
        success: false,
        error: 'Registration ID is required'
      }, { status: 400 });
    }

    const registration = await HackathonCanister.getRegistrationById(registrationId);

    return NextResponse.json({
      success: true,
      data: registration
    });
  } catch (error) {
    console.error('Error getting registration:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get registration'
    }, { status: 500 });
  }
}

// DELETE /api/hackathon/registrations/[registrationId] - Delete registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const { registrationId } = await params;

    if (!registrationId) {
      return NextResponse.json({
        success: false,
        error: 'Registration ID is required'
      }, { status: 400 });
    }

    // Note: This would need to be implemented in the canister
    // For now, we'll return a not implemented response
    return NextResponse.json({
      success: false,
      error: 'Registration deletion not yet implemented'
    }, { status: 501 });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete registration'
    }, { status: 500 });
  }
}