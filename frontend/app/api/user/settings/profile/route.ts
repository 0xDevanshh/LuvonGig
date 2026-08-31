import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { getUserActor } from '@/lib/ic-agent';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    const {
      firstName,
      lastName,
      phone,
      location,
      bio,
      github,
      linkedin,
      website,
    }: {
      firstName: string;
      lastName: string;
      phone?: string;
      location?: string;
      bio?: string;
      github?: string;
      linkedin?: string;
      website?: string;
    } = await request.json();

    if (!firstName || !lastName) {
      return NextResponse.json({
        success: false,
        error: 'First name and last name are required'
      }, { status: 400 });
    }

    const actor = await getUserActor();
    const profileData = {
      firstName,
      lastName,
      bio: bio || null,
      phone: phone || null,
      location: location || null,
      website: website || null,
      linkedin: linkedin || null,
      github: github || null,
      skills: [],
      experience: [],
      education: [],
    };

    const result = await actor.updateProfile(session.userId, profileData);
    if ('err' in result) {
      return NextResponse.json({
        success: false,
        error: result.err,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Profile settings error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update profile settings',
    }, { status: 500 });
  }
}

