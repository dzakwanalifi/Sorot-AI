import { analyzeWithDeepSeek } from './openaiService.js'
import { analyzeWithGeminiVisual } from './geminiService.js'
import type { FilmAnalysis } from '../types/analysis.js'

export interface AIAnalysisResult {
  scores: FilmAnalysis['scores']
  insights: FilmAnalysis['insights']
  aiModel: 'deepseek' | 'gemini'
}

export interface VisualAnalysisResult {
  visualAnalysis: string
  timestamps: Array<{time: string, description: string}>
  emotionalTone: string
  visualStyle: string
}

export async function analyzeFilmVisually(trailerUrl: string): Promise<VisualAnalysisResult> {
  console.log('Starting Gemini visual analysis for trailer:', trailerUrl)
  return await analyzeWithGeminiVisual(trailerUrl)
}

export async function analyzeFilmContent(
  synopsis: string,
  visualAnalysis: VisualAnalysisResult,
  transcript: string | null
): Promise<AIAnalysisResult> {
  console.log('Starting AI synthesis with combined visual and audio data')
  console.log(`Visual analysis length: ${visualAnalysis.visualAnalysis.length} characters`)
  console.log(`Transcript available: ${transcript ? transcript.length + ' characters' : 'No transcript'}`)

  // Always use DeepSeek-R1 for final synthesis combining visual analysis + transcript
  console.log('Routing to DeepSeek-R1 for comprehensive synthesis analysis')
  return await analyzeWithDeepSeek(synopsis, visualAnalysis, transcript || 'No transcript available')
}
