# Optimized Dockerfile for Sorot.AI AWS Lambda Container
# Using official AWS Lambda Node.js base image with RIC

FROM public.ecr.aws/lambda/nodejs:18

# Install Python3 and pip for yt-dlp
RUN yum install -y python3-pip && yum clean all

# Install yt-dlp for Python, placed in /var/task/py_deps
RUN pip3 install yt-dlp --target /var/task/py_deps

# Set PYTHONPATH for Python imports
ENV PYTHONPATH=/var/task/py_deps:${PYTHONPATH}

# Copy package files and install Node.js dependencies
COPY aws/lambda/package.json aws/lambda/package-lock.json* ./
RUN npm ci --legacy-peer-deps --ignore-scripts && npm cache clean --force

# Copy TypeScript config and compile
COPY tsconfig.aws.json ./
COPY aws/lambda/ ./src/
RUN npx tsc --project tsconfig.aws.json

# Copy compiled JavaScript files to root
RUN cp -r dist/* ./

# Environment variables (will be overridden by Lambda)
ENV NODE_ENV=production
ENV AWS_REGION=us-east-1

# Lambda handler - matches the exported function in app.js
CMD ["app.handler"]
