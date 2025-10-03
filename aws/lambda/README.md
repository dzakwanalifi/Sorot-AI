# Sorot.AI Backend - AWS Lambda Container

Film analysis backend powered by dual AI architecture using Gemini 2.5 Flash-Lite and DeepSeek-R1 via AWS Bedrock.

## Architecture

### Core Components

- **Runtime**: Node.js 18+ AWS Lambda Container
- **API Gateway**: RESTful endpoints for analysis requests
- **AI Models**:
  - Google Gemini 2.5 Flash-Lite (visual analysis, transcription)
  - DeepSeek-R1 via AWS Bedrock (content synthesis)
- **Audio Services**: AWS Polly (voice synthesis)
- **Storage**: In-memory progress tracking (container-based)

### Processing Pipeline

1. **PDF Extraction**: Text extraction using unpdf library
2. **Visual Analysis**: Mandatory Gemini analysis of trailer content
3. **Audio Processing**: Optional transcription enhancement
4. **AI Synthesis**: DeepSeek-R1 combines all data sources
5. **Audio Generation**: Polly creates briefing audio

## Prerequisites

- AWS CLI configured with appropriate permissions
- Docker for container builds
- Node.js 18+ (for local development)
- Google Gemini API key
- AWS credentials with Bedrock and Polly access

## Environment Variables

Required environment variables for Lambda function:

```bash
GEMINI_API_KEY=your_gemini_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
NODE_ENV=production
```

## API Endpoints

### POST /analyze

Initiates film analysis with PDF synopsis and YouTube trailer.

**Request Body:**

```json
{
  "pdfData": "base64_encoded_pdf_content",
  "trailerUrl": "https://youtube.com/watch?v=VIDEO_ID",
  "inputType": "file"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis-1234567890-abc123",
    "status": "processing",
    "message": "Analysis started successfully"
  }
}
```

**Error Responses:**
- `400`: Missing required fields or invalid YouTube URL
- `500`: Internal server error

### GET /status

Retrieves analysis progress and results.

**Query Parameters:**
- `id`: Analysis ID from /analyze response

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "currentStep": 5,
    "totalSteps": 5,
    "stepName": "Analysis Complete",
    "progress": 100,
    "result": {
      "id": "analysis-1234567890-abc123",
      "synopsis": { ... },
      "trailerUrl": "https://youtube.com/watch?v=VIDEO_ID",
      "scores": { ... },
      "insights": { ... },
      "audioBriefing": { ... },
      "aiModel": "deepseek"
    }
  }
}
```

**Status Values:**

- `processing`: Analysis in progress
- `completed`: Analysis finished successfully
- `failed`: Analysis failed with error

## Dependencies

### Runtime Dependencies

```json
{
  "@aws-sdk/client-bedrock-runtime": "^3.525.0",
  "@aws-sdk/client-polly": "^3.525.0",
  "@google/genai": "^0.3.0",
  "unpdf": "^1.3.2",
  "yt-dlp-exec": "^1.0.2",
  "dotenv": "^17.2.3"
}
```

### System Dependencies

- Python 3.x with pip
- FFmpeg for audio/video processing
- yt-dlp for YouTube downloads

## Local Development

### Build Process

1. **Install dependencies:**
```bash
npm install --legacy-peer-deps
```

2. **TypeScript compilation:**
```bash
npx tsc --project ../../tsconfig.aws.json
```

3. **Docker build:**
```bash
docker build -f Dockerfile -t sorot-ai-lambda .
```

### Local Testing

```bash
# Run container locally
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_key \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_key \
  -e AWS_REGION=us-east-1 \
  sorot-ai-lambda
