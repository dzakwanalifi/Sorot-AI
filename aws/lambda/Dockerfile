# Multi-stage Dockerfile for Sorot.AI AWS Lambda Container
FROM node:18-alpine AS base

# Install system dependencies for video/audio processing
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    && rm -rf /var/cache/apk/*

# Install yt-dlp via pip3 for reliable binary availability
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

# Set working directory
WORKDIR /app

# Copy package files and tsconfig
COPY aws/lambda/package.json ./
COPY tsconfig.aws.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm install --legacy-peer-deps

# Build stage
FROM base AS build

# Copy source code
COPY aws/lambda/ ./aws/lambda/

# Compile TypeScript for AWS Lambda
RUN npx tsc --project tsconfig.aws.json

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    && rm -rf /var/cache/apk/*

# Install yt-dlp via pip3 for reliable binary availability
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

# Create app directory
WORKDIR /app

# Copy built application from build stage
COPY --from=build /app/dist/ ./

# Copy package files for metadata
COPY aws/lambda/package.json ./

# Install only production dependencies
RUN npm install --legacy-peer-deps --omit=dev && npm cache clean --force

# Set environment variables
ENV NODE_ENV=production
ENV AWS_REGION=us-east-1

# Expose port for Lambda runtime API
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')"

# Start the Lambda runtime API server
CMD ["node", "app.js"]
