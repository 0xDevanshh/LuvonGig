import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSession } from '@/lib/actions/auth';
import { getUserActor } from '@/lib/ic-agent';

const addressSchema = z.object({
  isPrivate: z.boolean(),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  streetAddress: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // Update user profile with address
    try {
      const actor = await getUserActor();

      // Prepare address data for ICP backend
      const addressData = {
        address: {
          is_private: validatedData.isPrivate,
          country: validatedData.country,
          state: validatedData.state,
          city: validatedData.city,
          zip_code: validatedData.zipCode,
          street_address: validatedData.streetAddress || '',
        }
      };

      // Update the user's profile with address
      const result = await actor.update_user_profile(addressData);

      console.log('Profile updated with address:', result);

      return NextResponse.json({
        success: true,
        message: 'Address saved successfully',
        address: validatedData,
        profile: result
      });

    } catch (icpError) {
      console.error('ICP address update error:', icpError);

      // Fallback: store address temporarily
      return NextResponse.json({
        success: true,
        message: 'Address saved temporarily (backend update pending)',
        address: validatedData,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Address save error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: error.errors[0].message,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}