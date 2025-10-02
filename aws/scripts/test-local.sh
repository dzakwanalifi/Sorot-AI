#!/bin/bash

# Sorot.AI Local Container Testing Script
set -e

echo "🧪 Testing Sorot.AI Lambda container locally"

# Build Docker image
echo "📦 Building Docker image..."
docker build -f aws/lambda/Dockerfile -t sorot-ai-lambda:test .

# Run container locally
echo "🚀 Running container locally on port 8080..."
docker run -p 8080:8080 \
  -e GEMINI_API_KEY="${GEMINI_API_KEY:-test_key}" \
  -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test_key}" \
  -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test_secret}" \
  -e AWS_REGION="${AWS_REGION:-us-east-1}" \
  -e NODE_ENV="${NODE_ENV:-development}" \
  --name sorot-ai-test \
  sorot-ai-lambda:test

# Note: Container will run until stopped with Ctrl+C