```

### Test Scripts

- `aws/scripts/test-local.sh`: Local container testing
- `aws/scripts/build-and-deploy.sh`: Full deployment pipeline

## AWS Deployment

### IAM Setup

Execute setup script to create required IAM role:

```bash
chmod +x aws/scripts/setup-iam.sh
./aws/scripts/setup-iam.sh
```

Creates:
- IAM policy with Bedrock, Polly, and CloudWatch permissions
- Lambda execution role with trust policy

### Container Deployment

```bash
chmod +x aws/scripts/build-and-deploy.sh
./aws/scripts/build-and-deploy.sh
```

Process:
1. Builds Docker image with multi-stage optimization
2. Pushes to Amazon ECR
3. Creates/updates Lambda function
4. Sets up API Gateway with CORS
5. Configures Lambda permissions

### Lambda Configuration

- **Memory**: 2048 MB
- **Timeout**: 900 seconds (15 minutes)
- **Architecture**: x86_64
- **Package Type**: Image (container)

## AI Model Configuration

### DeepSeek-R1 (AWS Bedrock)

- **Model ID**: `us.deepseek.r1-v1:0`
- **Use Case**: Content synthesis and analysis
- **Max Tokens**: 128K context window
- **Pricing**: Input $0.00015/1K tokens, Output $0.0006/1K tokens

### Gemini 2.5 Flash-Lite

- **Use Case**: Visual analysis and transcription
- **Input Limits**: <20MB inline, >20MB via file upload
- **Pricing**: Input $0.10/1M tokens, Output $0.40/1M tokens
- **Fallback**: Used when transcription yields <50 words

### Decision Logic

1. **Always**: Run Gemini visual analysis
2. **Optional**: Audio transcription for enhancement
3. **Always**: DeepSeek-R1 for final synthesis
4. **Fallback**: Visual-only analysis if transcription fails

## Error Handling

### Validation Errors

- Missing environment variables
- Invalid YouTube URLs
- Malformed PDF data
- Missing required fields

### Service Errors

- AWS Bedrock API failures
- Gemini API rate limits
- Polly synthesis errors
- Network timeouts

### Recovery Mechanisms

- Graceful degradation to visual-only analysis
- Retry logic for transient failures
- Structured error responses with debug info
- Temporary file cleanup on failures

## Monitoring

### CloudWatch Logs

All requests logged with correlation IDs:

```
log
[INFO] req-1234567890-abc123 - Incoming POST request to /analyze
[INFO] req-1234567890-abc123 - Film analysis started with ID: analysis-0987654321-def456
```

### Performance Metrics

- Processing time tracking per analysis
- Step-by-step progress monitoring
- Token usage for AI models
- Memory and CPU utilization

### Cost Tracking

- Bedrock API calls and token consumption
- Polly character count for audio generation
- Gemini API usage for visual analysis

## Security

### Environment Variables

- All API keys stored as Lambda environment variables
- No secrets committed to version control
- IAM roles with least privilege access

### Input Validation

- YouTube URL format validation
- Base64 PDF content verification
- File size limits and content type checks

### CORS Configuration

- Configured for cross-origin requests from frontend
- Restricted to necessary headers and methods

## Troubleshooting

### Common Issues

**Environment Variable Errors:**

```
text
Error: Missing required environment variables: GEMINI_API_KEY
```

Solution: Ensure all required environment variables are set in Lambda configuration.

**YouTube URL Validation:**

```
text
Error: Invalid YouTube URL format
```

Solution: Verify URL follows `youtube.com/watch?v=VIDEO_ID` or `youtu.be/VIDEO_ID` format.

**Container Build Failures:**

```
bash
docker build errors
```

Solution: Ensure Docker daemon is running and has sufficient resources.

**API Gateway Timeouts:**

```
text
504 Gateway Timeout
```

Solution: Increase Lambda timeout or optimize processing pipeline.

### Debug Mode

Enable detailed logging by setting:
```bash
NODE_ENV=development
```

Provides additional error details in API responses.

### Health Checks

Container includes health check endpoint:
```bash
docker exec <container_id> node -e "console.log('Health check passed')"
```

## Performance Optimization

### Cost Management

- Visual analysis used as primary method (~5% of cases need fallback)
- Efficient token usage with context optimization
- Caching for repeated inputs (future enhancement)

### Resource Allocation

- 2048 MB memory for video processing workload
- 15-minute timeout for comprehensive analysis
- Container optimization with multi-stage builds

### Processing Efficiency

- Asynchronous processing with progress tracking
- Parallel execution where possible
- Automatic cleanup of temporary files
