# 🎬 Sorot.AI - AI Film Curation Platform

<div align="center">

![Sorot.AI Banner](https://img.shields.io/badge/Sorot.AI-Film%20Curation-FF6B35?style=for-the-badge&logo=movie&logoColor=white)
![AWS Hackathon](https://img.shields.io/badge/AWS%20Hackathon-2025-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![AWS Bedrock](https://img.shields.io/badge/AWS%20Bedrock-DeepSeek--R1-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)

**AI-powered film curation platform untuk pemilih festival film Indonesia**

[📋 Demo Live](https://github.com/dzakwanalifi/Sorot-AI) •
[📖 Dokumentasi](https://github.com/dzakwanalifi/Sorot-AI#readme) •
[🐛 Laporkan Bug](https://github.com/dzakwanalifi/Sorot-AI/issues)

</div>

---

## 🌟 Overview

Sorot.AI adalah platform kurasi film berbasis AI yang dirancang khusus untuk pemilih festival film Indonesia. Platform ini menganalisis trailer film dan sinopsis menggunakan **dual AI capabilities** untuk memberikan penilaian, ringkasan, dan audio briefing yang cerdas dalam proses kurasi film yang sophisticated.

### 🎯 **Fitur Utama**
- **🤖 Analisis AI Dual**: DeepSeek-R1 + Gemini 2.5 Flash-Lite
- **🎵 Audio Briefing**: Generated menggunakan AWS Polly
- **📊 Scoring Intelligence**: Penilaian otomatis berdasarkan multiple criteria
- **🔍 Semantic Search**: Pencarian film dengan natural language
- **📱 Progressive Web App**: Experience modern dan responsive

---

## 🎪 AWS Back-End Academy 2025 Hackathon

<div align="center">

### 🏆 **Use Case: Film, Animasi, Video, dan Musik**
**Aplikasi pencarian Film dengan tujuan untuk penggunaan kembali film untuk marketing campaign atau pembelajaran**

[![Kemenparekraf](https://img.shields.io/badge/Kemenparekraf-Film%20Sector-FF6B35?style=for-the-badge)](https://kemenparekraf.go.id/)
[![Ekonomi Kreatif](https://img.shields.io/badge/Ekonomi%20Kreatif-Indonesia-FF6B35?style=for-the-badge)](https://ekraf.go.id/)
[![AWS Hackathon](https://img.shields.io/badge/Hackathon-Submission%20Ready-FF9900?style=for-the-badge)](https://www.dicoding.com/challenges)

</div>

### 📋 **Project Brief**

**Judul Aplikasi**: Sorot.AI - AI Film Curation Platform

**Deskripsi Singkat Solusi**:
Sorot.AI adalah platform AI canggih yang membantu pemilih festival film Indonesia dalam mengkurasi film dengan efisien. Menggunakan semantic search dan analisis AI dual (DeepSeek-R1 + Gemini), platform ini menganalisis trailer dan sinopsis film untuk memberikan rekomendasi, penilaian, dan audio briefing yang mendalam.

**Use Case yang Diangkat**: Film (Kementerian Pariwisata dan Ekonomi Kreatif)

**Keterkaitan dengan Ekonomi Kreatif Indonesia**:
- **Film Sector**: Mendukung ekosistem film Indonesia melalui digitalisasi proses kurasi
- **AI untuk Creative Economy**: Mempercepat discovery film untuk marketing campaign dan pembelajaran
- **Semantic Search**: Memungkinkan pencarian film berdasarkan description/metadata yang kaya
- **GenAI Integration**: Pembuatan metadata otomatis untuk memperkaya katalog film
- **Asta Cita Presiden**: Sejalan dengan program ekonomi kreatif untuk meningkatkan PDB nasional

**Target Pengguna dan Konteks Penggunaan**:
- **Primary**: Pemilih festival film Indonesia (Jakarta International Film Festival, dll)
- **Secondary**: Marketing team untuk campaign film, educator untuk film studies
- **Context**: Proses kurasi film yang membutuhkan analisis cepat dan objektif

**Fitur Utama dan Alur Penggunaan**:
1. **Input**: Upload PDF sinopsis + paste trailer URL
2. **Processing**: AI menganalisis konten (transcription + visual analysis)
3. **Output**: Scoring, summary, audio briefing, dan rekomendasi

**Arsitektur Teknologi**:
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
- **Backend**: AWS Lambda Container (Node.js 18+)
- **AI Services**:
  - **Amazon Bedrock**: DeepSeek-R1 untuk analisis teks berbasis intelligence
  - **Google Gemini 2.5 Flash-Lite**: Transcription dan visual analysis fallback
  - **AWS Polly**: Audio briefing generation (Neural voice)
- **File Processing**: unpdf, yt-dlp-exec, ffmpeg-static

---

## 🛠 Tech Stack

<div align="center">

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend** | React 19 + Vite 5.x | TypeScript 5.0 |
| **Styling** | Tailwind CSS 3.4+ | shadcn/ui |
| **State Management** | Zustand 4.x | - |
| **Backend** | AWS Lambda Container | Node.js 18+ |
| **AI Models** | DeepSeek-R1 (Bedrock) | Gemini 2.5 Flash-Lite |
| **AWS Services** | Bedrock, Polly | S3, API Gateway |
| **File Processing** | unpdf, yt-dlp-exec | ffmpeg-static |

</div>

### 🤖 **AI Model Configuration**

| Model | Platform | Purpose | Cost/Input | Cost/Output | Avg Tokens/Analysis |
|-------|----------|---------|------------|-------------|-------------------|
| **DeepSeek-R1** | AWS Bedrock | Text Analysis | $0.00135/1K tokens | $0.0054/1K tokens | 500 input + 1K output |
| **Gemini 2.5 Flash-Lite** | Google AI | Visual Analysis | $0.10/1M tokens | $0.40/1M tokens | 200 tokens (fallback only) |

---

## 🚀 Getting Started

### Prerequisites

<div align="center">

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 18+ LTS | Runtime environment |
| **pnpm** | 9.x | Package manager |
| **Git** | Latest | Version control |
| **VS Code/Cursor** | Latest | IDE with extensions |

</div>

### Installation

```bash
# Clone repository
git clone https://github.com/dzakwanalifi/Sorot-AI.git
cd Sorot-AI

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Start development server
pnpm dev
```

### 📁 Project Structure

```
src/
├── features/              # Feature-based organization
│   ├── film-analysis/     # Film analysis feature
│   │   ├── components/    # Feature-specific components
│   │   ├── containers/    # Container components with logic
│   │   ├── services/      # API calls and business logic
│   │   ├── utils/         # Feature-specific utilities
│   │   └── index.ts       # Barrel exports
│   ├── file-upload/       # File upload feature
│   └── audio-player/      # Audio playback feature
├── shared/                # Shared across features
│   ├── components/        # Reusable UI components (shadcn/ui)
│   ├── services/          # Shared API clients
│   └── utils/             # General utilities
├── core/                  # Core business logic
│   └── domain/            # Domain models and logic
├── lib/                   # Third-party library facades
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
├── constants/             # App constants
└── styles/                # Global styles and Tailwind config

aws/
├── lambda/                # AWS Lambda container
│   ├── Dockerfile         # Container build configuration
│   ├── app.ts            # Main application entry point
│   ├── handlers/         # Lambda handlers
│   │   ├── analyze.ts    # Main analysis endpoint
│   │   └── status.ts     # Processing status checker
│   └── utils/            # Shared utilities
└── scripts/              # Deployment scripts
```

---

## ⚙️ Environment Setup

### 🔑 **Google AI Studio**
```bash
# 1. Create account at https://aistudio.google.com/
# 2. Generate API key for Gemini 2.5 Flash-Lite
# 3. Add to .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

### ☁️ **AWS Setup**
```bash
# 1. Create AWS account with billing alerts
# 2. Set budget ($50/month for development)
# 3. Create IAM user with policies:
#    - AmazonPollyFullAccess
#    - AmazonBedrockFullAccess

# 4. Add to environment variables
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

---

## 📊 **AWS Services Implementation**

### 🏗️ **Architecture Overview**
```mermaid
graph TD
    A[Frontend - React] --> B[API Gateway]
    B --> C[AWS Lambda Container]
    C --> D[Amazon Bedrock]
    C --> E[Google Gemini API]
    C --> F[Amazon Polly]
    D --> G[DeepSeek-R1 Analysis]
    E --> H[Gemini Transcription/Visual]
    F --> I[Audio Briefing Generation]
```

### 🔧 **Bukti Implementasi AWS Services**

#### **1. Amazon Bedrock Integration**
```typescript
// aws/lambda/utils/deepseekService.ts
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function analyzeWithDeepSeek(content: string) {
  const command = new InvokeModelCommand({
    modelId: "deepseek.r1-v1:0",
    body: JSON.stringify({
      prompt: `Analyze this film content: ${content}`,
      max_tokens: 1000,
    }),
  });

  const response = await bedrockClient.send(command);
  return JSON.parse(new TextDecoder().decode(response.body));
}
```

#### **2. AWS Polly Integration**
```typescript
// aws/lambda/utils/audioGenerator.ts
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function generateAudioBriefing(text: string) {
  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: "mp3",
    VoiceId: "Joanna",
    Engine: "neural",
  });

  const response = await pollyClient.send(command);
  return response.AudioStream;
}
```

---

## 💰 Cost Estimation (Monthly)

<div align="center">

| Service | Model | 50 Analyses | 100 Analyses | 250 Analyses | Purpose |
|---------|-------|--------------|--------------|--------------|---------|
| **AWS Bedrock** | DeepSeek-R1 | $0.68 | $1.35 | $3.38 | Primary text analysis (500 input + 1K output tokens) |
| **Google Gemini** | 2.5 Flash-Lite | $0.02 | $0.04 | $0.10 | Visual analysis fallback (~10% usage) |
| **AWS Polly** | Neural Voice | $0.16 | $0.31 | $0.78 | Audio briefing (200 chars/analysis) |
| **AWS Lambda** | Container | $0.02 | $0.03 | $0.08 | Compute (512MB RAM, 30s runtime) |
| **API Gateway** | REST API | <$0.01 | <$0.01 | <$0.01 | API calls + bandwidth |
| **TOTAL** | - | **$0.88** | **$1.73** | **$4.34** | Full operation |

</div>

*Estimasi konservatif berdasarkan kalkulasi token aktual (500 input + 1K output tokens per analisis)*

---

## 🔒 **Bukti Legalitas Dataset**

### ✅ **Dataset Usage Compliance**
- **No External Datasets**: Sorot.AI tidak menggunakan dataset eksternal apa pun
- **User-Generated Content**: Semua data berasal dari input pengguna (PDF sinopsis + YouTube URLs)
- **Open Source Tools**: Menggunakan libraries open source:
  - `unpdf` (MIT License) - PDF text extraction
  - `yt-dlp-exec` (MIT License) - YouTube video download
  - `ffmpeg-static` (GPL License) - Video processing
- **AWS/Google APIs**: Menggunakan official APIs dengan proper licensing
- **Self-Contained**: Tidak ada dependency pada dataset berhak cipta

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
# Build for production
pnpm build

# Deploy settings:
# Build command: pnpm build
# Publish directory: dist
# Node version: 18.x
```

### Backend (AWS Lambda Container)
```bash
# Build and deploy
cd aws/scripts
./build-and-deploy.sh
```

---

## 🧪 Development Scripts

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview build
pnpm lint         # ESLint check
pnpm test         # Run tests

# AWS Lambda local testing
cd aws/lambda
npm run test-local
```

---

## 🤝 Contributing

<div align="center">

### 📝 **Development Workflow**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### 🐛 **Bug Reports & Feature Requests**
- [🐛 Report Bug](https://github.com/dzakwanalifi/Sorot-AI/issues/new?template=bug_report.md)
- [✨ Request Feature](https://github.com/dzakwanalifi/Sorot-AI/issues/new?template=feature_request.md)

</div>

---

## 📄 License

<div align="center">

**This project is licensed under the MIT License**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

*Copyright © 2025 Sorot.AI. All rights reserved.*

</div>

---

<div align="center">

### 🌟 **Built with ❤️ for Indonesian Film Industry**

**Sorot.AI** - Empowering Film Curation with Artificial Intelligence

[![GitHub stars](https://img.shields.io/github/stars/dzakwanalifi/Sorot-AI?style=social)](https://github.com/dzakwanalifi/Sorot-AI/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/dzakwanalifi/Sorot-AI?style=social)](https://github.com/dzakwanalifi/Sorot-AI/network/members)

---

*Submitted for AWS Back-End Academy 2025 Hackathon - AI for Creative Economy*

</div>
