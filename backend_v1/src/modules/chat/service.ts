/**
 * Chat rules, shared by the REST routes and the Socket.IO handlers.
 *
 * Both doors must apply the same authorization, or the socket becomes a way
 * around the REST checks. Every rule that decides "may this person see or send
 * this" lives here and nowhere else.
 */
import { badRequest, forbidden, notFound } from '../../lib/errors.js';
import { generateId } from '../../lib/ids.js';
import * as repo from './repo.js';

export interface Sender {
  userId: string;
  email: string;
}

/**
 * Resolves the other party and confirms the sender is allowed to talk to them.
 *
 * You may message someone you share a booking with, or someone you already
 * have a conversation with. Not simply anyone whose email address you know —
 * which is what the old routes permitted, since they took both identities from
 * the query string.
 */
export async function resolveContact(
  sender: Sender, contactEmail: string,
): Promise<{ id: string; email: string }> {
  const normalised = contactEmail.trim().toLowerCase();
  if (normalised === sender.email.toLowerCase()) {
    throw badRequest('You cannot message yourself');
  }

  const contact = await repo.findUserByEmail(normalised);
  // Same answer whether the account is missing or unreachable, so this cannot
  // be used to discover which email addresses have accounts.
  if (!contact) throw notFound('No conversation with that person');

  const [existing, shared] = await Promise.all([
    repo.getRelationship(sender.userId, contact.id),
    repo.shareABooking(sender.userId, contact.id),
  ]);

  if (!existing && !shared) {
    throw forbidden('You can only message people you have a booking with');
  }

  return contact;
}

export interface SendArgs {
  sender: Sender;
  contactEmail: string;
  body: string;
  bookingId?: string | null;
  messageType?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: string | null;
  replyTo?: string | null;
}

export async function sendMessage(args: SendArgs): Promise<repo.MessageRow> {
  const contact = await resolveContact(args.sender, args.contactEmail);

  const text = args.body?.trim() ?? '';
  const type = args.messageType ?? 'text';
  // A file message carries its content in the URL; a text one must say something.
  if (type === 'text' && text.length === 0) {
    throw badRequest('Message cannot be empty');
  }
  if (text.length > 10_000) throw badRequest('Message is too long');

  const message = await repo.insertMessage({
    id: generateId('msg'),
    fromUserId: args.sender.userId,
    toUserId: contact.id,
    bookingId: args.bookingId ?? null,
    body: text,
    messageType: type,
    fileUrl: args.fileUrl ?? null,
    fileName: args.fileName ?? null,
    fileSize: args.fileSize ?? null,
    replyTo: args.replyTo ?? null,
  });

  // Keep the conversation list current. Which side is "client" only matters
  // for the column names; the unique index treats the pair symmetrically.
  const existing = await repo.getRelationship(args.sender.userId, contact.id);
  if (!existing) {
    await repo.upsertRelationship(
      generateId('rel'), args.sender.userId, contact.id, args.bookingId ?? null, null, null);
  }

  return message;
}

export async function conversation(
  sender: Sender, contactEmail: string, limit: number, offset: number,
): Promise<repo.MessageRow[]> {
  const contact = await resolveContact(sender, contactEmail);
  return repo.listConversation(sender.userId, contact.id, limit, offset);
}

export function toMessageDto(m: repo.MessageRow) {
  return {
    id: m.id,
    from: m.from_email,
    to: m.to_email,
    from_user_id: m.from_user_id,
    to_user_id: m.to_user_id,
    booking_id: m.booking_id,
    text: m.body,
    message_type: m.message_type,
    file_url: m.file_url,
    file_name: m.file_name,
    file_size: m.file_size,
    reply_to: m.reply_to,
    delivered: m.delivered,
    read: m.read_at !== null,
    read_at: m.read_at,
    timestamp: m.created_at,
    created_at: m.created_at,
  };
}

export function toRelationshipDto(r: repo.RelationshipRow) {
  return {
    id: r.id,
    booking_id: r.booking_id,
    service_id: r.service_id,
    service_title: r.service_title,
    booking_status: r.booking_status,
    contact_id: r.contact_id,
    contact_email: r.contact_email,
    contact_name: r.contact_name || r.contact_email,
    last_message: r.last_message,
    last_message_at: r.last_message_at,
    unread_count: Number(r.unread_count),
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}
