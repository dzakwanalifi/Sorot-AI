import { AnalysisScores } from '../../../core/domain'

/**
 * Calculate weighted overall score
 */
export function calculateOverallScore(scores: AnalysisScores): number {
  const weights = {
    genre: 0.2,
    theme: 0.25,
    targetAudience: 0.15,
    technicalQuality: 0.2,
    emotionalImpact: 0.2
  }

  return Math.round(
    scores.genre * weights.genre +
    scores.theme * weights.theme +
    scores.targetAudience * weights.targetAudience +
    scores.technicalQuality * weights.technicalQuality +
    scores.emotionalImpact * weights.emotionalImpact
  )
}

/**
 * Get score category and color
 */
export function getScoreCategory(score: number): {
  category: 'excellent' | 'good' | 'average' | 'poor' | 'very-poor'
  color: string
  label: string
} {
  if (score >= 90) {
    return { category: 'excellent', color: 'text-green-600', label: 'Excellent' }
  } else if (score >= 80) {
    return { category: 'good', color: 'text-green-500', label: 'Good' }
  } else if (score >= 70) {
    return { category: 'average', color: 'text-yellow-500', label: 'Average' }
  } else if (score >= 60) {
    return { category: 'poor', color: 'text-orange-500', label: 'Poor' }
  } else {
    return { category: 'very-poor', color: 'text-red-500', label: 'Very Poor' }
  }
}

/**
 * Format analysis insights for display
 */
export function formatInsights(insights: any): {
  genres: string[]
  themes: string[]
  targetAudience: string
  keyMoments: string[]
  strengths: string[]
  suggestions: string[]
} {
  return {
    genres: Array.isArray(insights.genre) ? insights.genre : [],
    themes: Array.isArray(insights.themes) ? insights.themes : [],
    targetAudience: insights.targetAudience || '',
    keyMoments: Array.isArray(insights.keyMoments) ? insights.keyMoments : [],
    strengths: Array.isArray(insights.strengths) ? insights.strengths : [],
    suggestions: Array.isArray(insights.suggestions) ? insights.suggestions : []
  }
}

/**
 * Generate analysis summary
 */
export function generateAnalysisSummary(scores: AnalysisScores, aiModel: string): string {
  const overall = calculateOverallScore(scores)
  const category = getScoreCategory(overall)

  return `This film receives an overall score of ${overall}/100 (${category.label.toLowerCase()}), analyzed using ${aiModel === 'openai' ? 'OpenAI GPT' : 'Google Gemini'} technology.`
}

/**
 * Check if analysis meets festival standards
 */
export function meetsFestivalStandards(scores: AnalysisScores): {
  qualifies: boolean
  reason: string
} {
  const overall = calculateOverallScore(scores)

  if (overall >= 80) {
    return {
      qualifies: true,
      reason: 'Excellent scores across all criteria'
    }
  } else if (overall >= 70) {
    return {
      qualifies: true,
      reason: 'Good potential with room for improvement'
    }
  } else if (overall >= 60) {
    return {
      qualifies: false,
      reason: 'Below festival selection standards'
    }
  } else {
    return {
      qualifies: false,
      reason: 'Significant improvements needed'
    }
  }
}

/**
 * Calculate processing time breakdown
 */
export function formatProcessingTime(stats: any): {
  transcription: string
  analysis: string
  audio: string
  total: string
} {
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    const seconds = Math.round(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return {
    transcription: formatTime(stats.transcriptionTime || 0),
    analysis: formatTime(stats.analysisTime || 0),
    audio: formatTime(stats.audioGenerationTime || 0),
    total: formatTime(stats.totalTime || 0)
  }
}
