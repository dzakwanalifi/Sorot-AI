// Domain Models for Film Analysis

export interface FilmSynopsis {
  title: string
  content: string
  fileName: string
  extractedAt: Date
}

export interface TrailerInfo {
  url: string
  videoId: string
  duration?: number
  validatedAt: Date
}

export interface AnalysisScores {
  overall: number
  genre: number
  theme: number
  targetAudience: number
  technicalQuality: number
  emotionalImpact: number
}

export interface AnalysisInsights {
  genre: string[]
  themes: string[]
  targetAudience: string
  keyMoments: string[]
  strengths: string[]
  suggestions: string[]
}

export interface AudioBriefing {
  url: string
  duration: number
  generatedAt: Date
  voice: string
}

export interface FilmAnalysis {
  id: string
  synopsis: FilmSynopsis
  trailer: TrailerInfo
  scores: AnalysisScores
  insights: AnalysisInsights
  audioBriefing?: AudioBriefing
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

// Value Objects
export class AnalysisStatus {
  static readonly PENDING = 'pending'
  static readonly PROCESSING = 'processing'
  static readonly COMPLETED = 'completed'
  static readonly FAILED = 'failed'

  private constructor() {}
}

export class FilmGenre {
  static readonly DRAMA = 'Drama'
  static readonly COMEDY = 'Comedy'
  static readonly ACTION = 'Action'
  static readonly HORROR = 'Horror'
  static readonly DOCUMENTARY = 'Documentary'
  static readonly ANIMATION = 'Animation'
  static readonly THRILLER = 'Thriller'
  static readonly ROMANCE = 'Romance'
  static readonly SCIFI = 'Science Fiction'
  static readonly FANTASY = 'Fantasy'

  private constructor() {}
}

// Factory functions
export const createFilmAnalysis = (
  synopsis: FilmSynopsis,
  trailer: TrailerInfo,
  scores: AnalysisScores,
  insights: AnalysisInsights,
  aiModel: 'openai' | 'gemini'
): FilmAnalysis => {
  const now = new Date()
  const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return {
    id,
    synopsis,
    trailer,
    scores,
    insights,
    aiModel,
    processingStats: {
      transcriptionTime: 0,
      analysisTime: 0,
      audioGenerationTime: 0,
      totalTime: 0,
    },
    createdAt: now,
    completedAt: now,
  }
}

export const createFilmSynopsis = (
  title: string,
  content: string,
  fileName: string
): FilmSynopsis => ({
  title,
  content,
  fileName,
  extractedAt: new Date(),
})

export const createTrailerInfo = (url: string, videoId: string): TrailerInfo => ({
  url,
  videoId,
  validatedAt: new Date(),
})
