# Sorot.AI Development Checklist

## 🎯 Project Overview
- [ ] Sorot.AI sebagai platform kurasi film berbasis AI untuk selector festival film Indonesia
- [ ] Dual AI capabilities: OpenAI gpt-oss-120b (AWS Bedrock) + Gemini 2.5 Flash-Lite (Google Vertex AI)
- [ ] Hybrid approach: text analysis utama + visual analysis fallback

---

## 🔧 Environment Setup

### 1.1 Development Tools
- [x] Node.js 18+ LTS terinstall
- [x] npm 9.x terinstall dan berfungsi
- [x] pnpm terinstall secara global
- [x] Git terinstall dan dikonfigurasi
- [x] VS Code/Cursor IDE terinstall
- [x] Extensions TypeScript, Prettier, ESLint terinstall

### 1.2 Google AI Studio Setup
- [ ] Akun Google AI Studio aktif
- [x] API key Gemini berhasil dibuat
- [ ] API key diuji dengan test request
- [x] API key disimpan aman (tidak di-commit)

### 1.3 AWS Setup
- [ ] Akun AWS aktif dengan billing alerts
- [ ] Budget $50/month diset untuk development
- [ ] IAM user dengan programmatic access dibuat
- [ ] Policies: AmazonTranscribeFullAccess, AmazonPollyFullAccess, AmazonBedrockFullAccess
- [ ] Access Key ID dan Secret Access Key disimpan aman

### 1.4 Netlify Setup
- [ ] Akun Netlify aktif
- [ ] GitHub account terhubung
- [ ] Personal access token dibuat (jika perlu)

---

## 📦 Project Structure

