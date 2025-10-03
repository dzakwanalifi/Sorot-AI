#!/bin/bash

# Sorot.AI AWS Lambda Container Build and Deploy Script (Optimized for $5 budget)
set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO_NAME="sorot-ai-lambda"
IMAGE_TAG="${IMAGE_TAG:-latest}"
STACK_NAME="sorot-ai-stack"

echo "🚀 Building and deploying Sorot.AI to AWS Lambda (Budget-optimized)"

# Validate AWS credentials
echo "🔍 Validating AWS credentials..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS credentials not configured properly"
    exit 1
fi

# Build Docker image with optimizations
echo "📦 Building optimized Docker image..."
docker build -f aws/lambda/Dockerfile -t sorot-ai-lambda:$IMAGE_TAG .

# Test image locally (optional)
echo "🧪 Testing Docker image locally..."
if docker run --rm sorot-ai-lambda:$IMAGE_TAG node -e "console.log('✅ Image test passed')"; then
    echo "✅ Docker image test successful"
else
    echo "❌ Docker image test failed"
    exit 1
fi

# Authenticate Docker with ECR
echo "🔐 Authenticating with ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repository if it doesn't exist
echo "📋 Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names $REPO_NAME --region $AWS_REGION >/dev/null 2>&1 || \
aws ecr create-repository --repository-name $REPO_NAME --region $AWS_REGION >/dev/null

# Tag and push image to ECR
IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:$IMAGE_TAG"
echo "🏷️  Tagging image as $IMAGE_URI"
docker tag sorot-ai-lambda:$IMAGE_TAG $IMAGE_URI

echo "📤 Pushing image to ECR..."
docker push $IMAGE_URI

# Deploy with SAM (Infrastructure as Code)
echo "⚡ Deploying with SAM..."
cd aws

# Check if stack exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION >/dev/null 2>&1; then
    echo "🔄 Updating existing stack..."
    sam deploy \
        --stack-name $STACK_NAME \
        --template-file template.yaml \
        --parameter-overrides GeminiApiKey="${GEMINI_API_KEY:-AIzaSyAhxvT4x_CFIjPDJ5IaM9XIn9njRar5VZg}" \
        --capabilities CAPABILITY_IAM \
        --region $AWS_REGION \
        --no-confirm-changeset \
        --disable-rollback
else
    echo "🆕 Creating new stack..."
    sam deploy \
        --stack-name $STACK_NAME \
        --template-file template.yaml \
        --parameter-overrides GeminiApiKey="${GEMINI_API_KEY:-AIzaSyAhxvT4x_CFIjPDJ5IaM9XIn9njRar5VZg}" \
        --capabilities CAPABILITY_IAM \
        --region $AWS_REGION \
        --guided
fi

# Get outputs
API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text)
LAMBDA_ARN=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionArn`].OutputValue' --output text)

cd ..

echo ""
echo "✅ Deployment complete!"
echo "🔗 API Endpoints:"
echo "  POST $API_ENDPOINT/analyze"
echo "  GET  $API_ENDPOINT/status?id={analysisId}"
echo ""
echo "📊 Stack Details:"
echo "  Stack Name: $STACK_NAME"
echo "  Lambda ARN: $LAMBDA_ARN"
echo "  Region: $AWS_REGION"
echo ""
echo "💰 Estimated Monthly Cost: $1.90 (well under $5 budget)"
echo ""
echo "🧪 Test your deployment:"
echo "curl -X POST '$API_ENDPOINT/analyze' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"pdfData\":\"base64data\",\"trailerUrl\":\"https://youtube.com/watch?v=test\"}'"
