#!/bin/bash

# Test script for escrow functionality
# This script tests the complete escrow flow: create, fund, and release

echo "=== Testing Escrow Complete Service Creation ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3000"
ESCROW_AMOUNT_ICP=0.1
ESCROW_AMOUNT_E8S=10000000

echo "Testing escrow functionality..."
echo "Amount: ${ESCROW_AMOUNT_ICP} ICP (${ESCROW_AMOUNT_E8S} e8s)"
echo ""

# Step 1: Test escrow creation API
echo -e "${YELLOW}Step 1: Creating escrow...${NC}"

CREATE_RESPONSE=$(curl -s -X POST "${API_BASE}/api/escrow/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"test-project-123\",
    \"freelancerUserId\": \"test-freelancer-id\",
    \"amountE8s\": ${ESCROW_AMOUNT_E8S}
  }")

echo "Create response: $CREATE_RESPONSE"

# Extract escrow ID and deposit account
ESCROW_ID=$(echo $CREATE_RESPONSE | jq -r '.data.escrowId')
DEPOSIT_OWNER=$(echo $CREATE_RESPONSE | jq -r '.data.depositAccount.owner')
DEPOSIT_SUBACCOUNT=$(echo $CREATE_RESPONSE | jq -r '.data.depositAccount.subaccount')

if [ "$ESCROW_ID" = "null" ] || [ -z "$ESCROW_ID" ]; then
  echo -e "${RED}❌ Failed to create escrow${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Escrow created successfully${NC}"
echo "Escrow ID: $ESCROW_ID"
echo "Deposit Account Owner: $DEPOSIT_OWNER"
echo ""

# Step 2: Test escrow refresh API (before funding)
echo -e "${YELLOW}Step 2: Checking funding status (before deposit)...${NC}"

REFRESH_RESPONSE=$(curl -s "${API_BASE}/api/escrow/${ESCROW_ID}/refresh")

echo "Refresh response: $REFRESH_RESPONSE"

FUNDED=$(echo $REFRESH_RESPONSE | jq -r '.data.funded')
BALANCE=$(echo $REFRESH_RESPONSE | jq -r '.data.balanceE8s')

echo "Funded: $FUNDED"
echo "Balance: $BALANCE e8s"
echo ""

# Step 3: Simulate funding (in a real scenario, this would be done via Plug wallet)
echo -e "${YELLOW}Step 3: Simulating ICP deposit...${NC}"
echo "In production, user would send ${ESCROW_AMOUNT_ICP} ICP to:"
echo "Owner: $DEPOSIT_OWNER"
echo "Subaccount: $DEPOSIT_SUBACCOUNT"
echo ""

# Step 4: Test escrow refresh API (after simulated funding)
echo -e "${YELLOW}Step 4: Checking funding status (after simulated deposit)...${NC}"
echo "Note: This will still show unfunded since we can't actually send ICP in this test"
echo ""

# Step 5: Test escrow release API (will fail since not funded, but tests the API)
echo -e "${YELLOW}Step 5: Testing escrow release (should fail since not funded)...${NC}"

RELEASE_RESPONSE=$(curl -s -X POST "${API_BASE}/api/escrow/${ESCROW_ID}/release")

echo "Release response: $RELEASE_RESPONSE"

RELEASE_SUCCESS=$(echo $RELEASE_RESPONSE | jq -r '.success')

if [ "$RELEASE_SUCCESS" = "false" ]; then
  echo -e "${GREEN}✅ Release correctly failed (escrow not funded)${NC}"
else
  echo -e "${RED}❌ Release should have failed${NC}"
fi

echo ""
echo -e "${GREEN}=== Escrow API Test Complete ===${NC}"
echo ""
echo "To test the complete flow in production:"
echo "1. Create escrow via /api/escrow/create"
echo "2. User sends ICP to the deposit address using Plug wallet"
echo "3. Poll /api/escrow/{id}/refresh until funded"
echo "4. Client calls /api/escrow/{id}/release to complete payment"
echo ""
echo "Environment variables needed:"
echo "- NEXT_PUBLIC_ESCROW_CANISTER_ID: Escrow canister principal"
echo "- NEXT_PUBLIC_IC_HOST: IC network host"