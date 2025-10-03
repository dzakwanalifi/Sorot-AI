# Sorot.AI AWS Deployment Guide

## 🎬 Overview
Sorot.AI is an AI-powered film curation platform deployed as a serverless containerized application on AWS Lambda using SAM CLI. This guide provides a comprehensive, step-by-step deployment process with detailed troubleshooting for all encountered issues.

## 🏗️ Architecture Overview

### AWS Services Used
- **AWS Lambda Container**: `sorot-ai-analyzer` (Node.js 18, 512MB RAM, 60s timeout)
- **Amazon ECR**: `sorot-ai-lambda` repository for container images
- **API Gateway HTTP API v2**: `sorot-ai-stack` with CORS enabled
- **IAM Role**: `sorot-ai-lambda-role` with Bedrock and Polly permissions
- **CloudFormation Stack**: `sorot-ai-stack` for infrastructure as code

### AI Models Integration
- **DeepSeek-R1** via AWS Bedrock (`deepseek.r1-v1:0`)
- **Gemini 2.5 Flash-Lite** via Google Generative AI SDK

---

## 📋 Prerequisites

### Required Tools
```bash
# AWS CLI v2.31.1+
aws --version

# SAM CLI v1.144.0+
sam --version

# Docker v28.4.0+
docker --version

# Node.js v18+ (for local testing)
node --version

# Git (for version control)
git --version
```

### AWS Account Setup
```bash
# Configure AWS credentials
aws configure

# Verify credentials
aws sts get-caller-identity
```

### Environment Variables
Create `.env` file in project root:
```bash
# Google Generative AI (Gemini 2.5 Flash-Lite)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# AWS Region
AWS_REGION=us-east-1

# Application Configuration
NODE_ENV=production
```

---

## 🚀 Deployment Process

### Step 1: Environment Setup

#### 1.1 Clone Repository
```bash
git clone <repository-url>
cd sorot-ai
```

#### 1.2 Install Dependencies
```bash
# Frontend dependencies (if needed)
npm install

# Build frontend (if needed)
npm run build
```

#### 1.3 Set Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Edit .env with actual values
# GEMINI_API_KEY must be a valid Google AI Studio API key
```

### Step 2: IAM Setup

#### 2.1 Create IAM Policy and Role
```bash
# Navigate to scripts directory
cd aws/scripts

# Make script executable (Linux/Mac)
chmod +x setup-iam.sh

# Run IAM setup
./setup-iam.sh
```

**What this creates:**
- IAM Policy: `SorotAILambdaPolicy` with permissions for:
  - `bedrock:InvokeModel*` (DeepSeek-R1 access)
  - `polly:SynthesizeSpeech` (Audio generation)
  - `logs:*` (CloudWatch logging)
  - `ecr:GetDownloadUrlForLayer*` (Container registry access)
- IAM Role: `sorot-ai-lambda-role` with trust policy for Lambda

**Troubleshooting:**
- If policy already exists: Script handles update gracefully
- Permission denied: Ensure AWS credentials have IAM permissions
- Role propagation delay: Wait 10 seconds after creation

### Step 3: Build and Deploy

#### 3.1 Initial Build (Recommended)
```bash
# Build SAM application
cd aws
sam build

# Validate template
sam validate
```

#### 3.2 Deploy Infrastructure
```bash
# Deploy with SAM (first time - creates new stack)
sam deploy \
  --stack-name sorot-ai-stack \
  --template-file template.yaml \
  --parameter-overrides GeminiApiKey="$GEMINI_API_KEY" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --guided

# Subsequent deploys (update existing stack)
sam deploy \
  --stack-name sorot-ai-stack \
  --template-file template.yaml \
  --parameter-overrides GeminiApiKey="$GEMINI_API_KEY" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --no-confirm-changeset
