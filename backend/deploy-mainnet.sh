#!/bin/bash

# Set environment variables to avoid color output issues
export TERM=dumb
export NO_COLOR=1
export DFX_LOG_LEVEL=error

echo "Starting deployment to IC mainnet..."

# Deploy each canister individually
echo "Deploying basic_backend..."
dfx deploy basic_backend --network ic --yes

echo "Deploying user..."
dfx deploy user --network ic --yes

echo "Deploying user_v2..."
dfx deploy user_v2 --network ic --yes

echo "Deploying hackathon..."
dfx deploy hackathon --network ic --yes

echo "Deploying marketplace..."
dfx deploy marketplace --network ic --yes

echo "Deploying chat_storage..."
dfx deploy chat_storage --network ic --yes

echo "Deployment completed!"
echo "Getting canister IDs..."

echo "basic_backend: $(dfx canister id basic_backend --network ic 2>/dev/null)"
echo "user: $(dfx canister id user --network ic 2>/dev/null)"
echo "user_v2: $(dfx canister id user_v2 --network ic 2>/dev/null)"
echo "hackathon: $(dfx canister id hackathon --network ic 2>/dev/null)"
echo "marketplace: $(dfx canister id marketplace --network ic 2>/dev/null)"
echo "chat_storage: $(dfx canister id chat_storage --network ic 2>/dev/null)"


