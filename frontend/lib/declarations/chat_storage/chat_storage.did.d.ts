import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface ChatMessage {
  'delivered' : boolean;
  'deleted' : boolean;
  'deletedAt' : [] | [string];
  'edited' : boolean;
  'editedAt' : [] | [string];
  'fileSize' : [] | [bigint];
  'fileName' : [] | [string];
  'fileUrl' : [] | [string];
  'from' : string;
  'id' : string;
  'metadata' : Array<[string, string]>;
  'messageType' : string;
  'read' : boolean;
  'replyTo' : [] | [string];
  'text' : string;
  'timestamp' : string;
  'to' : string;
}
export interface ChatRelationship {
  'bookingId' : string;
  'clientEmail' : string;
  'createdAt' : string;
  'freelancerEmail' : string;
  'isArchived' : boolean;
  'isMuted' : boolean;
  'lastMessageAt' : [] | [string];
  'lastMessagePreview' : [] | [string];
  'packageId' : string;
  'serviceId' : string;
  'serviceTitle' : string;
  'status' : string;
  'unreadCount' : bigint;
}
export interface ChatRoom {
  'createdAt' : string;
  'createdBy' : string;
  'description' : string;
  'isPrivate' : boolean;
  'lastActivity' : string;
  'metadata' : Array<[string, string]>;
  'name' : string;
  'participants' : Array<string>;
  'roomId' : string;
}
export type ChatError = 
  | { 'InvalidInput' : string }
  | { 'NoRelationship' : string }
  | { 'Unauthorized' : string }
  | { 'UserNotFound' : string };
export type ChatResult = 
  | { 'err' : ChatError }
  | { 'ok' : string };
export type ChatResult_1 = 
  | { 'err' : ChatError }
  | { 'ok' : Array<ChatMessage> };
export type ChatResult_2 = 
  | { 'err' : ChatError }
  | { 'ok' : Array<ChatRelationship> };
export type ChatResult_3 = 
  | { 'err' : ChatError }
  | { 'ok' : Array<[string, ChatMessage]> };
export type ChatResult_4 = 
  | { 'err' : ChatError }
  | { 'ok' : ChatRoom };
export type ChatResult_5 = 
  | { 'err' : ChatError }
  | { 'ok' : Array<ChatRoom> };
export type ChatResult_6 = 
  | { 'err' : ChatError }
  | { 'ok' : bigint };
export type ChatResult_7 = 
  | { 'err' : ChatError }
  | { 'ok' : boolean };
export interface ReadReceipt {
  'deliveredAt' : string;
  'messageId' : string;
  'readAt' : string;
  'readBy' : string;
}
export interface TypingIndicator {
  'chatRoom' : string;
  'from' : string;
  'isTyping' : boolean;
  'timestamp' : string;
  'to' : string;
}
export interface UserPresence {
  'customStatus' : [] | [string];
  'deviceInfo' : [] | [string];
  'email' : string;
  'isOnline' : boolean;
  'lastSeen' : string;
  'socketId' : [] | [string];
  'status' : string;
}
export interface _SERVICE {
  'authenticateUser' : ActorMethod<[string, string], boolean>;
  'createChatRelationship' : ActorMethod<[string, string, string, string, string, string, string], ChatResult>;
  'createChatRoom' : ActorMethod<[string, string, Array<string>, string, boolean], ChatResult_4>;
  'deleteMessage' : ActorMethod<[string, string], ChatResult>;
  'editMessage' : ActorMethod<[string, string, string], ChatResult>;
  'getChatHistory' : ActorMethod<[string, string, bigint, bigint], ChatResult_1>;
  'getChatRelationships' : ActorMethod<[string], ChatResult_2>;
  'getChatRoom' : ActorMethod<[string], ChatResult_4>;
  'getChatRooms' : ActorMethod<[string], ChatResult_5>;
  'getMessageById' : ActorMethod<[string], [] | [ChatMessage]>;
  'getRecentChats' : ActorMethod<[string, bigint], ChatResult_3>;
  'getTotalMessages' : ActorMethod<[], bigint>;
  'getUnreadCount' : ActorMethod<[string, string], ChatResult_6>;
  'healthCheck' : ActorMethod<[], string>;
  'joinChatRoom' : ActorMethod<[string, string], ChatResult>;
  'leaveChatRoom' : ActorMethod<[string, string], ChatResult>;
  'markMessagesAsRead' : ActorMethod<[string, string], ChatResult>;
  'saveMessage' : ActorMethod<[string, string, string, string, string], ChatResult>;
  'saveMessageWithFile' : ActorMethod<[string, string, string, string, string, string, string, bigint], ChatResult>;
  'setTypingIndicator' : ActorMethod<[string, string, boolean, string], ChatResult>;
  'updatePresence' : ActorMethod<[string, boolean, [] | [string], [] | [string], string, [] | [string]], ChatResult>;
  'updateReadReceipt' : ActorMethod<[string, string, string, string], ChatResult>;
  'verifySession' : ActorMethod<[string], boolean>;
}
