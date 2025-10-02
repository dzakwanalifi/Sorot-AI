import { analyzeWithOpenAI } from './openaiService.js'
import { analyzeWithGemini } from './geminiService.js'
import type { FilmAnalysis } from '../types/analysis.js'

export interface AIAnalysisResult {
  scores: FilmAnalysis['scores']
  insights: FilmAnalysis['insights']
  aiModel: 'openai' | 'gemini'
}

export async function analyzeFilmContent(
  synopsis: string,
  transcript: string,
  trailerUrl: string
): Promise<AIAnalysisResult> {
  // Decision logic: Use Gemini for visual analysis if transcript is too short
  const transcriptLength = transcript.trim().length
  const shouldUseGemini = transcriptLength < 50

  console.log(`Transcript length: ${transcriptLength} characters`)
  console.log(`Using ${shouldUseGemini ? 'Gemini' : 'OpenAI'} for analysis`)

  if (shouldUseGemini) {
    console.log('Routing to Gemini for visual analysis (insufficient transcript)')
    return await analyzeWithGemini(synopsis, transcript, trailerUrl)
  } else {
    console.log('Routing to OpenAI for comprehensive text analysis')
    return await analyzeWithOpenAI(synopsis, transcript)
  }
}
