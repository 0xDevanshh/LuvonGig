export const idlFactory = ({ IDL }) => {
  const ChatMessage = IDL.Record({
    'delivered' : IDL.Bool,
    'deleted' : IDL.Bool,
    'deletedAt' : IDL.Opt(IDL.Text),
    'edited' : IDL.Bool,
    'editedAt' : IDL.Opt(IDL.Text),
    'fileSize' : IDL.Opt(IDL.Nat),
    'fileName' : IDL.Opt(IDL.Text),
    'fileUrl' : IDL.Opt(IDL.Text),
    'from' : IDL.Text,
    'id' : IDL.Text,
    'metadata' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'messageType' : IDL.Text,
    'read' : IDL.Bool,
    'replyTo' : IDL.Opt(IDL.Text),
    'text' : IDL.Text,
    'timestamp' : IDL.Text,
    'to' : IDL.Text,
  });
  const ChatRelationship = IDL.Record({
    'bookingId' : IDL.Text,
    'clientEmail' : IDL.Text,
    'createdAt' : IDL.Text,
    'freelancerEmail' : IDL.Text,
    'isArchived' : IDL.Bool,
    'isMuted' : IDL.Bool,
    'lastMessageAt' : IDL.Opt(IDL.Text),
    'lastMessagePreview' : IDL.Opt(IDL.Text),
    'packageId' : IDL.Text,
    'serviceId' : IDL.Text,
    'serviceTitle' : IDL.Text,
    'status' : IDL.Text,
    'unreadCount' : IDL.Nat,
  });
  const ChatRoom = IDL.Record({
    'createdAt' : IDL.Text,
    'createdBy' : IDL.Text,
    'description' : IDL.Text,
    'isPrivate' : IDL.Bool,
    'lastActivity' : IDL.Text,
    'metadata' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'name' : IDL.Text,
    'participants' : IDL.Vec(IDL.Text),
    'roomId' : IDL.Text,
  });
  const ChatError = IDL.Variant({
    'InvalidInput' : IDL.Text,
    'NoRelationship' : IDL.Text,
    'Unauthorized' : IDL.Text,
    'UserNotFound' : IDL.Text,
  });
  const ChatResult = IDL.Variant({
    'err' : ChatError,
    'ok' : IDL.Text,
  });
  const ChatResult_1 = IDL.Variant({
    'err' : ChatError,
    'ok' : IDL.Vec(ChatMessage),
  });
  const ChatResult_2 = IDL.Variant({
    'err' : ChatError,
    'ok' : IDL.Vec(ChatRelationship),
  });
  const ChatResult_3 = IDL.Variant({
    'err' : ChatError,
    'ok' : IDL.Vec(IDL.Tuple(IDL.Text, ChatMessage)),
  });
  const ChatResult_4 = IDL.Variant({
    'err' : ChatError,
    'ok' : ChatRoom,
  });
  const ChatResult_5 = IDL.Variant({
    'err' : ChatError,
    'ok' : IDL.Vec(ChatRoom),
  });
  const ChatResult_6 = IDL.Variant({
    'err' : ChatError,
    'ok' : IDL.Nat,
  });
  const ChatResult_7 = IDL.Variant({
    'err' : ChatError,
    'ok' : IDL.Bool,
  });
  const ReadReceipt = IDL.Record({
    'deliveredAt' : IDL.Text,
    'messageId' : IDL.Text,
    'readAt' : IDL.Text,
    'readBy' : IDL.Text,
  });
  const TypingIndicator = IDL.Record({
    'chatRoom' : IDL.Text,
    'from' : IDL.Text,
    'isTyping' : IDL.Bool,
    'timestamp' : IDL.Text,
    'to' : IDL.Text,
  });
  const UserPresence = IDL.Record({
    'customStatus' : IDL.Opt(IDL.Text),
    'deviceInfo' : IDL.Opt(IDL.Text),
    'email' : IDL.Text,
    'isOnline' : IDL.Bool,
    'lastSeen' : IDL.Text,
    'socketId' : IDL.Opt(IDL.Text),
    'status' : IDL.Text,
  });
  return IDL.Service({
    'authenticateUser' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'createChatRelationship' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [ChatResult], []),
    'createChatRoom' : IDL.Func([IDL.Text, IDL.Text, IDL.Vec(IDL.Text), IDL.Text, IDL.Bool], [ChatResult_4], []),
    'deleteMessage' : IDL.Func([IDL.Text, IDL.Text], [ChatResult], []),
    'editMessage' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [ChatResult], []),
    'getChatHistory' : IDL.Func([IDL.Text, IDL.Text, IDL.Nat, IDL.Nat], [ChatResult_1], ['query']),
    'getChatRelationships' : IDL.Func([IDL.Text], [ChatResult_2], ['query']),
    'getChatRoom' : IDL.Func([IDL.Text], [ChatResult_4], ['query']),
    'getChatRooms' : IDL.Func([IDL.Text], [ChatResult_5], ['query']),
    'getMessageById' : IDL.Func([IDL.Text], [IDL.Opt(ChatMessage)], ['query']),
    'getRecentChats' : IDL.Func([IDL.Text, IDL.Nat], [ChatResult_3], ['query']),
    'getTotalMessages' : IDL.Func([], [IDL.Nat], ['query']),
    'getUnreadCount' : IDL.Func([IDL.Text, IDL.Text], [ChatResult_6], ['query']),
    'healthCheck' : IDL.Func([], [IDL.Text], ['query']),
    'joinChatRoom' : IDL.Func([IDL.Text, IDL.Text], [ChatResult], []),
    'leaveChatRoom' : IDL.Func([IDL.Text, IDL.Text], [ChatResult], []),
    'markMessagesAsRead' : IDL.Func([IDL.Text, IDL.Text], [ChatResult], []),
    'saveMessage' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [ChatResult], []),
    'saveMessageWithFile' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat], [ChatResult], []),
    'setTypingIndicator' : IDL.Func([IDL.Text, IDL.Text, IDL.Bool, IDL.Text], [ChatResult], []),
    'updatePresence' : IDL.Func([IDL.Text, IDL.Bool, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text), IDL.Text, IDL.Opt(IDL.Text)], [ChatResult], []),
    'updateReadReceipt' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [ChatResult], []),
    'verifySession' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
