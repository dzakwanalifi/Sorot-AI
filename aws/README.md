# Sorot.AI AWS Deployment Guide

This directory contains the AWS Lambda container deployment for Sorot.AI film analysis platform.

## Architecture

- **Frontend**: React + Vite (deployed on Netlify/Vercel)
- **Backend**: AWS Lambda Container with Node.js 18
- **AI Models**:
  - Primary: OpenAI gpt-oss-120b via AWS Bedrock
  - Fallback: Gemini 2.5 Flash-Lite via Google Generative AI
- **Services**: AWS Polly for audio generation, API Gateway for HTTP endpoints

## Directory Structure

```
aws/
├── lambda/
│   ├── app.ts                 # Lambda runtime API server
│   ├── Dockerfile            # Container build configuration
│   ├── handlers/             # Lambda handlers (analyze, status)
│   └── utils/                # Shared utilities (AI, audio, PDF)
├── scripts/
│   ├── build-and-deploy.sh   # Main deployment script
│   ├── setup-iam.sh         # IAM setup script
│   └── test-local.sh         # Local testing script
└── README.md                 # This file
```

## Quick Start

### 1. Prerequisites

- AWS CLI configured with appropriate permissions
- Docker installed
- Node.js 18+ for local development
- Google AI Studio API key
- AWS account with Bedrock and Polly access

### 2. Environment Setup

```bash
# Copy environment template
cp .env.aws .env.production

# Fill in your actual API keys and credentials
# GEMINI_API_KEY=your_key_here
# AWS_ACCESS_KEY_ID=your_key_here
# AWS_SECRET_ACCESS_KEY=your_secret_here
```

### 3. IAM Setup

```bash
# Setup IAM roles and policies
chmod +x aws/scripts/setup-iam.sh
./aws/scripts/setup-iam.sh
```

### 4. Deploy

```bash
# Build and deploy to AWS
chmod +x aws/scripts/build-and-deploy.sh
./aws/scripts/build-and-deploy.sh
```

## API Endpoints

After deployment, you'll get API Gateway endpoints:

- **POST** `/analyze` - Start film analysis
- **GET** `/status?id={analysisId}` - Check analysis progress

### Request Format

```json
// POST /analyze
{
  "pdfData": "base64-encoded-pdf-content",
  "trailerUrl": "https://youtube.com/watch?v=VIDEO_ID",
  "inputType": "file"
}
```

### Response Format

```json
{
  "success": true,
  "data": {
    "analysisId": "analysis-1234567890-abc123def",
    "status": "processing",
    "message": "Analysis started successfully"
  }
}
```

## Cost Estimation

- **AWS Bedrock**: ~$0.04-0.08 per 100 analyses
- **Google Gemini**: ~$0.03-0.06 transcription + $0.01-0.02 fallback
- **AWS Polly**: ~$0.08-0.16 per 100 briefings
- **AWS Lambda**: ~$0.20 per 1M requests (free tier covers most usage)
- **Total**: $0.16-0.32 per 100 analyses (within $5 budget)

## Local Development

### Testing Container Locally

```bash
# Set environment variables
export GEMINI_API_KEY=your_key
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret

# Run local test
chmod +x aws/scripts/test-local.sh
./aws/scripts/test-local.sh
```

### Testing API Endpoints

```bash
# Test status endpoint
curl "http://localhost:8080/status?id=test-id"

# Test analyze endpoint (with actual data)
curl -X POST "http://localhost:8080/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "pdfData": "base64-pdf-data",
    "trailerUrl": "https://youtube.com/watch?v=VIDEO_ID"
  }'
```

## Monitoring

### AWS Monitoring

- **CloudWatch Logs**: Lambda function logs
- **CloudWatch Metrics**: Invocation count, duration, errors
- **X-Ray**: Distributed tracing (optional)

### Cost Monitoring

Set up billing alerts in AWS Console:
- Monthly budget: $5
- Alert threshold: 80% ($4)

## Troubleshooting

### Common Issues

1. **Container build fails**
   - Check Docker installation
   - Verify internet connection for package downloads

2. **IAM permissions error**
   - Run `setup-iam.sh` first
   - Check AWS CLI configuration

3. **API Gateway not created**
   - Check AWS region consistency
   - Verify API Gateway service limits

4. **Lambda timeout**
   - Increase timeout in deployment script (max 15min)
   - Optimize video processing or split into steps

### Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/sorot-ai-analyzer --follow

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 3600 \
  --statistics Average \
  --dimensions Name=FunctionName,Value=sorot-ai-analyzer
```

## Security

- API keys stored in Lambda environment variables
- IAM least privilege principle
- CORS enabled for web app
- Input validation on all endpoints
- Rate limiting via API Gateway (optional)

## Performance Optimization

- Container image size: <500MB
- Cold start optimization: Provisioned concurrency (optional)
- Response caching: API Gateway caching
- Bundle splitting: Lazy loading in frontend

---

For more details, see the main project documentation in the root directory.