```

**SAM Deploy Parameters:**
- `--stack-name`: CloudFormation stack identifier
- `--parameter-overrides`: Runtime configuration (API keys)
- `--capabilities`: Required for IAM role creation
- `--image-repository`: ECR repository URI (auto-resolved)
- `--no-confirm-changeset`: Skip manual approval for updates

### Step 4: Container Management

#### 4.1 Build Docker Image
```bash
# From project root
docker build -f aws/lambda/Dockerfile -t sorot-ai-lambda:latest .
```

#### 4.2 Test Image Locally
```bash
# Test container startup
docker run --rm sorot-ai-lambda:latest node -e "console.log('✅ Container test passed')"
```

#### 4.3 Push to ECR
```bash
# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag sorot-ai-lambda:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/sorot-ai-lambda:latest

# Push image
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/sorot-ai-lambda:latest
```

#### 4.4 Update Lambda Function
```bash
# Update function code with new image
aws lambda update-function-code \
  --function-name sorot-ai-analyzer \
  --image-uri <account-id>.dkr.ecr.us-east-1.amazonaws.com/sorot-ai-lambda:latest \
  --region us-east-1
```

---

## 🔧 Detailed Troubleshooting Guide

### Issue 1: ECR Repository Already Exists

**Error:**
```
Resource of type 'AWS::ECR::Repository' with identifier 'sorot-ai-lambda' already exists
```

**Root Cause:**
CloudFormation attempts to create ECR repository that already exists from previous deployment.

**Solution:**
1. Remove ECR repository resource from `aws/template.yaml`:
```yaml
# Remove this section:
# ECRRepository:
#   Type: AWS::ECR::Repository
#   Properties:
#     RepositoryName: sorot-ai-lambda
```

2. Also remove ECRRepositoryUri output from template.

3. Redeploy with `--image-repository` parameter pointing to existing repository.

**Prevention:**
- Always use existing ECR repository for container deployments
- Manage ECR repositories separately from CloudFormation stacks

### Issue 2: Lambda Handler Not Found

**Error:**
```
Runtime.ImportModuleError: Error: Cannot find module 'app'
```

**Root Cause:**
Docker container expects `app.js` in root directory, but TypeScript compilation outputs to `dist/` folder.

**Solution:**
1. Update `aws/lambda/Dockerfile`:
```dockerfile
# After TypeScript compilation
RUN cp -r dist/* ./
```

2. Ensure `CMD ["app.handler"]` points to correct handler.

**Prevention:**
- Verify file structure after TypeScript compilation
- Test Docker image locally before deployment
- Check Lambda function logs for import errors

### Issue 3: API Gateway HTTP API v2 Event Format

**Error:**
```
Incoming undefined request to /analyze
```

**Root Cause:**
API Gateway HTTP API v2 uses different event structure than REST API v1.

**HTTP API v2 Event Structure:**
```json
{
  "version": "2.0",
  "routeKey": "POST /analyze",
  "rawPath": "/analyze",
  "requestContext": {
    "http": {
      "method": "POST",
      "path": "/analyze"
    }
  }
}
```

**Solution:**
1. Update event parsing in handlers:
```typescript
// Use rawPath instead of path
const requestPath = (event as any).rawPath || event.path

// Use requestContext.http.method instead of httpMethod
const httpMethod = (event as any).requestContext?.http?.method || event.httpMethod
```

2. Apply to all handlers: `app.ts`, `analyze-film.ts`, `analysis-status.ts`

**Prevention:**
- Always check Lambda function logs for event structure
- Use API Gateway v2 specific event types
- Test with actual API Gateway events, not direct Lambda invocation

### Issue 4: Docker Image Build Fails

**Error:**
```
npm ERR! code ENOTFOUND
npm ERR! syscall getaddrinfo
npm ERR! errno ENOTFOUND
```

**Root Cause:**
Network connectivity issues during package installation.

**Solution:**
1. Check internet connectivity
2. Use `--legacy-peer-deps` flag:
```dockerfile
RUN npm ci --legacy-peer-deps --ignore-scripts && npm cache clean --force
```

3. Retry build with clean cache:
```bash
docker build --no-cache -f aws/lambda/Dockerfile -t sorot-ai-lambda:latest .
```

### Issue 5: Lambda Function Timeout

**Error:**
```
Task timed out after 60 seconds
```

**Root Cause:**
Film analysis process exceeds default timeout.

**Solution:**
1. Increase timeout in `aws/template.yaml`:
```yaml
Globals:
  Function:
    Timeout: 300  # 5 minutes
```

2. Optimize processing pipeline:
   - Use streaming for large files
   - Implement progress callbacks
   - Cache intermediate results

### Issue 6: CORS Issues

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
API Gateway HTTP API v2 CORS configuration in `aws/template.yaml`:
```yaml
HttpApi:
  Type: AWS::Serverless::HttpApi
  Properties:
    CorsConfiguration:
      AllowCredentials: false
      AllowHeaders:
        - "Content-Type"
        - "X-Amz-Date"
        - "Authorization"
        - "X-Api-Key"
        - "X-Amz-Security-Token"
      AllowMethods:
        - "POST"
        - "GET"
        - "OPTIONS"
      AllowOrigins:
        - "*"
```

### Issue 7: Python Dependencies in Lambda Container

**Error:**
```
ModuleNotFoundError: No module named 'yt_dlp'
```

**Solution:**
1. Install Python packages in Docker container:
```dockerfile
RUN pip3 install yt-dlp --target /var/task/py_deps
ENV PYTHONPATH=/var/task/py_deps:${PYTHONPATH}
```

2. Ensure Python3 and pip are available:
```dockerfile
RUN yum install -y python3-pip && yum clean all
```

### Issue 8: Environment Variables Not Available

**Error:**
```
GEMINI_API_KEY is undefined
```

**Solution:**
1. Set environment variables in Lambda configuration:
```yaml
Globals:
  Function:
    Environment:
      Variables:
        GEMINI_API_KEY: !Ref GeminiApiKey
        NODE_ENV: production
```

2. Pass via `--parameter-overrides` in SAM deploy:
```bash
sam deploy --parameter-overrides GeminiApiKey="$GEMINI_API_KEY"
```

---

## 📊 Resource Names and Specifications

### AWS Resources Created

#### CloudFormation Stack
- **Name**: `sorot-ai-stack`
- **Region**: `us-east-1`
- **Capabilities**: `CAPABILITY_IAM`, `CAPABILITY_NAMED_IAM`

#### Lambda Function
- **Name**: `sorot-ai-analyzer`
- **Runtime**: Container (Node.js 18)
- **Memory**: 512 MB
- **Timeout**: 60 seconds
- **Architecture**: x86_64
- **Handler**: `app.handler`
- **Environment Variables**:
  - `GEMINI_API_KEY`: Google AI API key
  - `NODE_ENV`: production

#### API Gateway HTTP API
- **Name**: `sorot-ai-stack`
- **Protocol**: HTTP/2
- **CORS**: Enabled for all origins
- **Routes**:
  - `POST /analyze`: Film analysis endpoint
  - `GET /status`: Progress checking endpoint
- **Stage**: `$default` (auto-deploy enabled)

#### ECR Repository
- **Name**: `sorot-ai-lambda`
- **URI**: `<account-id>.dkr.ecr.us-east-1.amazonaws.com/sorot-ai-lambda`
- **Image Scanning**: Enabled
- **Tags**: `latest`

#### IAM Role
- **Name**: `sorot-ai-lambda-role`
- **Trust Policy**: Allows Lambda service
- **Attached Policies**:
  - `AWSLambdaBasicExecutionRole`
  - `AmazonBedrockFullAccess`
  - `AmazonPollyFullAccess`
  - `AmazonEC2ContainerRegistryReadOnly`

### Network Configuration
- **Security Groups**: None (serverless)
- **VPC**: Default (no custom VPC required)
- **Subnets**: N/A

### Monitoring and Logging
- **CloudWatch Log Group**: `/aws/lambda/sorot-ai-analyzer`
- **Log Retention**: Default (never expire)
- **Metrics**: Standard Lambda metrics enabled
- **Tracing**: X-Ray disabled (PassThrough mode)

---

## 🧪 Testing and Validation

### API Testing

#### Test Analyze Endpoint
```bash
curl -X POST "https://<api-id>.execute-api.us-east-1.amazonaws.com/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "pdfData": "base64-encoded-pdf",
    "trailerUrl": "https://youtube.com/watch?v=example"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis-timestamp-random",
    "status": "processing",
    "message": "Analysis started successfully"
  }
}
```

#### Test Status Endpoint
```bash
curl "https://<api-id>.execute-api.us-east-1.amazonaws.com/status?id=<analysis-id>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "processing|completed|failed",
    "currentStep": 1,
    "totalSteps": 5,
    "stepName": "Current step name",
    "progress": 20
  }
}
```

### Health Checks

#### Lambda Function Health
```bash
aws lambda get-function --function-name sorot-ai-analyzer --region us-east-1
```

#### API Gateway Health
```bash
aws apigatewayv2 get-apis --region us-east-1
```

#### ECR Repository Health
```bash
aws ecr describe-repositories --repository-names sorot-ai-lambda --region us-east-1
```

---

## 💰 Cost Optimization

### Current Cost Structure
- **Lambda**: ~$0.15/month (512MB, 1000 invocations)
- **API Gateway**: ~$0.35/month (1M requests)
- **Bedrock**: ~$0.80/month (DeepSeek-R1 usage)
- **Polly**: ~$0.60/month (Audio synthesis)
- **ECR**: ~$0.10/month (storage)
- **Total**: ~$2.00/month (well under $5 budget)

### Optimization Strategies
1. **Lambda Memory**: 512MB optimal for container workloads
2. **Timeout**: 60 seconds sufficient for most analyses
3. **Caching**: Implement response caching for repeated requests
4. **Batch Processing**: Group similar analysis requests

---

## 🔄 Update and Maintenance

### Code Updates
```bash
# Build new image
docker build -f aws/lambda/Dockerfile -t sorot-ai-lambda:v2.0 .

# Tag and push
docker tag sorot-ai-lambda:v2.0 <account-id>.dkr.ecr.us-east-1.amazonaws.com/sorot-ai-lambda:v2.0
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/sorot-ai-lambda:v2.0

# Update Lambda
aws lambda update-function-code \
  --function-name sorot-ai-analyzer \
  --image-uri <account-id>.dkr.ecr.us-east-1.amazonaws.com/sorot-ai-lambda:v2.0
```

### Infrastructure Updates
```bash
# Update CloudFormation stack
sam deploy --stack-name sorot-ai-stack --template-file template.yaml
```

### Rollback Strategy
```bash
# Rollback Lambda to previous version
aws lambda update-function-code \
  --function-name sorot-ai-analyzer \
  --image-uri <account-id>.dkr.ecr.us-east-1.amazonaws.com/sorot-ai-lambda:latest

# Rollback CloudFormation
aws cloudformation rollback-stack --stack-name sorot-ai-stack
```

---

## 🎯 Success Metrics

### Deployment Validation Checklist
- [ ] AWS credentials configured
- [ ] IAM role and policies created
- [ ] ECR repository exists
- [ ] Docker image builds successfully
- [ ] SAM deployment completes without errors
- [ ] Lambda function active
- [ ] API Gateway endpoints accessible
- [ ] CORS headers working
- [ ] Analysis endpoint returns 200 OK
- [ ] Status endpoint returns progress

### Performance Benchmarks
- **Cold Start**: < 30 seconds (acceptable for film analysis)
- **API Latency**: < 5 seconds for endpoint response
- **Processing Time**: 30-60 seconds per analysis
- **Success Rate**: > 95% for valid inputs

---

## 📞 Support and Troubleshooting

### Common Issues Resolution
1. **Check CloudWatch logs**: `aws logs tail /aws/lambda/sorot-ai-analyzer`
2. **Validate API Gateway**: Test endpoints with curl/Postman
3. **Verify IAM permissions**: Check role policies
4. **Test locally**: Use SAM local invoke for debugging

### Monitoring Commands
```bash
# Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=sorot-ai-analyzer \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-12-31T23:59:59Z \
  --period 3600 \
  --statistics Average

# API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=sorot-ai-stack \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-12-31T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

This deployment guide covers all aspects of deploying Sorot.AI to AWS, including detailed troubleshooting for every issue encountered during the development and deployment process.
