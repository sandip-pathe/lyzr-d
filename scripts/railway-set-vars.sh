#!/bin/bash

# ========================================
# Railway Environment Variables Setup
# ========================================

echo "🚀 Setting up Railway environment variables..."

# Get service name
SERVICE_NAME="${1:-lyzr-d}"

echo "📦 Setting variables for service: $SERVICE_NAME"

# Set environment variables one by one
# NOTE: Replace <your-temporal-api-key> and <your-openai-api-key> with actual values from backend/.env
railway variables \
  --set "TEMPORAL_HOST=ap-south-1.aws.api.temporal.io:7233" \
  --set "TEMPORAL_NAMESPACE=lyzr.ww6tj" \
  --set "TEMPORAL_API_KEY=<your-temporal-api-key>" \
  --set "OPENAI_API_KEY=<your-openai-api-key>" \
  --set 'CORS_ORIGINS=["http://localhost:3000"]' \
  --set "DEBUG=false" \
  --set "PYTHONUNBUFFERED=1" \
  -s "$SERVICE_NAME"

echo ""
echo "⚠️  Note: DATABASE_URL and REDIS_URL must be linked in Railway dashboard:"
echo "   1. Go to Railway dashboard"
echo "   2. Click your service"
echo "   3. Go to Variables tab"
echo "   4. Add Reference Variable:"
echo "      - DATABASE_URL -> Postgres.DATABASE_URL"
echo "      - REDIS_URL -> Redis.REDIS_URL"
echo ""
echo "✅ Environment variables set!"
echo ""
echo "🔍 To verify, run:"
echo "   railway variables -s $SERVICE_NAME"
