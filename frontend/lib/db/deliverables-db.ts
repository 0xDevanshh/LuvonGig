import { getDbPool } from './chat-db';

/**
 * Initialize Deliverables specific tables in Postgres
 */
export async function initializeDeliverablesTables(): Promise<void> {
    const pool = getDbPool();

    try {
        // 1. Deliverables table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS deliverables (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(255) NOT NULL,
        freelancer_email VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        file_url TEXT NOT NULL,
        file_name VARCHAR(255),
        file_size BIGINT,
        file_type VARCHAR(100),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'reviewed', 'approved', 'rejected'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 2. Project Status History table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS project_status_history (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(255) NOT NULL,
        status VARCHAR(100) NOT NULL,
        updated_by VARCHAR(255) NOT NULL, -- email
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Indexes for performance
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_deliverables_booking_id ON deliverables(booking_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_status_history_booking_id ON project_status_history(booking_id)`);

        console.log('[DeliverablesDB] Deliverables tables initialized successfully');
    } catch (error) {
        console.error('[DeliverablesDB] Error initializing deliverables tables:', error);
        throw error;
    }
}

export const deliverablesDb = {
    // Deliverables
    async addDeliverable(data: {
        booking_id: string;
        freelancer_email: string;
        title?: string;
        file_url: string;
        file_name: string;
        file_size?: number;
        file_type?: string;
        notes?: string;
    }) {
        const pool = getDbPool();
        const { booking_id, freelancer_email, title, file_url, file_name, file_size, file_type, notes } = data;

        const result = await pool.query(
            `INSERT INTO deliverables (booking_id, freelancer_email, title, file_url, file_name, file_size, file_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [booking_id, freelancer_email, title || null, file_url, file_name, file_size || null, file_type || null, notes || null]
        );
        return result.rows[0];
    },

    async getDeliverablesByBooking(bookingId: string) {
        const pool = getDbPool();
        const result = await pool.query(
            'SELECT * FROM deliverables WHERE booking_id = $1 ORDER BY created_at DESC',
            [bookingId]
        );
        return result.rows;
    },

    async updateDeliverableStatus(deliverableId: number, status: string) {
        const pool = getDbPool();
        await pool.query(
            'UPDATE deliverables SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [status, deliverableId]
        );
    },

    // Project Status History
    async addStatusUpdate(data: {
        booking_id: string;
        status: string;
        updated_by: string;
        notes?: string;
    }) {
        const pool = getDbPool();
        const { booking_id, status, updated_by, notes } = data;

        const result = await pool.query(
            `INSERT INTO project_status_history (booking_id, status, updated_by, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [booking_id, status, updated_by, notes || null]
        );
        return result.rows[0];
    },

    async getStatusHistoryByBooking(bookingId: string) {
        const pool = getDbPool();
        const result = await pool.query(
            'SELECT * FROM project_status_history WHERE booking_id = $1 ORDER BY created_at DESC',
            [bookingId]
        );
        return result.rows;
    }
};
