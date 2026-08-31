#!/bin/bash

# Script to start the Socket.IO chat server
# This server enables real-time websocket communication for chat
# If this server is not running, chat will still work via REST API fallback

echo "🚀 Starting Socket.IO Chat Server..."
echo "📝 Note: Chat will work via REST API if this server is not running"
echo ""

# Check if port 4000 is already in use
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 4000 is already in use. The server may already be running."
    echo "   If you want to restart, please stop the existing server first."
    exit 1
fi

# Navigate to frontend directory
cd "$(dirname "$0")/.." || exit 1

# Check if ts-node is available
if command -v ts-node &> /dev/null; then
    echo "✅ Using ts-node to run TypeScript server"
    npx ts-node components/socketIoChat/server.ts
elif [ -f "lib/socket-server.js" ]; then
    echo "✅ Using compiled JavaScript server"
    node lib/socket-server.js
else
    echo "❌ Error: Neither ts-node nor compiled server found"
    echo "   Please install ts-node: npm install -g ts-node"
    echo "   Or compile the server: npx tsc components/socketIoChat/server.ts"
    exit 1
fi


