import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

interface ChatMessage {
  text: string;
  timestamp: string;
  to: string;
  from: string;
  bookingId?: string;
}

interface UserConnection {
  socket: Socket;
  username: string;
  lastSeen: number;
}

const app = express();
const port = parseInt(process.env.PORT || "4000", 10);
const host = process.env.HOST || "0.0.0.0";
const httpServer = createServer(app);

// CORS middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://gitfund-osnf.vercel.app",
    "https://neoweave.tech",
    "https://lwgcsskw8ogk44wocgow0kcc.server.gitfund.tech",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parsing middleware
app.use(express.json());

// Socket.IO server with optimized settings
const io = new Server(httpServer, {
  pingInterval: 25000,
  pingTimeout: 60000,
  transports: ['websocket', 'polling'],
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://lwgcsskw8ogk44wocgow0kcc.server.gitfund.tech",
      "https://gitfund-osnf.vercel.app",
      "https://neoweave.tech",
      "https://workbud-rxot.vercel.app/"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store active connections
const activeConnections = new Map<string, UserConnection>();

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
  return activeConnections.has(username);
}

function getUserSocket(username: string): Socket | null {
  return activeConnections.get(username)?.socket || null;
}

// Authentication middleware
io.use((socket: Socket, next: (err?: Error) => void) => {
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
  });

  // Send auth confirmation and user list
  socket.emit("authenticated", { username });
  socket.emit("usersList", { users: getActiveUsers() });

  // Broadcast updated user list
  broadcastUsersList();

  // Handle private messages
  socket.on("privateMessage", (data: any, callback: (response: any) => void) => {
    console.log(`[PrivateMessage] From: ${username} to: ${data.to}`);

    try {
      // Validate message data
      if (!data.to || !data.text || typeof data.text !== "string") {
        const error = "Invalid message format";
        console.log(`[MessageError] ${error}`);
        return callback?.({ error });
      }

      // Check if recipient exists and is online
      const recipientSocket = getUserSocket(data.to);
      if (!recipientSocket) {
        const error = "Recipient not online";
        console.log(`[MessageError] ${error}: ${data.to}`);
        return callback?.({ error });
      }

      // Create message object
      const message: ChatMessage = {
        text: data.text.trim(),
        timestamp: data.timestamp || new Date().toISOString(),
        to: data.to,
        from: username,
        bookingId: data.bookingId,
      };

      // Send message to recipient
      recipientSocket.emit("privateMessage", message);

      // Send confirmation to sender
      callback?.({ success: true, timestamp: message.timestamp });

      console.log(`[MessageSent] ${username} -> ${data.to}`);
    } catch (error) {
      console.error(`[MessageError] ${error}`);
      callback?.({ error: "Failed to send message" });
    }
  });

  // Handle user list requests
  socket.on("getUsers", (callback: (response: { users: string[] }) => void) => {
    const users = getActiveUsers();
    console.log(`[GetUsers] Sending ${users.length} users to ${username}`);
    callback?.({ users });
  });

  // Handle disconnect
  socket.on("disconnect", (reason: string) => {
    console.log(`[Disconnect] ${username} disconnected: ${reason}`);

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
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    activeConnections: activeConnections.size,
    users: getActiveUsers(),
  });
});

// Start server
httpServer.listen(port, host, () => {
  console.log(`🚀 Socket.IO server running on ${host}:${port}`);
  console.log(`📊 Health check available at http://${host}:${port}/health`);
  console.log(`🔗 WebSocket endpoint: ws://${host}:${port}/socket.io/`);
});

export default app;