#!/bin/bash

# Set environment variables to avoid color output issues
export TERM=dumb
export NO_COLOR=1
export DFX_LOG_LEVEL=error

# Function to deploy and capture canister ID
deploy_canister() {
    local canister_name=$1
    echo "Deploying $canister_name..."
    
    # Capture the output and extract canister ID
    output=$(dfx deploy $canister_name --network ic --yes 2>&1)
    
    # Extract canister ID from the output
    canister_id=$(echo "$output" | grep -o 'Canister ID: [a-z0-9-]*' | cut -d' ' -f3)
    
    if [ -n "$canister_id" ]; then
        echo "$canister_name: $canister_id"
    else
        echo "$canister_name: Failed to get ID"
    fi
}

echo "Starting deployment to IC mainnet..."

# Deploy each canister
deploy_canister "basic_backend"
deploy_canister "user"
deploy_canister "user_v2"
deploy_canister "hackathon"
deploy_canister "marketplace"
deploy_canister "chat_storage"

echo "Deployment completed!"


