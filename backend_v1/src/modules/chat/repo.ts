import { query, queryOne } from '../../db/pool.js';

export interface MessageRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  booking_id: string | null;
  body: string;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_size: string | null;
  reply_to: string | null;
  delivered: boolean;
  read_at: Date | null;
  created_at: Date;
  from_email: string;
  to_email: string;
}

export interface RelationshipRow {
  id: string;
  client_id: string;
  freelancer_id: string;
  booking_id: string | null;
  service_id: string | null;
  service_title: string | null;
  booking_status: string | null;
  created_at: Date;
  updated_at: Date;
  client_email: string;
  freelancer_email: string;
  /** The other participant, from the caller's point of view. */
  contact_id: string;
  contact_email: string;
  contact_name: string;
  last_message: string | null;
  last_message_at: Date | null;
  unread_count: string;
}

const MESSAGE_SELECT = `
  SELECT m.*, fu.email::text AS from_email, tu.email::text AS to_email
    FROM chat_messages m
    JOIN users fu ON fu.id = m.from_user_id
    JOIN users tu ON tu.id = m.to_user_id`;

/**
 * Messages between two people, newest last.
 *
 * Both directions in one query. The caller is always one of the two, which is
 * what makes this safe: there is no shape of this call that returns a
 * conversation the caller is not in.
 */
export async function listConversation(
  userId: string, contactId: string, limit: number, offset: number,
): Promise<MessageRow[]> {
  const { rows } = await query<MessageRow>(
    `${MESSAGE_SELECT}
      WHERE (m.from_user_id = $1 AND m.to_user_id = $2)
         OR (m.from_user_id = $2 AND m.to_user_id = $1)
      ORDER BY m.created_at DESC
      LIMIT $3 OFFSET $4`,
    [userId, contactId, limit, offset],
  );
  return rows.reverse();
}

export async function listForBooking(
  bookingId: string, limit: number, offset: number,
): Promise<MessageRow[]> {
  const { rows } = await query<MessageRow>(
    `${MESSAGE_SELECT} WHERE m.booking_id = $1 ORDER BY m.created_at DESC LIMIT $2 OFFSET $3`,
    [bookingId, limit, offset],
  );
  return rows.reverse();
}

export async function getMessage(id: string): Promise<MessageRow | null> {
  return queryOne<MessageRow>(`${MESSAGE_SELECT} WHERE m.id = $1`, [id]);
}

export interface SendInput {
  id: string;
  fromUserId: string;
  toUserId: string;
  bookingId: string | null;
  body: string;
  messageType: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: string | null;
  replyTo: string | null;
}

export async function insertMessage(m: SendInput): Promise<MessageRow> {
  await query(
    `INSERT INTO chat_messages (id, from_user_id, to_user_id, booking_id, body, message_type,
       file_url, file_name, file_size, reply_to, delivered)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false)`,
    [m.id, m.fromUserId, m.toUserId, m.bookingId, m.body, m.messageType,
     m.fileUrl, m.fileName, m.fileSize, m.replyTo],
  );
  return (await getMessage(m.id))!;
}

/**
 * Marks the OTHER side's messages read. Scoped to `to_user_id = $1` so a
 * caller can only ever mark their own inbox — not clear someone else's unread
 * badge.
 */
export async function markRead(userId: string, contactId: string): Promise<number> {
  const { rowCount } = await query(
    `UPDATE chat_messages SET read_at = now()
      WHERE to_user_id = $1 AND from_user_id = $2 AND read_at IS NULL`,
    [userId, contactId],
  );
  return rowCount ?? 0;
}

export async function markDelivered(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await query('UPDATE chat_messages SET delivered = true WHERE id = ANY($1::text[])', [ids]);
}

