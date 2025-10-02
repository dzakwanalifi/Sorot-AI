import { extractTextFromPDF } from './pdfProcessor'
import { downloadVideoAudio } from './videoDownloader'
import { transcribeAudio } from './transcribeService'
import { analyzeFilmContent } from './aiAnalyzer'
import { generateAudioBriefing } from './audioGenerator'
import type { FilmAnalysis } from '../../src/types/analysis'

export async function processFilmAnalysis(
  pdfData: string,
  trailerUrl: string,
  inputType: 'file' | 'text' = 'file',
  onProgress?: (step: number, stepName: string, progress: number) => void
): Promise<FilmAnalysis> {
  const startTime = Date.now()
  let transcript: string | null = null

  // Validate environment variables are present
  const USE_REAL_APIS = process.env.USE_REAL_APIS === 'true'
  if (USE_REAL_APIS && (!process.env.GEMINI_API_KEY || !process.env.AWS_ACCESS_KEY_ID)) {
    throw new Error('Required API keys are missing. Please check GEMINI_API_KEY and AWS_ACCESS_KEY_ID environment variables')
  }

  try {
    // Step 1: Extract text from PDF or text input
    onProgress?.(1, 'Processing PDF', 20)
    console.log(`Step 1: Extracting text from ${inputType === 'text' ? 'text input' : 'PDF'}...`)
    const synopsis = await extractTextFromPDF(pdfData, inputType)
    console.log(`Extracted ${synopsis.length} characters from ${inputType === 'text' ? 'text input' : 'PDF'}`)
    onProgress?.(1, 'Extracting Synopsis', 40)

    // Step 2: Download video audio (required for real API mode)
    onProgress?.(2, 'Downloading Trailer', 50)
    console.log('Step 2: Downloading video audio...')
    const audioPath = await downloadVideoAudio(trailerUrl)
    console.log('Audio downloaded successfully')
    onProgress?.(2, 'Downloading Trailer', 70)

    // Step 3: Attempt transcription (will fail since S3 is removed)
    onProgress?.(3, 'Transcribing Audio', 75)
    console.log('Step 3: Attempting audio transcription...')
    try {
      transcript = await transcribeAudio(audioPath)
      console.log(`Transcription completed: ${transcript.length} characters`)
      onProgress?.(3, 'Transcribing Audio', 85)
    } catch (transcribeError) {
      const errorMessage = transcribeError instanceof Error ? transcribeError.message : 'Unknown transcription error'
      console.warn('Transcription failed (S3 removed):', errorMessage)
      console.log('Using fallback transcript for visual analysis only')
      transcript = 'Audio transcription unavailable (S3 removed). Using visual analysis only.'
      onProgress?.(3, 'Transcribing Audio', 85)
    }

    // Step 4: AI Analysis
    onProgress?.(4, 'AI Analysis', 90)
    console.log('Step 4: Running AI analysis...')
    const analysisResult = await analyzeFilmContent(synopsis, transcript, trailerUrl)
    onProgress?.(4, 'AI Analysis', 95)

    // Step 5: Generate audio briefing (will fail since S3 is removed)
    onProgress?.(5, 'Generating Audio Brief', 98)
    console.log('Step 5: Generating audio briefing...')
    let audioUrl: string
    try {
      audioUrl = await generateAudioBriefing(analysisResult)
      onProgress?.(5, 'Analysis Complete', 100)
    } catch (audioError) {
      const errorMessage = audioError instanceof Error ? audioError.message : 'Unknown audio generation error'
      console.warn('Audio briefing generation failed (S3 removed):', errorMessage)
      audioUrl = 'Audio briefing unavailable (S3 removed for temporary data)'
      onProgress?.(5, 'Analysis Complete', 100)
    }

    const processingTime = Date.now() - startTime

    // Compile final result
    console.log('Analysis result structure:', {
      hasScores: !!analysisResult.scores,
      hasInsights: !!analysisResult.insights,
      scoresKeys: analysisResult.scores ? Object.keys(analysisResult.scores) : 'no scores',
      aiModel: analysisResult.aiModel
    })

    const result: FilmAnalysis = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      synopsis: {
        title: 'Film Analysis',
        content: synopsis,
        fileName: 'input.pdf',
        extractedAt: new Date()
      },
      trailerUrl,
      trailer: {
        url: trailerUrl,
        videoId: trailerUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] || 'unknown',
        validatedAt: new Date()
      },
      transcript: transcript?.substring(0, 1000) + (transcript && transcript.length > 1000 ? '...' : ''),
      scores: analysisResult.scores,
      insights: analysisResult.insights,
      audioBriefing: audioUrl !== 'Audio briefing unavailable (S3 removed for temporary data)' ? {
        url: audioUrl,
        duration: 0,
        generatedAt: new Date(),
        voice: 'Joanna'
      } : undefined,
      aiModel: analysisResult.aiModel,
      processingStats: {
        transcriptionTime: 0,
        analysisTime: 0,
        audioGenerationTime: 0,
        totalTime: processingTime
      },
      createdAt: new Date(),
      completedAt: new Date()
    }

    console.log(`Analysis completed in ${processingTime}ms using ${analysisResult.aiModel}`)

    console.log('Final result structure check:', {
      hasResultScores: !!result.scores,
      hasResultInsights: !!result.insights,
      resultScoresKeys: result.scores ? Object.keys(result.scores) : 'no scores',
      resultOverallScore: result.scores?.overall
    })

    return result

  } catch (error) {
    console.error('Error in film analysis process:', error)
    throw error
  }
}
