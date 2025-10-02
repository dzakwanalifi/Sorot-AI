export interface FilmAnalysis {
  id: string
  title?: string
  synopsis: string
  trailerUrl: string
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
  audioBriefingUrl?: string
  processingTime: number
  aiModel: 'openai' | 'gemini'
  createdAt: Date
}

export interface AnalysisState {
  currentAnalysis: FilmAnalysis | null
  analysisHistory: FilmAnalysis[]
  isAnalyzing: boolean
  error: string | null
  progress: {
    stage: string
    percentage: number
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
