#!/bin/bash

# ICP Ledger Freelance Marketplace Deployment Script
# This script deploys the marketplace canister and configures the environment

set -e

echo "🚀 Starting ICP Ledger Freelance Marketplace Deployment..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Please install the Internet Computer SDK first."
    echo "   Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install/"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "dfx.json" ]; then
    echo "❌ dfx.json not found. Please run this script from the backend directory."
    exit 1
fi

# Parse command line arguments
NETWORK="local"
CLEAN=false
GENERATE_DECLARATIONS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --network)
            NETWORK="$2"
            shift 2
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --generate-declarations)
            GENERATE_DECLARATIONS=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --network <network>    Deploy to specific network (local, ic)"
            echo "  --clean               Clean deployment (remove existing canisters)"
            echo "  --generate-declarations  Generate TypeScript declarations"
            echo "  --help                 Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "📋 Deployment Configuration:"
echo "   Network: $NETWORK"
echo "   Clean: $CLEAN"
echo "   Generate Declarations: $GENERATE_DECLARATIONS"

# Start dfx if using local network
if [ "$NETWORK" = "local" ]; then
    echo "🔧 Starting local IC replica..."
    if [ "$CLEAN" = true ]; then
        dfx start --clean --background
    else
        dfx start --background
    fi
    sleep 5
fi

# Deploy marketplace canister
echo "📦 Deploying marketplace canister..."

if [ "$NETWORK" = "ic" ]; then
    dfx deploy --network ic marketplace
else
    dfx deploy marketplace
fi

# Get canister ID
MARKETPLACE_ID=$(dfx canister id marketplace)
echo "✅ Marketplace canister deployed with ID: $MARKETPLACE_ID"

# Update frontend environment variables
FRONTEND_ENV_FILE="../frontend/.env.local"
echo "🔧 Updating frontend environment variables..."

# Create or update .env.local
if [ -f "$FRONTEND_ENV_FILE" ]; then
    # Update existing MARKETPLACE_CANISTER_ID
    if grep -q "MARKETPLACE_CANISTER_ID" "$FRONTEND_ENV_FILE"; then
        sed -i "s/MARKETPLACE_CANISTER_ID=.*/MARKETPLACE_CANISTER_ID=$MARKETPLACE_ID/" "$FRONTEND_ENV_FILE"
    else
        echo "MARKETPLACE_CANISTER_ID=$MARKETPLACE_ID" >> "$FRONTEND_ENV_FILE"
    fi
else
    # Create new .env.local
    cat > "$FRONTEND_ENV_FILE" << EOF
# Marketplace Canister
MARKETPLACE_CANISTER_ID=$MARKETPLACE_ID

# ICRC-1 Ledger (mainnet or local)
ICRC1_LEDGER_CANISTER_ID=ryjl3-tyaaa-aaaaa-aaaba-cai

# Platform configuration
PLATFORM_FEE_PERCENT=5
PLATFORM_ACCOUNT_PRINCIPAL=rdmx6-jaaaa-aaaah-qcaiq-cai

# IC Configuration
IC_HOST=${IC_HOST:-http://localhost:4943}
NODE_ENV=development
EOF
fi

echo "✅ Frontend environment updated"

# Generate TypeScript declarations if requested
if [ "$GENERATE_DECLARATIONS" = true ]; then
    echo "📝 Generating TypeScript declarations..."
    cd ../frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    # Generate declarations
    if command -v dfx &> /dev/null; then
        dfx generate marketplace
    else
        echo "⚠️  dfx not found in PATH. Please generate declarations manually:"
        echo "   cd frontend && dfx generate marketplace"
    fi
    
    cd ../backend
fi

# Test canister deployment
echo "🧪 Testing canister deployment..."

# Test basic canister functionality
echo "   Testing getStats..."
STATS_RESULT=$(dfx canister call marketplace getStats 2>/dev/null || echo "Failed")
if [[ "$STATS_RESULT" == *"total_services"* ]]; then
    echo "   ✅ getStats working"
else
    echo "   ❌ getStats failed"
fi

# Test service creation (mock)
echo "   Testing service creation..."
SERVICE_RESULT=$(dfx canister call marketplace createService '("USER123", record {
    title = "Test Service";
    main_category = "Web Design";
    sub_category = "UI/UX";
    description = "Test service description";
    whats_included = "Test deliverables";
    cover_image_url = null;
    portfolio_images = [];
    status = #Active;
    created_at = 0;
    updated_at = 0;
    rating_avg = 0.0;
    total_orders = 0;
})' 2>/dev/null || echo "Failed")
if [[ "$SERVICE_RESULT" == *"ok"* ]]; then
    echo "   ✅ Service creation working"
else
    echo "   ❌ Service creation failed"
fi

# Display deployment summary
echo ""
echo "🎉 Deployment Complete!"
echo "================================"
echo "Marketplace Canister ID: $MARKETPLACE_ID"
echo "Network: $NETWORK"
echo "Frontend Config: $FRONTEND_ENV_FILE"
echo ""

if [ "$NETWORK" = "local" ]; then
    echo "🔗 Local Development URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   IC Dashboard: http://localhost:4943"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Start the frontend: cd frontend && npm run dev"
    echo "   2. Open http://localhost:3000 in your browser"
    echo "   3. Test the marketplace functionality"
else
    echo "🌐 Mainnet Deployment:"
    echo "   Canister ID: $MARKETPLACE_ID"
    echo "   Network: Internet Computer Mainnet"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Update frontend IC_HOST to https://ic0.app"
    echo "   2. Deploy frontend to production"
    echo "   3. Test with real ICP tokens"
fi

echo ""
echo "📚 Documentation:"
echo "   API Reference: docs/MARKETPLACE_API.md"
echo "   Test Plan: backend/tests/marketplace-test-plan.md"
echo ""

# Optional: Run basic tests
read -p "🧪 Run basic tests? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running basic tests..."
    
    # Test service listing
    echo "   Testing service listing..."
    dfx canister call marketplace listServices '(record {
        category = null;
        freelancer_id = null;
        search_term = "";
        limit = 10;
        offset = 0;
    })' > /dev/null 2>&1 && echo "   ✅ Service listing working" || echo "   ❌ Service listing failed"
    
    # Test package creation
    echo "   Testing package creation..."
    dfx canister call marketplace createPackage '("USER123", record {
        service_id = "SV-12345678";
        tier = #Basic;
        title = "Test Package";
        description = "Test package description";
        price_e8s = 50_000_000;
        delivery_days = 7;
        features = ["Feature 1"];
        revisions_included = 2;
        status = #Available;
        created_at = 0;
        updated_at = 0;
    })' > /dev/null 2>&1 && echo "   ✅ Package creation working" || echo "   ❌ Package creation failed"
    
    echo "✅ Basic tests completed"
fi

echo ""
echo "🎯 Deployment successful! The ICP Ledger Freelance Marketplace is ready to use."
