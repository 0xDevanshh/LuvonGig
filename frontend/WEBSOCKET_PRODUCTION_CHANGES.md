# WebSocket Production Deployment Changes

## Overview

This document outlines all the changes required to make the WebSocket server work correctly in production environments. The current setup is configured for local development and needs several modifications for production deployment.

## Critical Issues to Address

### 1. ✅ CORS Configuration - Hardcoded Origins

**Problem:** The socket server has hardcoded CORS origins that won't work for all production domains.

**Current Code:**
```typescript
// frontend/lib/socket-server.ts (lines 50-58)
cors: {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://lwgcsskw8ogk44wocgow0kcc.server.gitfund.tech",
    "https://gitfund-osnf.vercel.app",
    "https://neoweave.tech"
  ],
  methods: ["GET", "POST"],
  credentials: true,
}
```

**Required Changes:**
1. Make CORS origins configurable via environment variables
2. Support wildcard subdomains if needed
3. Add production domain validation

**Solution:**
```typescript
// Use environment variable with fallback
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ];

cors: {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
}
```

### 2. ✅ Socket URL Configuration - Environment-Based

**Problem:** The client defaults to `http://localhost:4000` which won't work in production.

**Current Code:**
```typescript
// frontend/lib/socket-service.ts (line 6)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'
```

**Required Changes:**
1. Ensure `NEXT_PUBLIC_SOCKET_URL` is set in production
2. Use HTTPS/WSS for production
3. Add validation to prevent localhost in production

**Solution:**
```typescript
const getSocketUrl = () => {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Socket] NEXT_PUBLIC_SOCKET_URL is required in production');
      return null; // Will fallback to REST API
    }
    return 'http://localhost:4000';
  }
  
  // Validate production URLs use HTTPS/WSS
  if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
    console.warn('[Socket] Production socket URL should use HTTPS/WSS');
  }
  
  return url;
};

const SOCKET_URL = getSocketUrl();
```

### 3. ✅ HTTPS/WSS Protocol Support

**Problem:** Production requires secure WebSocket connections (wss://) but current setup may use ws://.

**Required Changes:**
1. Ensure socket server supports HTTPS/WSS
2. Update client to use wss:// in production
3. Handle SSL/TLS certificates

**Solution for Server:**
```typescript
// frontend/lib/socket-server.ts
import https from 'https';
import fs from 'fs';

const port = parseInt(process.env.PORT || "4000", 10);
const isProduction = process.env.NODE_ENV === 'production';

let httpServer;

if (isProduction && process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH) {
  // Use HTTPS in production
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };
  httpServer = https.createServer(options, app);
} else {
  // Use HTTP in development
  httpServer = createServer(app);
}

const io = new Server(httpServer, {
  // ... existing config
});
```

### 4. ✅ Server Deployment Architecture

**Problem:** Vercel (and most serverless platforms) don't support persistent WebSocket connections.

**Required Changes:**
1. Deploy socket server as a separate service
2. Use a platform that supports WebSockets (not Vercel serverless)
3. Consider alternatives: Railway, Render, DigitalOcean, AWS EC2, etc.

**Deployment Options:**

#### Option A: Railway/Render (Recommended for simplicity)
- Supports persistent WebSocket connections
- Easy environment variable management
- Automatic HTTPS/WSS

#### Option B: DigitalOcean App Platform
- Supports WebSocket connections
- Built-in load balancing
- Auto-scaling

#### Option C: AWS EC2/ECS
- Full control over infrastructure
- Requires more setup
- Better for high-scale applications

#### Option D: Docker Container
- Deploy to any container platform
- Consistent environment
- Easy to scale

### 5. ✅ Environment Variables Setup

**Required Environment Variables:**

**Socket Server (.env):**
```env
# Server Configuration
PORT=4000
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com

# SSL Configuration (if using custom SSL)
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem

# Optional: Chat Canister (if using IC)
CHAT_CANISTER_ID=your-canister-id
DFX_NETWORK=ic
```

**Frontend (Vercel Environment Variables):**
```env
NEXT_PUBLIC_SOCKET_URL=wss://socket.yourdomain.com
# OR
NEXT_PUBLIC_SOCKET_URL=https://socket.yourdomain.com
```

### 6. ✅ Port and Host Configuration

**Problem:** Server binds to localhost by default, which won't work in production.

**Current Code:**
```typescript
// frontend/lib/socket-server.ts (line 242)
httpServer.listen(port, () => {
  console.log(`🚀 Socket.IO server running on port ${port}`);
});
```

**Required Changes:**
```typescript
const host = process.env.HOST || '0.0.0.0'; // Listen on all interfaces
const port = parseInt(process.env.PORT || "4000", 10);

httpServer.listen(port, host, () => {
  console.log(`🚀 Socket.IO server running on ${host}:${port}`);
  console.log(`📊 Health check available at http://${host}:${port}/health`);
  console.log(`🔗 WebSocket endpoint: ws://${host}:${port}/socket.io/`);
});
```

### 7. ✅ Health Check and Monitoring

**Problem:** Need better health checks and monitoring for production.

**Required Changes:**
1. Enhanced health check endpoint
2. Metrics endpoint for monitoring
3. Graceful shutdown handling

**Solution:**
```typescript
// Enhanced health check
app.get("/health", (req: Request, res: Response) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    activeConnections: activeConnections.size,
    users: getActiveUsers(),
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
  });
});

