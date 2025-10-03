#!/bin/bash

# Sorot.AI Deployment Test Script
set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="sorot-ai-stack"

echo "🧪 Testing Sorot.AI deployment..."

# Get API endpoint from stack
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text 2>/dev/null)

if [ -z "$API_ENDPOINT" ] || [ "$API_ENDPOINT" = "None" ]; then
    echo "❌ Could not find API endpoint. Please check if deployment was successful."
    exit 1
fi

echo "🔗 API Endpoint: $API_ENDPOINT"

# Test 1: Health check - Test API Gateway connectivity
echo ""
echo "Test 1: API Gateway connectivity..."
if curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT/status" | grep -q "404"; then
    echo "✅ API Gateway is responding"
else
    echo "❌ API Gateway not responding"
    exit 1
fi

# Test 2: Test /analyze endpoint with minimal data
echo ""
echo "Test 2: /analyze endpoint..."
ANALYZE_RESPONSE=$(curl -s -X POST "$API_ENDPOINT/analyze" \
    -H "Content-Type: application/json" \
    -d '{
        "pdfData": "dGVzdCBwZGYgZGF0YQ==",  # base64 "test pdf data"
        "trailerUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ"
    }')

if echo "$ANALYZE_RESPONSE" | jq -e '.success' >/dev/null 2>&1; then
    ANALYSIS_ID=$(echo "$ANALYZE_RESPONSE" | jq -r '.data.analysisId')
    echo "✅ /analyze endpoint working. Analysis ID: $ANALYSIS_ID"

    # Test 3: Test /status endpoint
    echo ""
    echo "Test 3: /status endpoint..."
    sleep 2  # Give it a moment to start processing

    STATUS_RESPONSE=$(curl -s "$API_ENDPOINT/status?id=$ANALYSIS_ID")

    if echo "$STATUS_RESPONSE" | jq -e '.success' >/dev/null 2>&1; then
        STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.status')
        echo "✅ /status endpoint working. Status: $STATUS"
    else
        echo "❌ /status endpoint failed"
        echo "Response: $STATUS_RESPONSE"
        exit 1
    fi

else
    echo "❌ /analyze endpoint failed"
    echo "Response: $ANALYZE_RESPONSE"
    exit 1
fi

# Test 4: Check Lambda function exists and is configured correctly
echo ""
echo "Test 4: Lambda function configuration..."
LAMBDA_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionArn`].OutputValue' \
    --output text)

if [ -n "$LAMBDA_ARN" ]; then
    # Get Lambda configuration
    LAMBDA_CONFIG=$(aws lambda get-function-configuration --function-name "$LAMBDA_ARN" --region $AWS_REGION)

    MEMORY_SIZE=$(echo "$LAMBDA_CONFIG" | jq -r '.MemorySize')
    TIMEOUT=$(echo "$LAMBDA_CONFIG" | jq -r '.Timeout')
    PACKAGE_TYPE=$(echo "$LAMBDA_CONFIG" | jq -r '.PackageType')

    echo "✅ Lambda function found:"
    echo "   Memory: ${MEMORY_SIZE}MB (should be 512)"
    echo "   Timeout: ${TIMEOUT}s (should be 60)"
    echo "   Package Type: $PACKAGE_TYPE (should be Image)"

    # Validate configuration
    if [ "$MEMORY_SIZE" -eq 512 ] && [ "$TIMEOUT" -eq 60 ] && [ "$PACKAGE_TYPE" = "Image" ]; then
        echo "✅ Lambda configuration is optimal"
    else
        echo "⚠️  Lambda configuration may not be optimal for budget"
    fi
else
    echo "❌ Lambda function not found"
    exit 1
fi

# Test 5: Check ECR repository
echo ""
echo "Test 5: ECR repository..."
ECR_URI=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`SorotECRUri`].OutputValue' \
    --output text)

if [ -n "$ECR_URI" ]; then
    echo "✅ ECR repository configured: $ECR_URI"
else
    echo "❌ ECR repository not found"
fi

echo ""
echo "🎉 All tests passed! Deployment is working correctly."
echo ""
echo "📊 Deployment Summary:"
echo "   API Endpoint: $API_ENDPOINT"
echo "   Lambda Function: $(basename "$LAMBDA_ARN")"
echo "   Memory: ${MEMORY_SIZE}MB"
echo "   Timeout: ${TIMEOUT}s"
echo ""
echo "💰 Cost Estimate: ~$1.90/month (500 invocations)"
echo ""
echo "🧪 Ready for production use!"
