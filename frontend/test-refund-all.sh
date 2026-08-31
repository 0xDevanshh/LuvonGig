#!/bin/bash

# Test script for refund-all escrow route
# Make sure your Next.js server is running before executing this

echo "🧪 Testing Refund All Escrows API"
echo "=================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Error: Next.js server is not running on http://localhost:3000"
    echo "   Please start your server first with: npm run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Check environment variables
echo "📋 Checking required environment variables..."
if [ -z "$NEXT_PUBLIC_ESCROW_CANISTER_ID" ]; then
    echo "⚠️  Warning: NEXT_PUBLIC_ESCROW_CANISTER_ID is not set"
    echo "   Make sure it's set in your .env.local file"
else
    echo "✅ NEXT_PUBLIC_ESCROW_CANISTER_ID is set"
fi

if [ -z "$NEXT_PUBLIC_IC_HOST" ]; then
    echo "⚠️  Warning: NEXT_PUBLIC_IC_HOST is not set (will default to https://icp0.io)"
else
    echo "✅ NEXT_PUBLIC_IC_HOST is set: $NEXT_PUBLIC_IC_HOST"
fi

echo ""
echo "📝 To test the API, you need to:"
echo "   1. Be logged in (have a valid session cookie)"
echo "   2. Have a wallet connected in your profile"
echo ""
echo "🔧 Example curl command:"
echo ""
echo "curl -X POST http://localhost:3000/api/escrow/refund-all \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Cookie: your-session-cookie-here'"
echo ""
echo "Or with specific escrow IDs:"
echo ""
echo "curl -X POST http://localhost:3000/api/escrow/refund-all \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Cookie: your-session-cookie-here' \\"
echo "  -d '{\"escrowIds\": [\"escrow-id-1\", \"escrow-id-2\"]}'"
echo ""


