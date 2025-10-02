export interface FilmAnalysis {
  id: string
  synopsis: {
    title: string
    content: string
    fileName: string
    extractedAt: Date
  }
  trailerUrl: string
  trailer: {
    url: string
    videoId: string
    duration?: number
    validatedAt: Date
  }
  transcript?: string
  scores: {
    overall: number
    genre: number
    theme: number
    targetAudience: number
    technicalQuality: number
    emotionalImpact: number
  }
  insights: {
    genre: string[]
    themes: string[]
    targetAudience: string
    keyMoments: string[]
    strengths: string[]
    suggestions: string[]
  }
  audioBriefing?: {
    url: string
    duration: number
    generatedAt: Date
    voice: string
  }
  aiModel: 'openai' | 'gemini'
  processingStats: {
    transcriptionTime: number
    analysisTime: number
    audioGenerationTime: number
    totalTime: number
  }
  createdAt: Date
  completedAt: Date
}

export interface AnalysisState {
  currentAnalysis: FilmAnalysis | null
  analysisHistory: FilmAnalysis[]
  isAnalyzing: boolean
  error: string | null
  progress: {
    stage: string
    percentage: number
    currentStep?: number
    totalSteps?: number
  } | null
}

export interface AnalysisActions {
  setCurrentAnalysis: (analysis: FilmAnalysis | null) => void
  addToHistory: (analysis: FilmAnalysis) => void
  setAnalyzing: (analyzing: boolean) => void
  setError: (error: string | null) => void
  setProgress: (progress: AnalysisState['progress']) => void
  clearCurrentAnalysis: () => void
  reset: () => void
}

export type AnalysisStore = AnalysisState & AnalysisActions