// Metrics endpoint (optional)
app.get("/metrics", (req: Request, res: Response) => {
  res.json({
    connections: {
      active: activeConnections.size,
      total: getActiveUsers().length,
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
```

### 8. ✅ Error Handling and Logging

**Problem:** Need better error handling and logging for production debugging.

**Required Changes:**
1. Structured logging
2. Error tracking (Sentry, etc.)
3. Connection error handling

**Solution:**
```typescript
// Add winston or pino for structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Use logger instead of console.log
logger.info(`[Connect] ${username} connected (${socket.id})`);
logger.error(`[MessageError] ${error}`);
```

### 9. ✅ Rate Limiting and Security

**Problem:** Need rate limiting and security measures for production.

**Required Changes:**
1. Rate limiting on connections
2. Message rate limiting
3. Input validation
4. Authentication token validation

**Solution:**
```typescript
import rateLimit from 'express-rate-limit';

// Rate limit connections
const connectionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 connections per windowMs
});

app.use('/socket.io/', connectionLimiter);

// Message rate limiting (in socket handler)
const messageLimiter = new Map<string, number[]>();

socket.on("privateMessage", (data: any, callback: (response: any) => void) => {
  const now = Date.now();
  const userMessages = messageLimiter.get(username) || [];
  
  // Remove messages older than 1 minute
  const recentMessages = userMessages.filter(time => now - time < 60000);
  
  if (recentMessages.length >= 60) { // 60 messages per minute
    return callback?.({ error: "Rate limit exceeded" });
  }
  
  recentMessages.push(now);
  messageLimiter.set(username, recentMessages);
  
  // ... rest of message handling
});
```

### 10. ✅ Client-Side Production Configuration

**Problem:** Client needs better error handling and reconnection logic for production.

**Required Changes:**
1. Better reconnection strategy
2. Connection status monitoring
3. Fallback to REST API (already implemented ✅)

**Current Status:** The client already has good fallback logic, but can be improved:

```typescript
// frontend/lib/socket-service.ts
// Already has:
// - REST API fallback ✅
// - Reconnection logic ✅
// - Error suppression ✅

// Suggested improvements:
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

// Add production URL validation
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  if (!process.env.NEXT_PUBLIC_SOCKET_URL) {
    console.warn('[Socket] NEXT_PUBLIC_SOCKET_URL not set in production');
  } else if (SOCKET_URL.startsWith('http://')) {
    console.warn('[Socket] Production socket URL should use HTTPS/WSS');
  }
}
```

## Implementation Checklist

### Server-Side Changes

- [ ] Update CORS to use environment variables
- [ ] Add HTTPS/WSS support
- [ ] Update host binding (0.0.0.0 instead of localhost)
- [ ] Add structured logging
- [ ] Implement rate limiting
- [ ] Add enhanced health checks
- [ ] Add graceful shutdown handling
- [ ] Add metrics endpoint
- [ ] Update environment variable documentation

### Client-Side Changes

- [ ] Validate `NEXT_PUBLIC_SOCKET_URL` in production
- [ ] Add production URL warnings
- [ ] Ensure REST API fallback works (already done ✅)
- [ ] Test reconnection logic in production

### Deployment Changes

- [ ] Set up separate socket server deployment
- [ ] Configure environment variables on hosting platform
- [ ] Set up SSL/TLS certificates
- [ ] Configure domain/DNS for socket server
- [ ] Set up monitoring and alerts
- [ ] Configure auto-restart on failure
- [ ] Set up log aggregation

### Testing

- [ ] Test WebSocket connection from production frontend
- [ ] Test CORS with production domains
- [ ] Test HTTPS/WSS connections
- [ ] Test reconnection after network issues
- [ ] Test rate limiting
- [ ] Test graceful shutdown
- [ ] Load testing for concurrent connections

## Quick Start: Production Deployment

### 1. Update Socket Server Code

Apply all the code changes mentioned above to `frontend/lib/socket-server.ts`.

### 2. Deploy Socket Server

**Using Railway:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=4000
railway variables set ALLOWED_ORIGINS=https://yourdomain.com

# Deploy
railway up
```

**Using Render:**
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `cd frontend && npm install && npm run build`
4. Set start command: `cd frontend && node lib/socket-server.js`
5. Add environment variables
6. Deploy

### 3. Update Frontend Environment Variables

In Vercel (or your hosting platform):
```env
NEXT_PUBLIC_SOCKET_URL=wss://your-socket-server.railway.app
# OR
NEXT_PUBLIC_SOCKET_URL=https://socket.yourdomain.com
```

### 4. Test Connection

1. Deploy frontend
2. Open browser console
3. Check for WebSocket connection logs
4. Verify real-time features work

## Common Production Issues

### Issue: CORS Errors
**Solution:** Ensure `ALLOWED_ORIGINS` includes your production domain exactly as it appears in the browser.

### Issue: Connection Timeout
**Solution:** Check firewall rules, ensure port is open, verify SSL certificates.

### Issue: WebSocket Upgrade Failed
**Solution:** Ensure reverse proxy (nginx, etc.) supports WebSocket upgrades.

### Issue: Too Many Connections
**Solution:** Implement connection limits and rate limiting.

## Additional Resources

- [Socket.IO Production Guide](https://socket.io/docs/v4/production-checklist/)
- [WebSocket Security Best Practices](https://owasp.org/www-community/vulnerabilities/WebSocket)
- [Railway WebSocket Guide](https://docs.railway.app/guides/websockets)
- [Render WebSocket Support](https://render.com/docs/websockets)

---

**Last Updated:** Based on current codebase analysis
**Status:** Ready for implementation




