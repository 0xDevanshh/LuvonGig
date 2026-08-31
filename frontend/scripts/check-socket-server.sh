#!/bin/bash

# Socket.IO Server Status Check and Start Script

echo "🔍 Checking Socket.IO server status..."

# Check if port 4000 is in use
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Socket.IO server is running on port 4000"

    # Show health status
    echo "📊 Health Status:"
    curl -s http://localhost:4000/health | jq '.'

    # Show connected users
    USERS=$(curl -s http://localhost:4000/health | jq -r '.users | join(", ")')
    echo "👥 Connected users: $USERS"

    exit 0
else
    echo "❌ Socket.IO server is not running"
    echo "🚀 Starting Socket.IO server..."

    # Change to the frontend directory
    cd "$(dirname "$0")/.."

    # Start the socket server
    if [ "$1" = "--background" ] || [ "$1" = "-b" ]; then
        echo "🔄 Starting Socket.IO server in background..."
        nohup npm run socket-server > socket-server.log 2>&1 &
        echo "✅ Socket.IO server started in background (PID: $!)"
        echo "📝 Logs: socket-server.log"

        # Wait a moment and check if it started successfully
        sleep 3
        if curl -s http://localhost:4000/health > /dev/null 2>&1; then
            echo "✅ Socket.IO server started successfully!"
        else
            echo "❌ Failed to start Socket.IO server. Check logs."
        fi
    else
        echo "🔄 Starting Socket.IO server in foreground..."
        npm run socket-server
    fi
fi