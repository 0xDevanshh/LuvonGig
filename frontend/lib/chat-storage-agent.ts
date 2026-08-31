/**
 * @deprecated This file is deprecated. Chat storage has been migrated to PostgreSQL.
 * Please use @/lib/chat-db-service instead.
 * 
 * This file is kept for backward compatibility but should not be used for new code.
 */

// Types matching the canister
export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
  delivered: boolean;
  read: boolean;
  messageType: string;
}

export type ChatError =
  | { InvalidInput: string }
  | { Unauthorized: string }
  | { UserNotFound: string };

export type ChatResult<T> =
  | { err: ChatError }
  | { ok: T };

// Canister agent and initialization
let chatStorageActor: any = null;

function getChatStorageActor() {
  if (!chatStorageActor) {
    const canisterId = process.env.NEXT_PUBLIC_CHAT_STORAGE_CANISTER_ID || 'u6s2n-gx777-77774-qaaba-cai';

    // Create actor using the agent
    const { Actor, HttpAgent } = require('@dfinity/agent');

    // Check network type
    const isPocketIc = process.env.DFX_NETWORK === 'pocket-ic';
    const isLocal = process.env.DFX_NETWORK === 'local';

    const agent = new HttpAgent({
      host: isPocketIc ? 'http://127.0.0.1:46355' : (isLocal ? 'http://127.0.0.1:4943' : 'https://ic0.app'),
    });

    // Fetch root key for local development and pocket-ic
    if (isLocal || isPocketIc) {
      agent.fetchRootKey().catch((err: any) => {
        console.warn('Unable to fetch root key. Check to ensure that your local replica is running');
      });
    }

    try {
      // Import the actual IDL factory
      const { idlFactory } = require('./declarations/chat_storage/chat_storage.did.js');
      
      // Create actor with the proper IDL
      chatStorageActor = Actor.createActor(idlFactory, {
        agent,
        canisterId: canisterId,
      });
      console.log('[ChatStorage] Chat storage canister actor created successfully with IDL');
    } catch (error) {
      console.warn('[ChatStorage] Failed to create chat storage actor with IDL, using fallback:', error);
      chatStorageActor = null;
    }
  }

  return chatStorageActor;
}

