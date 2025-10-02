import { extractTextFromPDF } from './pdfProcessor.js'
import { downloadVideoAudio } from './videoDownloader.js'
import { transcribeAudio } from './transcribeService.js'
import { analyzeFilmContent, analyzeFilmVisually } from './aiAnalyzer.js'
import { generateAudioBriefing } from './audioGenerator.js'
import type { FilmAnalysis } from '../types/analysis.js'

export async function processFilmAnalysis(
  pdfData: string,
  trailerUrl: string,
  inputType: 'file' | 'text' = 'file',
  onProgress?: (step: number, stepName: string, progress: number) => void
): Promise<FilmAnalysis> {
  const startTime = Date.now()
  let transcript: string | null = null

  // Validate required environment variables
  const requiredKeys = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION
  }

  const missingKeys = Object.entries(requiredKeys)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}\n\nPlease ensure all required API keys are set in your AWS Lambda environment variables.`)
  }

  console.log('Environment validation passed - all required API keys present')

  try {
    // Step 1: Extract text from PDF or text input
    onProgress?.(1, 'Processing PDF', 20)
    console.log(`Step 1: Extracting text from ${inputType === 'text' ? 'text input' : 'PDF'}...`)
    const synopsis = await extractTextFromPDF(pdfData, inputType)
    console.log(`Extracted ${synopsis.length} characters from ${inputType === 'text' ? 'text input' : 'PDF'}`)
    onProgress?.(1, 'Extracting Synopsis', 40)

    // Step 2: Gemini Visual Analysis (MANDATORY)
    onProgress?.(2, 'Visual Analysis', 50)
    console.log('Step 2: Running Gemini visual analysis...')
    let visualAnalysis
    try {
      visualAnalysis = await analyzeFilmVisually(trailerUrl)
      console.log('Visual analysis completed successfully')
      onProgress?.(2, 'Visual Analysis', 70)
    } catch (visualError) {
      const errorMessage = visualError instanceof Error ? visualError.message : 'Unknown visual analysis error'
      console.error('Visual analysis failed:', errorMessage)
      throw new Error(`Visual analysis failed: ${errorMessage}`)
    }

    // Step 3: Audio Processing (OPTIONAL - for additional context)
    onProgress?.(3, 'Audio Enhancement', 75)
    console.log('Step 3: Attempting audio transcription for additional context...')
    let audioPath: string | null = null
    try {
      audioPath = await downloadVideoAudio(trailerUrl)
      transcript = await transcribeAudio(audioPath)
      console.log(`Transcription completed: ${transcript.length} characters`)
      onProgress?.(3, 'Audio Enhancement', 85)
    } catch (audioError) {
      const errorMessage = audioError instanceof Error ? audioError.message : 'Unknown audio processing error'
      console.warn('Audio processing failed, proceeding with visual analysis only:', errorMessage)
      transcript = null
      onProgress?.(3, 'Audio Enhancement', 85)
    }

    // Step 4: AI Synthesis (Combine Visual + Audio)
    onProgress?.(4, 'AI Synthesis', 90)
    console.log('Step 4: Running AI synthesis with combined visual and audio data...')
    const analysisResult = await analyzeFilmContent(synopsis, visualAnalysis, transcript)
    onProgress?.(4, 'AI Synthesis', 95)

    // Step 5: Generate audio briefing
    onProgress?.(5, 'Generating Audio Brief', 98)
    console.log('Step 5: Generating audio briefing...')
    let audioUrl: string

    try {
      audioUrl = await generateAudioBriefing(analysisResult)
      onProgress?.(5, 'Analysis Complete', 100)
    } catch (audioError) {
      const errorMessage = audioError instanceof Error ? audioError.message : 'Unknown audio generation error'
      console.warn('Audio briefing generation failed:', errorMessage)
      throw new Error(`Audio briefing generation failed: ${errorMessage}`)
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
      audioBriefing: {
        url: audioUrl,
        duration: 0,
        generatedAt: new Date(),
        voice: 'Joanna'
      },
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

    // Clean up temp audio file if it was downloaded
    if (audioPath) {
      try {
        const fs = await import('fs/promises')
        await fs.access(audioPath)
        await fs.unlink(audioPath)
        console.log(`Cleaned up temp audio file after successful processing: ${audioPath}`)
      } catch (cleanupError: unknown) {
        const error = cleanupError as { code?: string; message?: string }
        if (error.code !== 'ENOENT') {
          console.warn('Failed to clean up temp audio file:', error.message || 'Unknown error')
        }
      }
    }

    return result

  } catch (error) {
    console.error('Error in film analysis process:', error)
    throw error
  }
}
