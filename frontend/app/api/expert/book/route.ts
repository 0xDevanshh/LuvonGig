import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { expertDb, initializeExpertTables } from '@/lib/expert-db';
import { sendEmail } from '@/lib/email';
import { getDbPool } from '@/lib/db/chat-db';

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Initialize tables if they don't exist
        await initializeExpertTables();

        const { expert_id, payment_id, transaction_id, amount_icp } = await request.json();
        console.log('[API] Booking request:', { expert_id, payment_id, transaction_id, amount_icp, client: session.email });

        if (!expert_id || !amount_icp) {
            return NextResponse.json({ success: false, error: 'Missing booking details' }, { status: 400 });
        }

        const actualPaymentId = payment_id || 'sandbox_success';
        const actualTransactionId = transaction_id || 'sandbox_tx';

        const expertIdInt = parseInt(expert_id.toString());
        const amountFloat = parseFloat(amount_icp.toString());

        // 1. Create the booking record in Postgres
        const booking = await expertDb.createBooking({
            expert_id: expertIdInt,
            client_email: session.email,
            amount_icp: amountFloat,
            payment_id: actualPaymentId
        });

        console.log('[API] Booking record created:', booking.id);

        // 2. Mark as paid (since this is called after successful payment)
        await expertDb.updateBookingStatus(booking.id, 'paid', actualTransactionId);
        console.log('[API] Booking status updated to paid');

        // 3. Get Expert details for the Calendly link
        const pool = getDbPool();
        const expertResult = await pool.query('SELECT * FROM experts WHERE id = $1', [expert_id]);
        const expert = expertResult.rows[0];

        if (expert) {
            // 4. Send Email with Calendly link to the client
            try {
                await sendEmail({
                    to: session.email,
                    subject: `Your Expert Session with ${expert.name} is Confirmed!`,
                    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 8px;">
              <h2 style="color: #7c3aed;">Booking Confirmed!</h2>
              <p>Hi there,</p>
              <p>Your payment of <strong>${amount_icp} ICP</strong> for a session with <strong>${expert.name}</strong> has been successfully processed.</p>
              <div style="background-color: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #5b21b6;">Next Step: Schedule your session</h3>
                <p>Please use the link below to book your time slot on ${expert.name}'s calendar:</p>
                <a href="${expert.calendly_link}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Schedule on Calendly</a>
              </div>
              <p>Expertise: ${expert.expertise}</p>
              <p>If you have any questions, feel free to reply to this email.</p>
              <p>Best regards,<br/>The Workbudd Team</p>
            </div>
          `
                });

                // Also notify the expert
                await sendEmail({
                    to: expert.user_email,
                    subject: `New Booking: A user booked an expert session!`,
                    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 8px;">
              <h2 style="color: #7c3aed;">New Session Booked!</h2>
              <p>Hi ${expert.name},</p>
              <p><strong>${session.email}</strong> has just booked a session with you and paid <strong>${amount_icp} ICP</strong>.</p>
              <p>They have been sent your Calendly link to schedule the meeting.</p>
              <p>Check your dashboard for more details.</p>
              <p>Best regards,<br/>The Workbudd Team</p>
            </div>
          `
                });
            } catch (emailError) {
                console.error('Failed to send booking emails:', emailError);
                // We don't fail the whole request if email fails, but we log it
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Booking confirmed and invite sent',
            bookingId: booking.id
        });
    } catch (error) {
        console.error('Expert booking error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
