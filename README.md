# Sorot.AI 🎬

AI-powered film curation platform for Indonesian film festival selectors.

## Overview

Sorot.AI analyzes movie trailers and synopses using dual AI capabilities:
- **OpenAI gpt-oss-120b** via AWS Bedrock for intelligent text-based analysis
- **Gemini 2.5 Flash-Lite** via Google Vertex AI for visual analysis of silent/music-only trailers

This hybrid approach ensures comprehensive film analysis regardless of trailer content.

## Tech Stack

- **Frontend**: React 19.x + Vite 5.x + TypeScript + Tailwind CSS 3.4+
- **Backend**: AWS Lambda Container (Node.js 18+)
- **AI Models**:
  - OpenAI gpt-oss-120b (AWS Bedrock) - Primary analysis
  - Gemini 2.5 Flash-Lite (Google Generative AI) - Visual fallback
- **AWS Services**: Transcribe, Bedrock, Polly
- **State Management**: Zustand 4.x

## Getting Started

### Prerequisites

- Node.js 18+ LTS
- npm 9.x or pnpm
- Git
- VS Code/Cursor IDE with TypeScript, Prettier, ESLint extensions

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sorot-ai
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Start development server:
```bash
pnpm dev
```

## Project Structure

```
src/
├── features/          # Feature-based modules
├── shared/           # Shared components & utilities
├── core/            # Business logic & domain models
├── lib/             # Third-party library facades
├── hooks/           # Custom React hooks
├── types/           # TypeScript definitions
├── constants/       # App constants
└── styles/          # Global styles

aws/
├── lambda/          # AWS Lambda container
│   ├── handlers/    # Lambda handlers
│   ├── utils/       # Backend utilities
│   └── types/       # Type definitions
```

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests

## Environment Setup

### Google AI Studio
1. Create account at [Google AI Studio](https://aistudio.google.com/)
2. Generate API key for Gemini 2.5 Flash-Lite
3. Add to `.env.local`: `GEMINI_API_KEY=your_key_here`

### AWS Setup
1. Create AWS account with billing alerts
2. Set budget ($50/month for development)
3. Create IAM user with these policies:
   - `AmazonTranscribeFullAccess`
   - `AmazonPollyFullAccess`
   - `AmazonBedrockFullAccess`
4. Generate access keys
5. Add to environment variables:
   ```
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   ```

## Deployment

### Frontend
Deploy to AWS Lambda with these build settings:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18.x

### Backend (AWS Lambda)
- **Container**: Docker image
- **Runtime**: Node.js 18+
- **Build**: `./aws/scripts/build-and-deploy.sh`

## Cost Estimation (Monthly)

- AWS Bedrock (OpenAI gpt-oss-120b): $15-30
- Google Gemini 2.5 Flash-Lite: $5-10
- AWS Transcribe: $24
- AWS Polly: $16
- **Total**: $60-80

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.
