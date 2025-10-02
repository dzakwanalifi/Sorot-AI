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

  // Check environment variables
  const USE_REAL_APIS = process.env.USE_REAL_APIS === 'true'
  const hasRequiredKeys = !!(process.env.GEMINI_API_KEY && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)

  console.log('Environment check:', {
    USE_REAL_APIS,
    hasRequiredKeys,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasAwsKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasAwsSecret: !!process.env.AWS_SECRET_ACCESS_KEY,
    nodeEnv: process.env.NODE_ENV
  })

  // If real APIs requested but keys missing, throw error
  if (USE_REAL_APIS && !hasRequiredKeys) {
    throw new Error(`Real API mode requested but required API keys are missing. Please check environment variables:
    - GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✓' : '✗'}
    - AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✓' : '✗'}
    - AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✓' : '✗'}

    For testing, set USE_REAL_APIS=false in environment variables.`)
  }

  // Use mock data if real APIs not enabled or keys missing
  const useRealApis = USE_REAL_APIS && hasRequiredKeys

  try {
    // Step 1: Extract text from PDF or text input
    onProgress?.(1, 'Processing PDF', 20)
    console.log(`Step 1: Extracting text from ${inputType === 'text' ? 'text input' : 'PDF'}...`)
    const synopsis = await extractTextFromPDF(pdfData, inputType)
    console.log(`Extracted ${synopsis.length} characters from ${inputType === 'text' ? 'text input' : 'PDF'}`)
    onProgress?.(1, 'Extracting Synopsis', 40)

    // Step 2: Download video audio (skip for mock mode)
    onProgress?.(2, 'Downloading Trailer', 50)
    let audioPath: string | null = null

    if (useRealApis) {
      console.log('Step 2: Downloading video audio...')
      audioPath = await downloadVideoAudio(trailerUrl)
      console.log('Audio downloaded successfully')
    } else {
      console.log('Step 2: Skipping audio download (mock mode)')
      audioPath = null
    }
    onProgress?.(2, 'Downloading Trailer', 70)

    // Step 3: Transcription (skip for mock mode)
    onProgress?.(3, 'Transcribing Audio', 75)
    if (useRealApis && audioPath) {
      console.log('Step 3: Attempting audio transcription...')
      try {
        transcript = await transcribeAudio(audioPath)
        console.log(`Transcription completed: ${transcript.length} characters`)
        onProgress?.(3, 'Transcribing Audio', 85)
      } catch (transcribeError) {
        const errorMessage = transcribeError instanceof Error ? transcribeError.message : 'Unknown transcription error'
        console.warn('Transcription failed:', errorMessage)
        console.log('Using fallback transcript for visual analysis only')
        transcript = 'Audio transcription unavailable. Using visual analysis only.'
        onProgress?.(3, 'Transcribing Audio', 85)
      }
    } else {
      console.log('Step 3: Using mock transcription (mock mode)')
      transcript = 'Mock transcription: This is a sample transcript from the film trailer. The story follows a young filmmaker discovering the magic of Indonesian cinema.'
      onProgress?.(3, 'Transcribing Audio', 85)
    }
    }

    // Step 4: AI Analysis
    onProgress?.(4, 'AI Analysis', 90)
    console.log('Step 4: Running AI analysis...')
    let analysisResult: any

    if (useRealApis) {
      analysisResult = await analyzeFilmContent(synopsis, transcript, trailerUrl)
    } else {
      console.log('Using mock AI analysis (mock mode)')
      analysisResult = {
        scores: {
          overall: 8.5,
          genre: 8.0,
          theme: 9.0,
          targetAudience: 7.5,
          technicalQuality: 8.8,
          emotionalImpact: 9.2
        },
        insights: {
          genre: ['Drama', 'Indie Film', 'Coming of Age'],
          themes: ['Identity', 'Cultural Heritage', 'Personal Growth', 'Artistic Expression'],
          targetAudience: 'Young adults aged 18-35 interested in indie cinema',
          keyMoments: [
            'Opening scene showing traditional Indonesian village life',
            'Character discovering old film reels in attic',
            'Emotional climax with family reconciliation',
            'Powerful ending with hope for future generations'
          ],
          strengths: [
            'Authentic portrayal of Indonesian culture',
            'Strong character development',
            'Beautiful cinematography capturing rural landscapes',
            'Compelling soundtrack blending traditional and modern music'
          ],
          suggestions: [
            'Consider tightening the pacing in the middle act',
            'Add more visual metaphors for the character\'s internal journey',
            'Consider international festival circuit appeal'
          ]
        },
        aiModel: 'mock'
      }
    }
    onProgress?.(4, 'AI Analysis', 95)

    // Step 5: Generate audio briefing
    onProgress?.(5, 'Generating Audio Brief', 98)
    console.log('Step 5: Generating audio briefing...')
    let audioUrl: string

    if (useRealApis) {
      try {
        audioUrl = await generateAudioBriefing(analysisResult)
        onProgress?.(5, 'Analysis Complete', 100)
      } catch (audioError) {
        const errorMessage = audioError instanceof Error ? audioError.message : 'Unknown audio generation error'
        console.warn('Audio briefing generation failed:', errorMessage)
        audioUrl = 'Audio briefing unavailable (API error)'
        onProgress?.(5, 'Analysis Complete', 100)
      }
    } else {
      console.log('Using mock audio briefing (mock mode)')
      audioUrl = 'Mock audio briefing URL - would contain AI-generated voice summary'
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
