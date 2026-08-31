# Chat Storage Migration to PostgreSQL

## Overview

Chat storage has been migrated from Internet Computer (IC) canister to PostgreSQL database. All chat messages and relationships are now stored in PostgreSQL using the `DATABASE_URL` environment variable.

## Database Schema

The migration creates two main tables:

### `chat_messages`
Stores all chat messages between users.

**Columns:**
- `id` (VARCHAR) - Primary key, unique message ID
- `from_email` (VARCHAR) - Sender's email
- `to_email` (VARCHAR) - Recipient's email
- `text` (TEXT) - Message content
- `message_type` (VARCHAR) - Type of message (text, file, etc.)
- `timestamp` (TIMESTAMP) - When message was sent
- `delivered` (BOOLEAN) - Delivery status
- `read_status` (BOOLEAN) - Read status
- `file_url` (TEXT) - URL to attached file (optional)
- `file_name` (VARCHAR) - Name of attached file (optional)
- `file_size` (BIGINT) - Size of attached file in bytes (optional)
- `reply_to` (VARCHAR) - ID of message being replied to (optional)
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Record update time

**Indexes:**
- `idx_chat_messages_from_to` - For querying messages between two users
- `idx_chat_messages_to_from` - For reverse lookup
- `idx_chat_messages_timestamp` - For sorting by time

### `chat_relationships`
Stores chat relationships based on bookings.

**Columns:**
- `id` (VARCHAR) - Primary key, unique relationship ID
- `client_email` (VARCHAR) - Client's email
- `freelancer_email` (VARCHAR) - Freelancer's email
- `booking_id` (VARCHAR) - Associated booking ID (optional)
- `service_title` (VARCHAR) - Service title (optional)
- `service_id` (VARCHAR) - Service ID (optional)
- `package_id` (VARCHAR) - Package ID (optional)
- `booking_status` (VARCHAR) - Booking status (optional)
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Record update time

**Indexes:**
- `idx_chat_relationships_client` - For querying by client
- `idx_chat_relationships_freelancer` - For querying by freelancer
- Unique constraint on `(client_email, freelancer_email, booking_id)`

## Environment Setup

1. Set the `DATABASE_URL` environment variable in your `.env.local` file:

```bash
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

Example:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/chatdb?sslmode=disable
```

## Automatic Table Creation

Tables are automatically created when the application starts. The initialization happens in `lib/db/chat-db.ts` and runs on the server side only.

## API Changes

All chat API routes now use PostgreSQL:

- `/api/chat/messages/save` - Saves messages to PostgreSQL
- `/api/chat/history` - Retrieves chat history from PostgreSQL
- `/api/chat/recent` - Gets recent chats from PostgreSQL
- `/api/chat/relationships` - Manages chat relationships in PostgreSQL

## Code Changes

### Old (Canister-based):
```typescript
import { chatStorageApi } from '@/lib/chat-storage-agent';
const messageId = await chatStorageApi.saveMessage(...);
```

### New (PostgreSQL-based):
```typescript
import { chatDbService } from '@/lib/chat-db-service';
const messageId = await chatDbService.saveMessage(...);
```

## Migration Notes

- The old `chat-storage-agent.ts` file is deprecated but kept for backward compatibility
- All new code should use `chat-db-service.ts`
- No data migration is needed if starting fresh
- If you have existing canister data, you'll need to export and import it manually

## Testing

1. Ensure `DATABASE_URL` is set correctly
2. Start the Next.js server
3. Tables will be created automatically on first API call
4. Test sending a message via the chat interface
5. Verify messages appear in the database

## Troubleshooting

### Connection Errors
- Verify `DATABASE_URL` is correct
- Check database server is running
- Ensure network/firewall allows connections
- Verify SSL settings match your database configuration

### Table Creation Errors
- Check database user has CREATE TABLE permissions
- Verify database exists
- Check for existing tables with conflicting names

### Query Errors
- Check indexes are created properly
- Verify column types match expectations
- Check for NULL constraint violations


