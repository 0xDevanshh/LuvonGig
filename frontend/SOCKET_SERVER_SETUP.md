# Socket.IO Chat Server Setup

## Overview

The chat system uses Socket.IO for real-time websocket communication. However, **chat will work without the socket server** - it will automatically fall back to REST API calls.

## Running the Socket Server (Optional)

The socket server enables real-time features like:
- Instant message delivery
- Typing indicators
- Online status
- Real-time message synchronization

### Option 1: Using npm script (Recommended)

```bash
cd frontend
npm run socket:start
```

### Option 2: Using direct command

```bash
cd frontend
npm run socket:direct
```

### Option 3: Using the shell script

```bash
cd frontend
bash scripts/start-socket-server.sh
```

## Default Configuration

- **Port**: 4000
- **URL**: `http://localhost:4000`
- **Health Check**: `http://localhost:4000/health`

## Environment Variables

You can configure the socket server using environment variables:

```bash
# .env.local or .env
PORT=4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
CHAT_CANISTER_ID=your-canister-id
DFX_NETWORK=local  # or 'ic' for mainnet
```

## Troubleshooting

### Port Already in Use

If port 4000 is already in use:

```bash
# Find the process using port 4000
lsof -i :4000

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Or use a different port
PORT=4001 npm run socket:start
```

### WebSocket Connection Errors

**This is normal!** The chat system is designed to work without the socket server:

- ✅ Chat will work via REST API fallback
- ✅ Messages will be saved and retrieved correctly
- ⚠️ Real-time features (typing indicators, instant delivery) won't work

The websocket errors in the console are suppressed and won't break the application.

### Checking Server Status

```bash
# Check if server is running
curl http://localhost:4000/health

# Should return:
# {
#   "status": "healthy",
#   "activeConnections": 0,
#   "users": []
# }
```

## Development Workflow

### With Socket Server (Full Features)

1. Start Next.js dev server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, start socket server:
   ```bash
   npm run socket:start
   ```

### Without Socket Server (REST API Only)

Just start Next.js:
```bash
npm run dev
```

Chat will work perfectly, just without real-time features.

## Production Deployment

For production, you'll need to:

1. Deploy the socket server as a separate service
2. Set `NEXT_PUBLIC_SOCKET_URL` to your production socket server URL
3. Ensure CORS is configured correctly

The socket server can be deployed to:
- A separate Node.js server
- A containerized service (Docker)
- A serverless function (with limitations)

## Notes

- The socket server is **optional** - chat works without it
- All messages are saved via REST API routes
- WebSocket errors are handled gracefully
- The application will not crash if the socket server is unavailable


