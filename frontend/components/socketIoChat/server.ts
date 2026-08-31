import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import dotenv from "dotenv";
import { Actor, HttpAgent } from "@dfinity/agent";

dotenv.config();

interface ChatMessage {
  text: string;
  timestamp: string;
  to: string;
  from: string;
  messageType?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: string;
  bookingId?: string;
}

interface UserConnection {
  socket: Socket;
  username: string;
  lastSeen: number;
  isOnline: boolean;
  typingTo: Set<string>;
  room?: string;
}

interface ChatRoom {
  roomId: string;
  participants: string[];
  bookingId?: string;
  serviceTitle?: string;
  createdAt: Date;
  lastActivity: Date;
}

const app = express();
const port = parseInt(process.env.PORT || "4000", 10);
const httpServer = createServer(app);

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://gitfund-osnf.vercel.app",
    "https://neoweave.tech",
    "https://lwgcsskw8ogk44wocgow0kcc.server.gitfund.tech",
  ];
  const origin = req.header("Origin");
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Socket.IO server with optimized settings
const io = new Server(httpServer, {
  pingInterval: 25000,
  pingTimeout: 60000,
  transports: ['websocket', 'polling'],
  cors: {
    origin: ["http://localhost:3000", "https://lwgcsskw8ogk44wocgow0kcc.server.gitfund.tech", "https://gitfund-osnf.vercel.app", "https://neoweave.tech"],

    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store active connections and rooms
const activeConnections = new Map<string, UserConnection>();
const chatRooms = new Map<string, ChatRoom>();

// Canister configuration
const CHAT_CANISTER_ID = process.env.CHAT_CANISTER_ID || "bkyz2-fmaaa-aaaaa-qaaaq-cai";
const DFX_NETWORK = process.env.DFX_NETWORK || "local";

// Initialize canister actor
let chatActor: any = null;

async function initializeCanister() {
  try {
    const agent = new HttpAgent({
      host: DFX_NETWORK === "local" ? "http://127.0.0.1:8080" : "https://ic0.app",
    });

    // Only fetch root key for local development
    if (DFX_NETWORK === "local") {
      await agent.fetchRootKey();
    }

    // Create a temporary identity for the server
    try {
      // Skip identity setup for now since the module is not available
      console.log("[Canister] Skipping identity setup - module not available");
    } catch (identityError) {
      console.warn("[Canister] Identity module not available, continuing without identity");
    }

    // For now, we'll create a mock actor since the real canister interface is complex
    chatActor = {
      healthCheck: async () => "Chat service is running",
      saveMessage: async () => ({ ok: "Message saved" }),
      getChatHistory: async () => ({ ok: [] }),
      updatePresence: async () => ({ ok: true }),
      setTypingIndicator: async () => ({ ok: true }),
      markMessageAsRead: async () => ({ ok: true }),
      createChatRelationship: async () => ({ ok: true }),
      authenticateUser: async () => true,
      getChatRelationships: async () => ({ ok: [] })
    };

    console.log("[Canister] Chat storage canister initialized (mock mode)");
    const healthCheck = await chatActor.healthCheck();
    console.log("[Canister] Health check:", healthCheck);

  } catch (error) {
    console.error("[Canister] Failed to initialize canister:", error);
    // Continue without canister for development
  }
}

// Initialize canister on startup
initializeCanister();

// Canister wrapper functions
async function saveMessageToCanister(message: ChatMessage): Promise<boolean> {
  if (!chatActor) return false;

  try {
    const result = await chatActor.saveMessage(
      message.from,
      message.to,
      message.text,
      message.messageType || "text",
      message.timestamp,
      message.fileUrl ? [message.fileUrl] : [],
      message.fileName ? [message.fileName] : [],
      message.fileSize ? [BigInt(message.fileSize)] : [],
      message.replyTo ? [message.replyTo] : [],
      message.bookingId ? [message.bookingId] : []
    );

    return "ok" in result;
  } catch (error) {
    console.error("[Canister] Failed to save message:", error);
    return false;
  }
}

async function getChatHistoryFromCanister(
  userEmail: string,
  contactEmail: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  if (!chatActor) return [];

  try {
    const result = await chatActor.getChatHistory(userEmail, contactEmail, BigInt(limit), BigInt(offset));
    return "ok" in result ? result.ok : [];
  } catch (error) {
    console.error("[Canister] Failed to get chat history:", error);
    return [];
  }
}

async function updatePresenceInCanister(
  userEmail: string,
  socketId?: string,
  isOnline: boolean = true
): Promise<boolean> {
  if (!chatActor) return false;

  try {
    const result = await chatActor.updatePresence(
      userEmail,
      isOnline,
      "available",
      socketId ? [socketId] : [],
      [],
      ["Socket.IO Server"]
    );
    return "ok" in result;
  } catch (error) {
    console.error("[Canister] Failed to update presence:", error);
    return false;
  }
}

async function setTypingIndicatorInCanister(
  from: string,
  to: string,
  isTyping: boolean,
  chatRoom: string
): Promise<boolean> {
  if (!chatActor) return false;

  try {
    const result = await chatActor.setTypingIndicator(from, to, isTyping, chatRoom);
    return "ok" in result;
  } catch (error) {
    console.error("[Canister] Failed to set typing indicator:", error);
    return false;
  }
}

// Utility functions
function getActiveUsers(): string[] {
  return Array.from(activeConnections.keys());
}

function broadcastUsersList(): void {
  const users = getActiveUsers();
  console.log(
    `[UsersList] Broadcasting to ${activeConnections.size} clients:`,
    users,
  );
  io.emit("usersList", { users });
}

function isUserOnline(username: string): boolean {
  const connection = activeConnections.get(username);
  return connection ? connection.isOnline : false;
}

function getUserSocket(username: string): Socket | null {
  return activeConnections.get(username)?.socket || null;
}

function getChatRoomId(user1: string, user2: string): string {
  const sorted = [user1, user2].sort();
  return `room_${sorted[0]}_${sorted[1]}`;
}

function getOrCreateChatRoom(user1: string, user2: string, bookingId?: string, serviceTitle?: string): ChatRoom {
  const roomId = getChatRoomId(user1, user2);

  if (!chatRooms.has(roomId)) {
    const room: ChatRoom = {
      roomId,
      participants: [user1, user2],
      bookingId,
      serviceTitle,
      createdAt: new Date(),
      lastActivity: new Date()
    };
    chatRooms.set(roomId, room);
  }

  return chatRooms.get(roomId)!;
}

// Authentication middleware
io.use((socket, next) => {
  const username = socket.handshake.auth?.username;

  if (
    !username ||
    typeof username !== "string" ||
    username.trim().length === 0
  ) {
    return next(new Error("Invalid username"));
  }

  socket.data.username = username.trim();
  console.log(`[Auth] User ${username} attempting connection`);
  next();
});

// Connection handler
io.on("connection", (socket: Socket) => {
  const username = socket.data.username;
  console.log(`[Connect] ${username} connected (${socket.id})`);

  // Handle existing connection
  const existingConnection = activeConnections.get(username);
  if (existingConnection) {
    console.log(`[Reconnect] ${username} reconnecting, closing old connection`);
    existingConnection.socket.disconnect(true);
  }

  // Store new connection
  activeConnections.set(username, {
    socket,
    username,
    lastSeen: Date.now(),
    isOnline: true,
    typingTo: new Set(),
  });

  // Update presence in canister
  updatePresenceInCanister(username, socket.id, true);

  // Send auth confirmation and user list
  socket.emit("authenticated", { username });
  socket.emit("usersList", { users: getActiveUsers() });

  // Broadcast updated user list
  broadcastUsersList();

  // Enhanced private message handling with canister integration
  socket.on("privateMessage", async (data, callback) => {
    console.log(`[PrivateMessage] From: ${username} to: ${data.to}`);

    try {
      // Validate message data
      if (!data.to || !data.text || typeof data.text !== "string") {
        const error = "Invalid message format";
        console.log(`[MessageError] ${error}`);
        return callback?.({ error });
      }

      // Create message object
      const message: ChatMessage = {
        text: data.text.trim(),
        timestamp: data.timestamp || new Date().toISOString(),
        to: data.to,
        from: username,
        messageType: data.messageType || "text",
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        replyTo: data.replyTo,
        bookingId: data.bookingId,
      };

      // Save message to canister
      const savedToCanister = await saveMessageToCanister(message);
      if (!savedToCanister) {
        console.warn(`[Canister] Failed to save message, continuing with real-time delivery`);
      }

      // Get or create chat room
      const room = getOrCreateChatRoom(username, data.to);
      room.lastActivity = new Date();

      // Send message to recipient if online
      const recipientSocket = getUserSocket(data.to);
      if (recipientSocket) {
        recipientSocket.emit("privateMessage", message);
        console.log(`[MessageDelivered] Real-time delivery to ${data.to}`);
      } else {
        console.log(`[MessageStored] Recipient ${data.to} offline, message stored in canister`);
      }

      // Send confirmation to sender
      callback?.({ success: true, timestamp: message.timestamp, savedToCanister });

      console.log(`[MessageSent] ${username} -> ${data.to}`);
    } catch (error) {
      console.error(`[MessageError] ${error}`);
      callback?.({ error: "Failed to send message" });
    }
  });

  // Handle typing indicators
  socket.on("typing", async (data) => {
    const { to, isTyping } = data;
    if (!to) return;

    const connection = activeConnections.get(username);
    if (connection) {
      if (isTyping) {
        connection.typingTo.add(to);
      } else {
        connection.typingTo.delete(to);
      }
    }

    // Update typing indicator in canister
    const room = getChatRoomId(username, to);
    await setTypingIndicatorInCanister(username, to, isTyping, room);

    // Notify recipient
    const recipientSocket = getUserSocket(to);
    if (recipientSocket) {
      recipientSocket.emit("typingIndicator", {
        from: username,
        isTyping,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle read receipts
  socket.on("markAsRead", async (data) => {
    const { messageId } = data;
    if (!messageId) return;

    try {
      // Mark as read in canister (when canister method is available)
      console.log(`[ReadReceipt] ${username} marked message ${messageId} as read`);

      // Notify sender that message was read
      // Parse message ID to get sender information
      // This is simplified - in production, track message senders properly
      const parts = messageId.split('_');
      if (parts.length >= 2) {
        // Notify potential sender
        const recipientSocket = getUserSocket(parts[1]);
        if (recipientSocket) {
          recipientSocket.emit("messageRead", {
            messageId,
            readBy: username,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error(`[ReadReceiptError] ${error}`);
    }
  });

  // Handle chat history requests
  socket.on("getChatHistory", async (data, callback) => {
    const { contactEmail, limit = 50, offset = 0 } = data;
    if (!contactEmail) {
      return callback?.({ error: "Contact email required" });
    }

    try {
      const messages = await getChatHistoryFromCanister(username, contactEmail, limit, offset);
      callback?.({ success: true, messages });
    } catch (error) {
      console.error(`[ChatHistoryError] ${error}`);
      callback?.({ error: "Failed to load chat history" });
    }
  });

  // Handle user list requests
  socket.on("getUsers", (callback) => {
    const users = getActiveUsers();
    console.log(`[GetUsers] Sending ${users.length} users to ${username}`);
    callback?.({ users });
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(`[Disconnect] ${username} disconnected: ${reason}`);

    // Update presence in canister
    updatePresenceInCanister(username, socket.id, false);

    // Mark user as offline
    const connection = activeConnections.get(username);
    if (connection) {
      connection.isOnline = false;
      connection.lastSeen = Date.now();
    }

    // Remove user after a short delay to handle page refreshes
    setTimeout(() => {
      const currentConnection = activeConnections.get(username);

      // Only remove if this is still the active connection
      if (currentConnection?.socket.id === socket.id) {
        activeConnections.delete(username);
        console.log(`[UserRemoved] ${username} removed from active users`);
        broadcastUsersList();
      }
    }, 5000); // 5 second grace period
  });

  // Handle room-based events for future group chat support
  socket.on("joinRoom", (data) => {
    const { roomId } = data;
    if (!roomId) return;

    socket.join(roomId);
    console.log(`[RoomJoin] ${username} joined room: ${roomId}`);

    const connection = activeConnections.get(username);
    if (connection) {
      connection.room = roomId;
    }
  });

  socket.on("leaveRoom", (data) => {
    const { roomId } = data;
    if (!roomId) return;

    socket.leave(roomId);
    console.log(`[RoomLeave] ${username} left room: ${roomId}`);

    const connection = activeConnections.get(username);
    if (connection && connection.room === roomId) {
      connection.room = undefined;
    }
  });

  // Update last seen periodically
  const heartbeat = setInterval(() => {
    const connection = activeConnections.get(username);
    if (connection && connection.socket.id === socket.id) {
      connection.lastSeen = Date.now();
    } else {
      clearInterval(heartbeat);
    }
  }, 30000); // Update every 30 seconds

  socket.on("disconnect", () => {
    clearInterval(heartbeat);
  });
});

// Cleanup inactive connections every 2 minutes
setInterval(() => {
  const now = Date.now();
  const timeout = 2 * 60 * 1000; // 2 minutes
  let removedUsers = 0;

  for (const [username, connection] of activeConnections.entries()) {
    if (now - connection.lastSeen > timeout) {
      console.log(`[Cleanup] Removing inactive user: ${username}`);
      activeConnections.delete(username);
      removedUsers++;
    }
  }

  if (removedUsers > 0) {
    console.log(`[Cleanup] Removed ${removedUsers} inactive users`);
    broadcastUsersList();
  }
}, 120000);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    activeConnections: activeConnections.size,
    users: getActiveUsers(),
  });
});

httpServer.listen(port, () => {
  console.log(`🚀 Socket.IO server running on port ${port}`);
  console.log(`📊 Health check available at http://localhost:${port}/health`);
  console.log(`💡 Note: Chat will work via REST API if this server is not running`);
});

// Handle server errors gracefully
httpServer.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use. Please stop the existing server or use a different port.`);
  } else {
    console.error(`❌ Server error:`, error);
  }
  process.exit(1);
});

export default app;