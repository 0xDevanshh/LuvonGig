#!/bin/bash

# Script to rebuild and redeploy escrow canister to fix IDL mismatch

set -e

echo "🔨 Building escrow canister..."
dfx build escrow --network ic

echo ""
echo "📦 Deploying escrow canister to IC mainnet..."
echo "⚠️  This will upgrade the existing canister. Press Ctrl+C to cancel within 5 seconds..."
sleep 5

dfx deploy escrow --network ic --upgrade-unchanged

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Canister info:"
dfx canister info escrow --network ic

echo ""
echo "🧪 Testing canister interface..."
dfx canister call --network ic escrow get_treasury --query

echo ""
echo "✅ Escrow canister redeployed successfully!"
echo "   Canister ID: $(dfx canister id escrow --network ic)"
echo ""
echo "⚠️  Please clear your browser cache and Plug wallet cache, then try releasing funds again."


