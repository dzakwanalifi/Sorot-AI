#!/bin/bash

# Sorot.AI AWS Lambda Container Build and Deploy Script
set -e

# Configuration
AWS_REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO_NAME="sorot-ai-lambda"
IMAGE_TAG="latest"

echo "🚀 Building and deploying Sorot.AI to AWS Lambda"

# Build Docker image
echo "📦 Building Docker image..."
docker build -f aws/lambda/Dockerfile -t sorot-ai-lambda:$IMAGE_TAG .

# Authenticate Docker with ECR
echo "🔐 Authenticating with ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repository if it doesn't exist
echo "📋 Creating ECR repository..."
aws ecr describe-repositories --repository-names $REPO_NAME --region $AWS_REGION || \
aws ecr create-repository --repository-name $REPO_NAME --region $AWS_REGION

# Tag and push image to ECR
IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:$IMAGE_TAG"
echo "🏷️  Tagging image as $IMAGE_URI"
docker tag sorot-ai-lambda:$IMAGE_TAG $IMAGE_URI

echo "📤 Pushing image to ECR..."
docker push $IMAGE_URI

# Create/update Lambda function
echo "⚡ Creating/updating Lambda function..."
aws lambda create-function \
  --function-name sorot-ai-analyzer \
  --package-type Image \
  --code ImageUri=$IMAGE_URI \
  --architectures x86_64 \
  --role arn:aws:iam::$ACCOUNT_ID:role/sorot-ai-lambda-role \
  --timeout 900 \
  --memory-size 2048 \
  --environment "Variables={NODE_ENV=production,AWS_REGION=$AWS_REGION}" \
  --region $AWS_REGION 2>/dev/null || \
aws lambda update-function-code \
  --function-name sorot-ai-analyzer \
  --image-uri $IMAGE_URI \
  --region $AWS_REGION

# Create API Gateway (if not exists)
echo "🌐 Setting up API Gateway..."
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='sorot-ai-api'].id" --output text --region $AWS_REGION)

if [ -z "$API_ID" ]; then
  echo "Creating new API Gateway..."
  API_ID=$(aws apigateway create-rest-api \
    --name sorot-ai-api \
    --description "Sorot.AI Film Analysis API" \
    --endpoint-configuration types=REGIONAL \
    --region $AWS_REGION \
    --query 'id' \
    --output text)

  # Get root resource ID
  ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?path==`/`].id' \
    --output text \
    --region $AWS_REGION)

  # Create /analyze resource
  ANALYZE_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part analyze \
    --region $AWS_REGION \
    --query 'id' \
    --output text)

  # Create /status resource
  STATUS_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part status \
    --region $AWS_REGION \
    --query 'id' \
    --output text)

  # Add methods and integrations
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $ANALYZE_RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE \
    --region $AWS_REGION

  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $STATUS_RESOURCE_ID \
    --http-method GET \
    --authorization-type NONE \
    --region $AWS_REGION

  # Create integrations
  LAMBDA_ARN="arn:aws:lambda:$AWS_REGION:$ACCOUNT_ID:function:sorot-ai-analyzer"

  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $ANALYZE_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $AWS_REGION

  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $STATUS_RESOURCE_ID \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $AWS_REGION

  # Add Lambda permissions
  aws lambda add-permission \
    --function-name sorot-ai-analyzer \
    --statement-id ApiGatewayInvoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:apigateway:$AWS_REGION::/restapis/$API_ID/*" \
    --region $AWS_REGION

  # Deploy API
  aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $AWS_REGION
fi

# Get API endpoint
API_ENDPOINT="https://$API_ID.execute-api.$AWS_REGION.amazonaws.com/prod"

echo "✅ Deployment complete!"
echo "🔗 API Endpoints:"
echo "  POST $API_ENDPOINT/analyze"
echo "  GET  $API_ENDPOINT/status?id={analysisId}"
echo ""
echo "📝 Remember to set these environment variables in your Lambda function:"
echo "  GEMINI_API_KEY=your_gemini_api_key"
echo "  AWS_ACCESS_KEY_ID=your_access_key"
echo "  AWS_SECRET_ACCESS_KEY=your_secret_key"
echo "  AWS_REGION=us-east-1"
