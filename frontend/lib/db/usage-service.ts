import { getDbPool } from './chat-db';

export interface UserUsage {
    email: string;
    plan: 'Basic' | 'Premium';
    connects: number;
    daily_messages_count: number;
    last_message_reset: Date;
    last_connects_reset: Date;
    plan_expires_at: Date | null;
    marketplace_fee: number;
}

const PLAN_CONFIG = {
    Basic: { connects: 30, messages: 5, fee: 0.04 },
    Premium: { connects: 60, messages: 15, fee: 0.03 }
};

export async function getUserUsage(email: string): Promise<UserUsage | null> {
    const pool = getDbPool();

    try {
        // 1. Try to fetch existing
        let result = await pool.query('SELECT * FROM user_usage WHERE email = $1', [email]);

        // 2. If not exists, create with Basic plan
        if (result.rows.length === 0) {
            await pool.query(
                'INSERT INTO user_usage (email, plan, connects) VALUES ($1, $2, $3)',
                [email, 'Basic', PLAN_CONFIG.Basic.connects]
            );
            result = await pool.query('SELECT * FROM user_usage WHERE email = $1', [email]);
        }

        const usage = result.rows[0];

        // 3. Live expiration check for Premium plan
        const now = new Date();
        if (usage.plan === 'Premium' && usage.plan_expires_at) {
            const expiresAt = new Date(usage.plan_expires_at);
            if (expiresAt < now) {
                console.log(`[UsageService] Plan expired for ${email}. Downgrading to Basic.`);
                await pool.query(
                    "UPDATE user_usage SET plan = 'Basic', plan_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = $1",
                    [email]
                );
                // Log history for automatic downgrade
                await pool.query(
                    "INSERT INTO connects_history (email, amount, transaction_type, description) VALUES ($1, $2, $3, $4)",
                    [email, 0, 'downgrade', 'Subscription expired. Automatically downgraded to Basic.']
                );

                // Update local object for return
                usage.plan = 'Basic';
                usage.plan_expires_at = null;
            }
        }

        // 4. Check for daily message reset (24h)
        const lastReset = new Date(usage.last_message_reset);
        const diffHours = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

        if (diffHours >= 24) {
            await pool.query(
                'UPDATE user_usage SET daily_messages_count = 0, last_message_reset = CURRENT_TIMESTAMP WHERE email = $1',
                [email]
            );
            usage.daily_messages_count = 0;
            usage.last_message_reset = now;
        }

        return {
            ...usage,
            marketplace_fee: usage.plan === 'Premium' ? PLAN_CONFIG.Premium.fee : PLAN_CONFIG.Basic.fee
        };
    } catch (error) {
        console.error('Error fetching user usage:', error);
        return null;
    }
}

export async function canSendMessage(email: string): Promise<{ allowed: boolean; remaining: number; error?: string }> {
    const usage = await getUserUsage(email);
    if (!usage) return { allowed: false, remaining: 0, error: 'User usage data not found' };

    const limit = PLAN_CONFIG[usage.plan].messages;
    if (usage.daily_messages_count >= limit) {
        return { allowed: false, remaining: 0, error: `Daily message limit reached (${limit} per day)` };
    }

    return { allowed: true, remaining: limit - usage.daily_messages_count };
}

export async function incrementMessageCount(email: string): Promise<boolean> {
    const pool = getDbPool();
    try {
        await pool.query(
            'UPDATE user_usage SET daily_messages_count = daily_messages_count + 1 WHERE email = $1',
            [email]
        );
        return true;
    } catch (error) {
        console.error('Error incrementing message count:', error);
        return false;
    }
}

export async function deductConnects(email: string, amount: number, description?: string): Promise<{ success: boolean; error?: string }> {
    const pool = getDbPool();
    try {
        const usage = await getUserUsage(email);
        if (!usage) return { success: false, error: 'User not found' };

        if (usage.connects < amount) {
            return { success: false, error: 'Insufficient connects' };
        }

        await pool.query(
            'UPDATE user_usage SET connects = connects - $1 WHERE email = $2',
            [amount, email]
        );

        // Log history
        await logConnectsHistory(email, -amount, 'deduction', description || 'Connects deducted for bidding');

        return { success: true };
    } catch (error) {
        console.error('Error deducting connects:', error);
        return { success: false, error: 'Database error' };
    }
}

export async function upgradePlan(email: string, newPlan: 'Basic' | 'Premium'): Promise<boolean> {
    const pool = getDbPool();
    try {
        const connectsToAdd = PLAN_CONFIG[newPlan].connects;
        const currentUsage = await getUserUsage(email);
        const oldPlan = currentUsage?.plan || 'Unknown';

        // Only process if the plan is actually changing
        if (newPlan !== oldPlan) {
            if (newPlan === 'Premium') {
                // Set 30-day expiration for Premium
                await pool.query(
                    "UPDATE user_usage SET plan = $1, connects = connects + $2, plan_expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days', updated_at = CURRENT_TIMESTAMP WHERE email = $3",
                    [newPlan, connectsToAdd, email]
                );
            } else {
                // Clear expiration for Basic
                await pool.query(
                    "UPDATE user_usage SET plan = $1, connects = connects + $2, plan_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = $3",
                    [newPlan, connectsToAdd, email]
                );
            }

            // Log history
            await logConnectsHistory(email, connectsToAdd, 'upgrade', `Plan upgraded from ${oldPlan} to ${newPlan}`);
        }

        return true;
    } catch (error) {
        console.error('Error upgrading plan:', error);
        return false;
    }
}

export async function addConnects(email: string, amount: number): Promise<boolean> {
    const pool = getDbPool();
    try {
        await pool.query(
            'UPDATE user_usage SET connects = connects + $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
            [amount, email]
        );

        // Log history
        await logConnectsHistory(email, amount, 'addition', `Purchased ${amount} connects`);

        return true;
    } catch (error) {
        console.error('Error adding connects:', error);
        return false;
    }
}

async function logConnectsHistory(email: string, amount: number, type: string, description: string) {
    const pool = getDbPool();
    try {
        await pool.query(
            'INSERT INTO connects_history (email, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
            [email, amount, type, description]
        );
    } catch (error) {
        console.error('Error logging connects history:', error);
    }
}

export async function getConnectsHistory(email: string) {
    const pool = getDbPool();
    try {
        const result = await pool.query(
            'SELECT * FROM connects_history WHERE email = $1 ORDER BY created_at DESC LIMIT 50',
            [email]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching connects history:', error);
        return [];
    }
}