const RELATIONSHIP_SELECT = `
  SELECT r.*,
         cu.email::text AS client_email,
         fu.email::text AS freelancer_email,
         CASE WHEN r.client_id = $1 THEN r.freelancer_id ELSE r.client_id END AS contact_id,
         CASE WHEN r.client_id = $1 THEN fu.email::text ELSE cu.email::text END AS contact_email,
         TRIM(CASE WHEN r.client_id = $1
                   THEN COALESCE(fp.first_name,'') || ' ' || COALESCE(fp.last_name,'')
                   ELSE COALESCE(cp.first_name,'') || ' ' || COALESCE(cp.last_name,'') END) AS contact_name,
         (SELECT m.body FROM chat_messages m
           WHERE (m.from_user_id = r.client_id AND m.to_user_id = r.freelancer_id)
              OR (m.from_user_id = r.freelancer_id AND m.to_user_id = r.client_id)
           ORDER BY m.created_at DESC LIMIT 1) AS last_message,
         (SELECT m.created_at FROM chat_messages m
           WHERE (m.from_user_id = r.client_id AND m.to_user_id = r.freelancer_id)
              OR (m.from_user_id = r.freelancer_id AND m.to_user_id = r.client_id)
           ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
         (SELECT count(*)::text FROM chat_messages m
           WHERE m.to_user_id = $1 AND m.read_at IS NULL
             AND m.from_user_id = CASE WHEN r.client_id = $1 THEN r.freelancer_id ELSE r.client_id END
         ) AS unread_count
    FROM chat_relationships r
    JOIN users cu ON cu.id = r.client_id
    JOIN users fu ON fu.id = r.freelancer_id
    LEFT JOIN user_profiles cp ON cp.user_id = r.client_id
    LEFT JOIN user_profiles fp ON fp.user_id = r.freelancer_id`;

export async function listRelationships(userId: string): Promise<RelationshipRow[]> {
  const { rows } = await query<RelationshipRow>(
    `${RELATIONSHIP_SELECT}
      WHERE r.client_id = $1 OR r.freelancer_id = $1
      ORDER BY last_message_at DESC NULLS LAST, r.updated_at DESC`,
    [userId],
  );
  return rows;
}

export async function getRelationship(userId: string, contactId: string): Promise<RelationshipRow | null> {
  return queryOne<RelationshipRow>(
    `${RELATIONSHIP_SELECT}
      WHERE (r.client_id = $1 AND r.freelancer_id = $2)
         OR (r.client_id = $2 AND r.freelancer_id = $1)
      ORDER BY r.created_at DESC LIMIT 1`,
    [userId, contactId],
  );
}

/**
 * True when these two share a booking, in either direction.
 *
 * This is the authorization rule for starting a conversation: you may message
 * someone you have actually transacted with, not anyone whose email you know.
 */
export async function shareABooking(a: string, b: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM bookings
      WHERE (client_id = $1 AND freelancer_id = $2)
         OR (client_id = $2 AND freelancer_id = $1)
      LIMIT 1`,
    [a, b],
  );
  return row !== null;
}

export async function upsertRelationship(
  id: string, clientId: string, freelancerId: string,
  bookingId: string | null, serviceId: string | null, serviceTitle: string | null,
): Promise<void> {
  await query(
    `INSERT INTO chat_relationships (id, client_id, freelancer_id, booking_id, service_id, service_title)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (client_id, freelancer_id, booking_id) DO UPDATE
       SET service_title = COALESCE(EXCLUDED.service_title, chat_relationships.service_title),
           updated_at = now()`,
    [id, clientId, freelancerId, bookingId, serviceId, serviceTitle],
  );
}

/** Everyone the user shares a booking with — who they are allowed to message. */
export async function bookingContacts(userId: string): Promise<{
  user_id: string; email: string; name: string; booking_id: string; service_title: string;
}[]> {
  const { rows } = await query<{
    user_id: string; email: string; name: string; booking_id: string; service_title: string;
  }>(
    `SELECT DISTINCT ON (contact.id)
            contact.id AS user_id,
            contact.email::text AS email,
            TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,'')) AS name,
            b.id AS booking_id,
            s.title AS service_title
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN users contact
         ON contact.id = CASE WHEN b.client_id = $1 THEN b.freelancer_id ELSE b.client_id END
       LEFT JOIN user_profiles p ON p.user_id = contact.id
      WHERE b.client_id = $1 OR b.freelancer_id = $1
      ORDER BY contact.id, b.created_at DESC`,
    [userId],
  );
  return rows;
}

export async function findUserByEmail(email: string): Promise<{ id: string; email: string } | null> {
  return queryOne<{ id: string; email: string }>(
    'SELECT id, email::text AS email FROM users WHERE email = $1', [email]);
}
