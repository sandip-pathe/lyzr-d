#!/bin/bash

# ========================================
# Deployment Validation Script
# ========================================
# Run this script to validate your deployment
# Usage: ./validate_deployment.sh

set -e

echo "🔍 Lyzr Orchestrator - Deployment Validation"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get URLs from user
echo "📋 Please provide your deployment URLs:"
echo ""
read -p "Backend URL (e.g., https://backend.up.railway.app): " BACKEND_URL
read -p "Frontend URL (e.g., https://app.vercel.app): " FRONTEND_URL

echo ""
echo "Starting validation..."
echo ""

# Test 1: Backend Health Check
echo "Test 1: Backend Health Check"
echo "-----------------------------"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
    curl -s "$BACKEND_URL/health" | jq '.' || echo ""
else
    echo -e "${RED}✗ Backend health check failed (HTTP $HEALTH_RESPONSE)${NC}"
    exit 1
fi
echo ""

# Test 2: Backend API Endpoints
echo "Test 2: Backend API Endpoints"
echo "------------------------------"
WORKFLOWS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/workflows")
if [ "$WORKFLOWS_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ Workflows endpoint accessible${NC}"
else
    echo -e "${RED}✗ Workflows endpoint failed (HTTP $WORKFLOWS_RESPONSE)${NC}"
fi
echo ""

# Test 3: Frontend Accessibility
echo "Test 3: Frontend Accessibility"
echo "-------------------------------"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend is not accessible (HTTP $FRONTEND_RESPONSE)${NC}"
fi
echo ""

# Test 4: CORS Configuration
echo "Test 4: CORS Configuration"
echo "--------------------------"
CORS_RESPONSE=$(curl -s -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: GET" -I "$BACKEND_URL/api/workflows" | grep -i "access-control-allow-origin")
if [ ! -z "$CORS_RESPONSE" ]; then
    echo -e "${GREEN}✓ CORS headers present${NC}"
    echo "  $CORS_RESPONSE"
else
    echo -e "${YELLOW}⚠ CORS headers not found - check CORS_ORIGINS setting${NC}"
fi
echo ""

# Test 5: WebSocket Support
echo "Test 5: WebSocket Support"
echo "-------------------------"
# Extract domain from backend URL
WS_URL=$(echo "$BACKEND_URL" | sed 's/https/wss/g')
echo "Testing WebSocket at: $WS_URL/ws"
echo -e "${YELLOW}ℹ Manual test required: Check browser console for WebSocket connection${NC}"
echo ""

# Summary
echo "=============================================="
echo "Validation Summary"
echo "=============================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "WebSocket URL: $WS_URL"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Open $FRONTEND_URL in your browser"
echo "2. Create a test workflow (Trigger → Agent → End)"
echo "3. Run the workflow and verify execution"
echo "4. Check Temporal Cloud dashboard for workflow activity"
echo ""
echo -e "${GREEN}✓ Automated validation complete!${NC}"