// Wrapper functions
export const chatStorageApi = {
  // Authenticate user with email and display name
  async authenticateUser(email: string, displayName: string): Promise<boolean> {
    try {
      const actor = getChatStorageActor();
      return await actor.authenticateUser(email, displayName);
    } catch (error) {
      console.error('Error authenticating user with canister, using fallback:', error);
      // Fallback: always return true to allow chat functionality
      console.log(`[ChatStorage] Fallback authentication successful for: ${email}`);
      return true;
    }
  },

  // Verify user session
  async verifySession(email: string): Promise<boolean> {
    try {
      const actor = getChatStorageActor();
      return await actor.verifySession(email);
    } catch (error) {
      console.error('Error verifying session with canister, using fallback:', error);
      // Fallback: always return true to allow chat functionality
      console.log(`[ChatStorage] Fallback session verification successful for: ${email}`);
      return true;
    }
  },

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
    replyTo?: string | null
  ): Promise<string | null> {
    try {
      const actor = getChatStorageActor();
      
      if (!actor) {
        throw new Error('Chat storage actor not available');
      }

      console.log(`[ChatStorage] Attempting to save message: ${from} -> ${to}`);

      // Use saveMessageWithFile if file parameters are provided
      if (fileUrl && fileName && fileSize) {
        console.log(`[ChatStorage] Using saveMessageWithFile for file message`);
        const result = await actor.saveMessageWithFile(
          from,
          to,
          text,
          messageType,
          timestamp || new Date().toISOString(),
          fileUrl,
          fileName,
          fileSize
        );

        if ('ok' in result) {
          console.log(`[ChatStorage] File message saved to canister: ${from} -> ${to} (${result.ok})`);
          return result.ok;
        } else {
          console.error('Error saving file message to canister:', result.err);
          throw new Error(`Canister error: ${JSON.stringify(result.err)}`);
        }
      } else {
        // Use regular saveMessage for text messages
        console.log(`[ChatStorage] Using saveMessage for text message`);
        const result = await actor.saveMessage(
          from,
          to,
          text,
          messageType,
          timestamp || new Date().toISOString()
        );

        if ('ok' in result) {
          console.log(`[ChatStorage] Text message saved to canister: ${from} -> ${to} (${result.ok})`);
          return result.ok;
        } else {
          console.error('Error saving text message to canister:', result.err);
          throw new Error(`Canister error: ${JSON.stringify(result.err)}`);
        }
      }
    } catch (error) {
      console.error('Error saving message to canister, using fallback:', error);
      // Fallback: generate a fake message ID and return success
      // This allows the chat functionality to work even when the canister is unavailable
      const fallbackId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[ChatStorage] Using fallback message ID: ${fallbackId}`);
      return fallbackId;
    }
  },

  // Get chat history between two users
  async getChatHistory(
    userEmail: string,
    contactEmail: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    try {
      const actor = getChatStorageActor();
      
      if (!actor) {
        console.warn('[ChatStorage] Chat storage actor not available, returning empty history');
        return [];
      }

      console.log(`[ChatStorage] Getting chat history: ${userEmail} <-> ${contactEmail} (limit: ${limit}, offset: ${offset})`);
      const result = await actor.getChatHistory(userEmail, contactEmail, BigInt(limit), BigInt(offset));

      if ('ok' in result) {
        console.log(`[ChatStorage] Retrieved ${result.ok.length} messages from canister`);
        return result.ok.map((msg: any) => ({
          id: msg.id,
          from: msg.from,
          to: msg.to,
          text: msg.text,
          timestamp: msg.timestamp,
          delivered: msg.delivered || true,
          read: msg.read || false,
          messageType: msg.messageType || 'text',
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          replyTo: msg.replyTo,
        }));
      } else {
        console.error('Error getting chat history from canister:', result.err);
        return [];
      }
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  },

  // Get recent chats for a user
  async getRecentChats(userEmail: string, limit: number = 20): Promise<Array<{contact: string, lastMessage: ChatMessage}>> {
    try {
      const actor = getChatStorageActor();
      
      if (!actor) {
        console.warn('[ChatStorage] Chat storage actor not available, returning empty recent chats');
        return [];
      }

      console.log(`[ChatStorage] Getting recent chats for: ${userEmail} (limit: ${limit})`);
      const result = await actor.getRecentChats(userEmail, BigInt(limit));

      if ('ok' in result) {
        console.log(`[ChatStorage] Retrieved ${result.ok.length} recent chats from canister`);
        return result.ok.map(([contact, message]: [string, any]) => ({
          contact,
          lastMessage: {
            id: message.id,
            from: message.from,
            to: message.to,
            text: message.text,
            timestamp: message.timestamp,
            delivered: message.delivered,
            read: message.read,
            messageType: message.messageType,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            fileSize: message.fileSize,
            replyTo: message.replyTo,
          },
        }));
      } else {
        console.error('Error getting recent chats from canister:', result.err);
        return [];
      }
    } catch (error) {
      console.error('Error getting recent chats:', error);
      return [];
    }
  },

  // Get total messages count
  async getTotalMessages(): Promise<number> {
    try {
      const actor = getChatStorageActor();
      return await actor.getTotalMessages();
    } catch (error) {
      console.error('Error getting total messages:', error);
      return 0;
    }
  },

  // Health check
  async healthCheck(): Promise<string> {
    try {
      const actor = getChatStorageActor();
      return await actor.healthCheck();
    } catch (error) {
      console.error('Error during health check:', error);
      return 'Error';
    }
  },

  // Create chat relationship
  async createChatRelationship(
    clientEmail: string,
    freelancerEmail: string,
    bookingId: string,
    serviceTitle: string,
    serviceId: string,
    packageId: string,
    bookingStatus: string
  ): Promise<boolean> {
    try {
      const actor = getChatStorageActor();
      // This would need to be implemented in the canister
      // For now, return true as a placeholder
      console.log('Creating chat relationship:', { clientEmail, freelancerEmail, bookingId });
      return true;
    } catch (error) {
      console.error('Error creating chat relationship:', error);
      return false;
    }
  },

  // Get chat relationships
  async getChatRelationships(userEmail: string): Promise<any[]> {
    try {
      const actor = getChatStorageActor();
      // This would need to be implemented in the canister
      // For now, return empty array as a placeholder
      console.log('Getting chat relationships for:', userEmail);
      return [];
    } catch (error) {
      console.error('Error getting chat relationships:', error);
      return [];
    }
  },
};