import { getDbPool, initializeChatTables } from './db/chat-db';

// Initialize tables on module load
if (typeof window === 'undefined') {
  // Only run on server side
  initializeChatTables().catch(err => {
    console.error('[ChatDB] Failed to initialize tables:', err);
  });
}

export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
  delivered: boolean;
  read: boolean;
  messageType: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: bigint | null;
  replyTo?: string | null;
  bookingId?: string | null;
}

export interface ChatRelationship {
  id: string;
  clientEmail: string;
  freelancerEmail: string;
  bookingId?: string | null;
  serviceTitle?: string | null;
  serviceId?: string | null;
  packageId?: string | null;
  bookingStatus?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Generate unique message ID
function generateMessageId(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const size = 21;
  let id = '';
  for (let i = 0; i < size; i++) {
    id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return `msg_${id}`;
}

// Generate unique relationship ID
function generateRelationshipId(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const size = 21;
  let id = '';
  for (let i = 0; i < size; i++) {
    id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return `rel_${id}`;
}

export const chatDbService = {
  // Save a message
  async saveMessage(
    from: string,
    to: string,
    text: string,
    messageType: string = 'text',
    timestamp?: string,
    fileUrl?: string | null,
    fileName?: string | null,
    fileSize?: bigint | null,
    replyTo?: string | null,
    bookingId?: string | null
  ): Promise<string> {
    const pool = getDbPool();
    const messageId = generateMessageId();
    const messageTimestamp = timestamp ? new Date(timestamp) : new Date();

    try {
      await pool.query(
        `INSERT INTO chat_messages (
          id, from_email, to_email, text, message_type, timestamp, 
          delivered, read_status, file_url, file_name, file_size, reply_to, booking_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          messageId,
          from,
          to,
          text,
          messageType,
          messageTimestamp,
          false, // delivered
          false, // read_status
          fileUrl || null,
          fileName || null,
          fileSize ? Number(fileSize) : null,
          replyTo || null,
          bookingId || null,
        ]
      );

      console.log(`[ChatDB] Message saved: ${from} -> ${to} (${messageId})`);
      return messageId;
    } catch (error) {
      console.error('[ChatDB] Error saving message:', error);
      throw error;
    }
  },

  // Get chat history between two users
  async getChatHistory(
    userEmail: string,
    contactEmail: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    const pool = getDbPool();

    try {
      const result = await pool.query(
        `SELECT * FROM chat_messages 
         WHERE (from_email = $1 AND to_email = $2) 
            OR (from_email = $2 AND to_email = $1)
         ORDER BY timestamp ASC
         LIMIT $3 OFFSET $4`,
        [userEmail, contactEmail, limit, offset]
      );

      return result.rows.map(row => ({
        id: row.id,
        from: row.from_email,
        to: row.to_email,
        text: row.text,
        timestamp: row.timestamp.toISOString(),
        delivered: row.delivered,
        read: row.read_status,
        messageType: row.message_type,
        fileUrl: row.file_url,
        fileName: row.file_name,
        fileSize: row.file_size ? BigInt(row.file_size) : null,
        replyTo: row.reply_to,
        bookingId: row.booking_id,
      }));
    } catch (error) {
      console.error('[ChatDB] Error getting chat history:', error);
      throw error;
    }
  },

  // Get recent chats for a user
  async getRecentChats(
    userEmail: string,
    limit: number = 20
  ): Promise<Array<{ contact: string; lastMessage: ChatMessage }>> {
    const pool = getDbPool();

    try {
      // Get the most recent message for each conversation
      const result = await pool.query(
        `SELECT DISTINCT ON (
          CASE 
            WHEN from_email = $1 THEN to_email 
            ELSE from_email 
          END
        ) 
        id, from_email, to_email, text, message_type, timestamp, 
        delivered, read_status, file_url, file_name, file_size, reply_to, booking_id,
        CASE 
          WHEN from_email = $1 THEN to_email 
          ELSE from_email 
        END as contact
        FROM chat_messages
        WHERE from_email = $1 OR to_email = $1
        ORDER BY 
          CASE 
            WHEN from_email = $1 THEN to_email 
            ELSE from_email 
          END,
          timestamp DESC
        LIMIT $2`,
        [userEmail, limit]
      );

      return result.rows.map(row => ({
        contact: row.contact,
        lastMessage: {
          id: row.id,
          from: row.from_email,
          to: row.to_email,
          text: row.text,
          timestamp: row.timestamp.toISOString(),
          delivered: row.delivered,
          read: row.read_status,
          messageType: row.message_type,
          fileUrl: row.file_url,
          fileName: row.file_name,
          fileSize: row.file_size ? BigInt(row.file_size) : null,
          replyTo: row.reply_to,
          bookingId: row.booking_id,
        },
      }));
    } catch (error) {
      console.error('[ChatDB] Error getting recent chats:', error);
      throw error;
    }
  },

  // Update message status (delivered/read)
  async updateMessageStatus(
    messageId: string,
    delivered?: boolean,
    read?: boolean
  ): Promise<boolean> {
    const pool = getDbPool();

    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (delivered !== undefined) {
        updates.push(`delivered = $${paramIndex}`);
        values.push(delivered);
        paramIndex++;
      }

      if (read !== undefined) {
        updates.push(`read_status = $${paramIndex}`);
        values.push(read);
        paramIndex++;
      }

      if (updates.length === 0) {
        return false;
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(messageId);

      await pool.query(
        `UPDATE chat_messages 
         SET ${updates.join(', ')} 
         WHERE id = $${paramIndex}`,
        values
      );

      return true;
    } catch (error) {
      console.error('[ChatDB] Error updating message status:', error);
      throw error;
    }
  },

  // Create chat relationship
  async createChatRelationship(
    clientEmail: string,
    freelancerEmail: string,
    bookingId?: string,
    serviceTitle?: string,
    serviceId?: string,
    packageId?: string,
    bookingStatus?: string
  ): Promise<string> {
    const pool = getDbPool();
    const relationshipId = generateRelationshipId();

    try {
      await pool.query(
        `INSERT INTO chat_relationships (
          id, client_email, freelancer_email, booking_id, 
          service_title, service_id, package_id, booking_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (client_email, freelancer_email, booking_id) 
        DO UPDATE SET 
          service_title = EXCLUDED.service_title,
          service_id = EXCLUDED.service_id,
          package_id = EXCLUDED.package_id,
          booking_status = EXCLUDED.booking_status,
          updated_at = CURRENT_TIMESTAMP`,
        [
          relationshipId,
          clientEmail,
          freelancerEmail,
          bookingId || null,
          serviceTitle || null,
          serviceId || null,
          packageId || null,
          bookingStatus || null,
        ]
      );

      console.log(`[ChatDB] Chat relationship created: ${clientEmail} <-> ${freelancerEmail}`);
      return relationshipId;
    } catch (error) {
      console.error('[ChatDB] Error creating chat relationship:', error);
      throw error;
    }
  },

  // Get chat relationships for a user
  async getChatRelationships(userEmail: string): Promise<ChatRelationship[]> {
    const pool = getDbPool();

    try {
      const result = await pool.query(
        `SELECT * FROM chat_relationships 
         WHERE client_email = $1 OR freelancer_email = $1
         ORDER BY created_at DESC`,
        [userEmail]
      );

      return result.rows.map(row => ({
        id: row.id,
        clientEmail: row.client_email,
        freelancerEmail: row.freelancer_email,
        bookingId: row.booking_id,
        serviceTitle: row.service_title,
        serviceId: row.service_id,
        packageId: row.package_id,
        bookingStatus: row.booking_status,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      }));
    } catch (error) {
      console.error('[ChatDB] Error getting chat relationships:', error);
      throw error;
    }
  },

  // Get total message count (for statistics)
  async getTotalMessages(): Promise<number> {
    const pool = getDbPool();

    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM chat_messages');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('[ChatDB] Error getting total messages:', error);
      return 0;
    }
  },
};


