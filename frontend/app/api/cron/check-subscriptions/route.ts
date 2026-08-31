import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/chat-db';

export async function GET(request: NextRequest) {
    // Basic security check (could be enhanced with a secret key in headers)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();
    try {
        console.log('[Cron] Checking for expired subscriptions...');

        // Find users to downgrade
        const expiredUsersResult = await pool.query(
            "SELECT email FROM user_usage WHERE plan = 'Premium' AND plan_expires_at < NOW()"
        );

        const expiredEmails = expiredUsersResult.rows.map(r => r.email);

        if (expiredEmails.length > 0) {
            console.log(`[Cron] Downgrading ${expiredEmails.length} expired users:`, expiredEmails);

            // Perform bulk downgrade
            const updateResult = await pool.query(
                "UPDATE user_usage SET plan = 'Basic', plan_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE plan = 'Premium' AND plan_expires_at < NOW()"
            );

            // Log history for each downgraded user
            for (const email of expiredEmails) {
                await pool.query(
                    "INSERT INTO connects_history (email, amount, transaction_type, description) VALUES ($1, $2, $3, $4)",
                    [email, 0, 'downgrade', 'Subscription expired. Automatically downgraded by system cron.']
                );
            }

            return NextResponse.json({
                success: true,
                message: `Successfully downgraded ${updateResult.rowCount} expired users.`,
                affectedEmails: expiredEmails
            });
        }

        return NextResponse.json({ success: true, message: 'No expired subscriptions found.' });

    } catch (error) {
        console.error('[Cron Error] Failed to check subscriptions:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