### 2.1 Frontend (React + Vite)
- [x] Project diinisialisasi dengan Vite + React + TypeScript
- [x] Dependencies terinstall:
  - [x] @types/node, tailwindcss, postcss, autoprefixer
  - [x] zustand, react-dropzone, lucide-react, clsx, tailwind-merge
  - [x] @vitejs/plugin-react-swc, eslint, @typescript-eslint/*
  - [x] @google/genai, @aws-sdk/*, unpdf, yt-dlp-exec
- [x] Tailwind CSS dikonfigurasi
- [x] TypeScript path mapping dikonfigurasi
- [x] Zustand store untuk analysis state dibuat

### 2.2 Backend (Netlify Functions)
- [x] netlify/functions/ directory dibuat
- [x] netlify/utils/ directory dibuat
- [x] netlify.toml dikonfigurasi
- [x] Dependencies terinstall:
  - [x] @aws-sdk/client-bedrock-runtime, @aws-sdk/client-transcribe, @aws-sdk/client-polly
  - [x] @google/genai, unpdf, yt-dlp-exec, @types/node

### 2.3 Environment Variables
- [x] .env.local untuk frontend dibuat
- [x] .env untuk backend functions dibuat
- [x] Variables:
  - [x] GEMINI_API_KEY
  - [x] AWS_ACCESS_KEY_ID
  - [x] AWS_SECRET_ACCESS_KEY
  - [x] AWS_REGION=us-east-1
- [x] USE_REAL_APIS flag untuk cost control

---

## 🎨 Frontend Development

### 3.1 Project Structure Setup
- [ ] src/features/ directory structure dibuat
- [ ] src/shared/ directory structure dibuat
- [ ] src/core/ directory structure dibuat
- [ ] src/lib/, src/hooks/, src/types/, src/constants/, src/styles/ dibuat
- [ ] Barrel exports (index.ts) dibuat untuk setiap feature

### 3.2 Core Components
- [x] Button component (shadcn/ui style) dibuat
- [x] FileUploadArea component dengan drag-drop + paste text dibuat
- [x] TrailerUrlInput component dengan validation dibuat
- [x] AnalysisProgress component dengan animated states dibuat
- [x] AnalysisResults component dengan collapsible sections dibuat
- [x] Textarea component untuk text input dibuat

### 3.3 State Management
- [x] Zustand store untuk analysis state dikonfigurasi
- [x] Store methods: setCurrentAnalysis, addToHistory, setAnalyzing, setError
- [x] State structure: currentAnalysis, analysisHistory, isAnalyzing, error

### 3.4 Feature Integration
- [x] FilmAnalysisContainer dengan step-by-step flow dibuat
- [x] Component integration dengan Zustand store
- [x] Mock analysis pipeline untuk demo
- [x] Progress tracking dan error handling

---

## 🔧 Backend Development (Netlify Functions)

### 4.1 Core Functions
- [x] analyze-film.ts main function dibuat
- [x] CORS headers dan error handling diimplementasi
- [x] Input validation untuk pdfData dan trailerUrl

### 4.2 PDF Processing
- [x] netlify/utils/pdfProcessor.ts dibuat
- [x] extractTextFromPDF function menggunakan unpdf
- [x] Error handling untuk invalid PDF files

### 4.3 Video/Audio Processing
- [x] netlify/utils/videoDownloader.ts dibuat
- [x] downloadAudioFromYouTube function menggunakan yt-dlp-exec
- [x] cleanupTempFile utility dibuat

### 4.4 AWS Transcribe Integration
- [x] netlify/utils/transcribeService.ts dibuat
- [x] transcribeAudio function dengan job polling
- [x] Error handling dan timeout management
- [x] Custom vocabulary untuk film terms (optional)

### 4.5 AI Analysis Integration
- [x] netlify/utils/aiAnalyzer.ts dibuat
- [x] analyzeWithOpenAI function untuk Bedrock integration
- [x] analyzeWithGemini function untuk visual analysis
- [x] Decision logic: transcript <50 words → Gemini fallback

### 4.6 Audio Generation
- [x] netlify/utils/audioGenerator.ts dibuat
- [x] generateAudioBriefing function menggunakan Polly
- [x] SSML support untuk enhanced speech (optional)

---

## 🔄 Integration & Data Flow

### 5.1 Sequential Processing Pipeline
- [ ] PDF extraction → Audio download → Transcribe → AI Analysis → Audio Generation
- [ ] Proper error handling di setiap step
- [ ] Progress tracking dan status updates

### 5.2 AI Model Decision Logic
- [ ] Check transcript length (<50 words?)
- [ ] Route to OpenAI (primary) atau Gemini (fallback)
- [ ] Cost optimization: minimize Gemini usage

### 5.3 Response Format
- [ ] Structured JSON dengan semua analysis results
- [ ] Audio briefing URL included
- [ ] Processing stats dan metadata

---

## 🧪 Testing Setup

### 6.1 Unit Testing
- [ ] Vitest dikonfigurasi
- [ ] Testing utilities: @testing-library/react, jsdom
- [ ] Component tests untuk FileUploadArea, AnalysisProgress, etc.
- [ ] Utility function tests

### 6.2 Integration Testing
- [ ] Netlify Functions testing dengan mocked AWS services
- [ ] API endpoint testing
- [ ] Error scenario testing

### 6.3 E2E Testing
- [ ] Playwright dikonfigurasi
- [ ] Critical user flows: upload → process → results
- [ ] File upload dan URL input testing
- [ ] Analysis result display testing

---

## 🚀 Deployment & Production

### 7.1 Netlify Configuration
- [ ] netlify.toml dengan build settings
- [ ] Function bundling dengan esbuild
- [ ] Environment variables di dashboard
- [ ] Build commands dan publish directory

### 7.2 Environment Variables Production
- [ ] AWS credentials di Netlify dashboard
- [ ] GEMINI_API_KEY securely stored
- [ ] NODE_ENV=production
- [ ] Monitoring dan logging variables

### 7.3 Build Optimization
- [ ] Bundle size monitoring (<500KB)
- [ ] Code splitting dengan React.lazy()
- [ ] Image optimization dan WebP/AVIF
- [ ] Service worker caching

---

## 🔒 Security & Best Practices

### 8.1 Security Checklist
- [ ] Input validation dengan Zod/Yup
- [ ] File upload security (type, size, content validation)
- [ ] HTTPS only communications
- [ ] CORS properly configured
- [ ] Environment variables untuk semua secrets
- [ ] Rate limiting implemented

### 8.2 AWS Security
- [ ] IAM least privilege principle
- [ ] API key rotation policy
- [ ] Cost monitoring dan budgets
- [ ] Resource cleanup (temp files, jobs)

### 8.3 Error Handling
- [ ] Frontend error boundaries
- [ ] Backend structured error responses
- [ ] User-friendly error messages
- [ ] Graceful degradation

---

## 📊 Monitoring & Analytics

### 9.1 Performance Monitoring
- [ ] API response time tracking
- [ ] Bundle size monitoring
- [ ] Core Web Vitals measurement
- [ ] Memory usage optimization

### 9.2 Cost Monitoring
- [ ] AWS service usage tracking
- [ ] Gemini API usage monitoring
- [ ] Monthly cost alerts
- [ ] Token usage optimization

### 9.3 Error Tracking
- [ ] Sentry integration (optional)
- [ ] Client-side error tracking
- [ ] Server-side error logging
- [ ] User experience monitoring

---

## 📚 Documentation

### 10.1 Code Documentation
- [ ] JSDoc comments untuk complex functions
- [ ] Component props documentation
- [ ] Inline comments untuk business logic
- [ ] README dengan setup instructions

### 10.2 API Documentation
- [ ] Netlify Function endpoints documented
- [ ] Request/response formats specified
- [ ] Error response examples
- [ ] Authentication requirements (jika ada)

---

## 🎯 Final Production Checklist

### 11.1 Pre-Launch Verification
- [ ] All unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Manual testing completed
- [ ] Cross-browser testing done

### 11.2 Performance Checklist
- [ ] Initial bundle <500KB
- [ ] Lighthouse score >90
- [ ] API response <3 seconds
- [ ] Mobile responsive design

### 11.3 Security Checklist
- [ ] Security audit completed
- [ ] Penetration testing done
- [ ] GDPR compliance verified
- [ ] Privacy policy published

### 11.4 Monitoring Checklist
- [ ] Error tracking active
- [ ] Performance monitoring enabled
- [ ] Analytics configured
- [ ] Backup strategy in place

---

## 📋 Maintenance Tasks

### 12.1 Regular Tasks
- [ ] Weekly: AWS costs monitoring
- [ ] Daily: Error logs review
- [ ] Monthly: Dependencies update
- [ ] Quarterly: Performance optimization

### 12.2 Scaling Considerations
- [ ] Request queuing untuk high traffic
- [ ] Database untuk persistent storage
- [ ] CDN untuk static assets
- [ ] Load balancer jika perlu

---

## 💰 Cost Estimation (Monthly)
- [ ] AWS Bedrock (OpenAI gpt-oss-120b): $0.04-0.08 (for 100-200 analyses)
- [ ] Google Gemini 2.5 Flash-Lite (transcription): $0.03-0.06 (for 100 transcriptions)
- [ ] Google Gemini 2.5 Flash-Lite (visual analysis): $0.01-0.02 (fallback only)
- [ ] AWS Polly (Neural): $0.08-0.16 (for 100 briefings)
- [ ] **Total**: $0.16-0.32 (within $5 budget for 100 analyses)

---

*Checklist ini dibuat berdasarkan Sorot.AI Development Rules untuk memastikan semua aspek development tercover secara sistematis.*
