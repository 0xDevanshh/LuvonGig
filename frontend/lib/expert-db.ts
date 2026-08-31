import { getDbPool } from './db/chat-db';

/**
 * Initialize Expert specific tables in Postgres
 */
export async function initializeExpertTables(): Promise<void> {
    const pool = getDbPool();

    try {
        // Create experts table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS experts (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        picture_url TEXT,
        expertise TEXT NOT NULL,
        session_amount_icp DECIMAL(20, 8) NOT NULL,
        calendly_link TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create expert_bookings table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS expert_bookings (
        id SERIAL PRIMARY KEY,
        expert_id INTEGER REFERENCES experts(id),
        client_email VARCHAR(255) NOT NULL,
        amount_icp DECIMAL(20, 8) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
        payment_id VARCHAR(255), -- ICPay transaction ID
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Indexes for performance
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_expert_bookings_expert_id ON expert_bookings(expert_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_expert_bookings_client ON expert_bookings(client_email)`);

        console.log('[ExpertDB] Expert tables initialized successfully');
    } catch (error) {
        console.error('[ExpertDB] Error initializing expert tables:', error);
        throw error;
    }
}

export const expertDb = {
    // Expert Profile
    async getExpertByEmail(email: string) {
        const pool = getDbPool();
        const result = await pool.query('SELECT * FROM experts WHERE user_email = $1', [email]);
        return result.rows[0] || null;
    },

    async registerExpert(data: {
        user_email: string;
        name: string;
        picture_url?: string;
        expertise: string;
        session_amount_icp: number;
        calendly_link: string;
        description: string;
    }) {
        const pool = getDbPool();
        const { user_email, name, picture_url, expertise, session_amount_icp, calendly_link, description } = data;

        const result = await pool.query(
            `INSERT INTO experts (user_email, name, picture_url, expertise, session_amount_icp, calendly_link, description, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (user_email) 
       DO UPDATE SET 
         name = EXCLUDED.name,
         picture_url = EXCLUDED.picture_url,
         expertise = EXCLUDED.expertise,
         session_amount_icp = EXCLUDED.session_amount_icp,
         calendly_link = EXCLUDED.calendly_link,
         description = EXCLUDED.description,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
            [user_email, name, picture_url || null, expertise, session_amount_icp, calendly_link, description]
        );
        return result.rows[0];
    },

    async listExperts() {
        const pool = getDbPool();
        const result = await pool.query('SELECT * FROM experts ORDER BY created_at DESC');
        return result.rows;
    },

    // Bookings
    async createBooking(data: {
        expert_id: number;
        client_email: string;
        amount_icp: number;
        payment_id?: string;
    }) {
        const pool = getDbPool();
        const { expert_id, client_email, amount_icp, payment_id } = data;
        console.log('[ExpertDB] Creating booking:', { expert_id, client_email, amount_icp, payment_id });

        const result = await pool.query(
            `INSERT INTO expert_bookings (expert_id, client_email, amount_icp, payment_id, payment_status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
            [expert_id, client_email, amount_icp, payment_id || null]
        );
        console.log('[ExpertDB] Booking created with ID:', result.rows[0].id);
        return result.rows[0];
    },

    async updateBookingStatus(bookingId: number, status: string, paymentId?: string) {
        const pool = getDbPool();
        console.log('[ExpertDB] Updating booking status:', { bookingId, status, paymentId });
        await pool.query(
            `UPDATE expert_bookings 
       SET payment_status = $1, payment_id = COALESCE($2, payment_id), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
            [status, paymentId || null, bookingId]
        );
        console.log('[ExpertDB] Booking status updated successfully');
    },

    // Dashboard Stats
    async getExpertStats(expertId: number) {
        const pool = getDbPool();

        // Total bookings (paid)
        const bookingsResult = await pool.query(
            'SELECT COUNT(*) as count FROM expert_bookings WHERE expert_id = $1 AND payment_status = $2',
            [expertId, 'paid']
        );

        // Total unique customers (paid)
        const customersResult = await pool.query(
            'SELECT COUNT(DISTINCT client_email) as count FROM expert_bookings WHERE expert_id = $1 AND payment_status = $2',
            [expertId, 'paid']
        );

        // List of recent customers
        const recentCustomersResult = await pool.query(
            `SELECT client_email, amount_icp, created_at 
       FROM expert_bookings 
       WHERE expert_id = $1 AND payment_status = $2
       ORDER BY created_at DESC LIMIT 10`,
            [expertId, 'paid']
        );

        return {
            bookingCount: parseInt(bookingsResult.rows[0].count),
            customerCount: parseInt(customersResult.rows[0].count),
            recentCustomers: recentCustomersResult.rows
        };
    },

    async getUserBookings(email: string) {
        const pool = getDbPool();
        const result = await pool.query(
            `SELECT eb.*, e.name as expert_name, e.expertise as expert_expertise, e.picture_url as expert_picture
       FROM expert_bookings eb
       JOIN experts e ON eb.expert_id = e.id
       WHERE eb.client_email = $1 AND eb.payment_status = $2
       ORDER BY eb.created_at DESC`,
            [email, 'paid']
        );
        return result.rows;
    }
};
