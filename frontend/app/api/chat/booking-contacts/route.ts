import { NextRequest, NextResponse } from 'next/server';

interface BookingContact {
  email: string;
  name: string;
  serviceTitle: string;
  bookingId: string;
  status: string;
  lastMessage?: {
    text: string;
    timestamp: string;
  };
  type: 'client' | 'freelancer';
}

// Mock booking data - in real implementation, this would come from marketplace canister
const mockBookings = [
  {
    booking_id: 'BK_test001',
    client_id: 'client@example.com',
    freelancer_id: 'freelancer@example.com',
    service_id: 'service001',
    status: 'Active',
    created_at: Date.now() - 86400000, // 1 day ago
    package_id: 'pkg001'
  },
  {
    booking_id: 'BK_test002',
    client_id: 'client2@example.com',
    freelancer_id: 'freelancer@example.com',
    service_id: 'service002',
    status: 'Active',
    created_at: Date.now() - 172800000, // 2 days ago
    package_id: 'pkg002'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const userType = searchParams.get('userType') as 'client' | 'freelancer';

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Filter bookings where the user is either client or freelancer
    const userBookings = mockBookings.filter(booking => {
      if (userType === 'client') {
        return booking.client_id === userEmail;
      } else {
        return booking.freelancer_id === userEmail;
      }
    });

    // Transform bookings into contact list
    const bookingContacts: BookingContact[] = userBookings.map(booking => {
      const isClient = booking.client_id === userEmail;
      const contactEmail = isClient ? booking.freelancer_id : booking.client_id;
      const contactType = isClient ? 'freelancer' : 'client';

      // Use default service title
      const serviceTitle = 'Service Package';

      return {
        email: contactEmail,
        name: contactEmail.split('@')[0], // Use email prefix as name
        serviceTitle,
        bookingId: booking.booking_id,
        status: booking.status,
        type: contactType,
        lastMessage: {
          text: `Booking confirmed for ${serviceTitle}`,
          timestamp: new Date(booking.created_at).toISOString()
        }
      };
    });

    // Remove duplicates by email
    const uniqueContacts = bookingContacts.filter((contact, index, self) =>
      index === self.findIndex(c => c.email === contact.email)
    );

    return NextResponse.json({
      success: true,
      contacts: uniqueContacts,
      count: uniqueContacts.length
    });

  } catch (error) {
    console.error('Error getting booking contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}