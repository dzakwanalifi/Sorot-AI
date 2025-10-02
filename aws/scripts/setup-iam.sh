#!/bin/bash

# Sorot.AI AWS IAM Setup Script
set -e

AWS_REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🔐 Setting up IAM roles and policies for Sorot.AI"

# Create IAM policy for Lambda
POLICY_DOCUMENT='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*:'$ACCOUNT_ID':inference-profile/*",
        "arn:aws:bedrock:*::foundation-model/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech",
        "polly:DescribeVoices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    }
  ]
}'

# Create policy
echo "📋 Creating IAM policy..."
POLICY_ARN=$(aws iam create-policy \
  --policy-name SorotAILambdaPolicy \
  --policy-document "$POLICY_DOCUMENT" \
  --query 'Policy.Arn' \
  --output text 2>/dev/null || \
aws iam get-policy \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/SorotAILambdaPolicy \
  --query 'Policy.Arn' \
  --output text)

echo "Policy ARN: $POLICY_ARN"

# Create trust policy for Lambda
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

# Create IAM role
echo "👤 Creating IAM role..."
aws iam create-role \
  --role-name sorot-ai-lambda-role \
  --assume-role-policy-document "$TRUST_POLICY" \
  --query 'Role.Arn' \
  --output text 2>/dev/null || \
echo "Role already exists"

# Attach policy to role
echo "🔗 Attaching policy to role..."
aws iam attach-role-policy \
  --role-name sorot-ai-lambda-role \
  --policy-arn $POLICY_ARN

# Wait for role to be ready
echo "⏳ Waiting for IAM role to propagate..."
sleep 10

echo "✅ IAM setup complete!"
echo "🔑 Role ARN: arn:aws:iam::$ACCOUNT_ID:role/sorot-ai-lambda-role"
