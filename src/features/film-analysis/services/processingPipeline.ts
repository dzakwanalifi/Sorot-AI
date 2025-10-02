import { createFilmAnalysis, FilmAnalysis, createFilmSynopsis, FilmSynopsis } from '../../../core/domain'
import { validatePDFData } from './pdfExtractionService'
import { validateYouTubeUrl, cleanupAudioFile } from './audioDownloadService'
import { analyzeFilm, AnalysisResult } from './analysisService'
import { generateAudioBriefing, createBriefingText, validateTextForAudio } from './audioGenerationService'

export interface ProcessingProgress {
  step: string
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

export interface PipelineResult {
  success: boolean
  analysis?: FilmAnalysis
  progress: ProcessingProgress
  error?: string
}

/**
 * Main processing pipeline orchestrator
 */
export class FilmAnalysisPipeline {
  private progressCallback?: (progress: ProcessingProgress) => void
  private tempFiles: string[] = []

  constructor(progressCallback?: (progress: ProcessingProgress) => void) {
    this.progressCallback = progressCallback
  }

  private updateProgress(step: string, progress: number, status: ProcessingProgress['status'], error?: string) {
    const progressUpdate: ProcessingProgress = {
      step,
      progress,
      status,
      error
    }

    console.log(`📊 ${step}: ${progress}% - ${status}`)
    this.progressCallback?.(progressUpdate)
  }

  /**
   * Execute complete film analysis pipeline
   */
  async processFilm(pdfData: string, trailerUrl: string): Promise<PipelineResult> {
    const startTime = Date.now()
    let currentProgress = 0

    try {
      // Step 1: Validate inputs
      this.updateProgress('Validating inputs', currentProgress, 'processing')
      const validation = await this.validateInputs(pdfData, trailerUrl)
      if (!validation.success) {
        throw new Error(validation.error)
      }
      currentProgress = 5

      // Step 2: Process synopsis (PDF or text)
      this.updateProgress('Processing synopsis', currentProgress, 'processing')

      let synopsis: FilmSynopsis
      let isTextInput = false

      // Always treat input as base64 encoded text for now
      // Frontend sends base64 encoded text regardless of input type
      console.log('🔍 Processing input data, length:', pdfData.length)

      try {
        const decodedData = atob(pdfData)
        console.log('📄 Successfully decoded base64, length:', decodedData.length)
        console.log('📄 First 100 chars:', decodedData.substring(0, 100))

        // For now, always treat as text input (simplified approach)
        console.log('📝 Processing as text input...')
        isTextInput = true
        const textContent = decodedData
        const title = textContent.split('\n')[0]?.substring(0, 50) || 'Film Synopsis'

        synopsis = createFilmSynopsis(title, textContent, 'text_input.txt')
        console.log('✅ Created synopsis:', { title, contentLength: textContent.length })

      } catch (decodeError) {
        const errorMessage = decodeError instanceof Error ? decodeError.message : 'Unknown decode error'
        console.log('❌ Base64 decode failed:', errorMessage)
        console.log('📄 Raw data preview:', pdfData.substring(0, 100))
        throw new Error(`Invalid input data: ${errorMessage}`)
      }

      console.log(`Processed ${isTextInput ? 'text' : 'PDF'} synopsis:`, synopsis.title)
      currentProgress = 20

      // Step 3: Validate trailer URL
      this.updateProgress('Validating trailer URL', currentProgress, 'processing')
      const trailerValidation = validateYouTubeUrl(trailerUrl)
      if (!trailerValidation.isValid) {
        throw new Error(trailerValidation.error)
      }
      const trailerInfo = {
        url: trailerUrl,
        videoId: trailerValidation.videoId!,
        validatedAt: new Date()
      }
      currentProgress = 25

      let transcript = ''
      let transcriptionTime = 0

      // TEMP: Skip audio processing for now - focus on AI analysis
      console.log('⏭️ Skipping audio processing - direct to AI analysis')
      transcript = synopsis.content.substring(0, 500) // Use first 500 chars as transcript
      transcriptionTime = 0
      currentProgress = 40

      // Step 6: Analyze with AI
      this.updateProgress('AI analysis', currentProgress, 'processing')
      console.log('🤖 Starting AI analysis with:', {
        synopsisLength: synopsis.content.length,
        transcriptLength: transcript.length,
        hasTrailer: !!trailerUrl
      })

      let analysisResult: AnalysisResult | null = null
      try {
        analysisResult = await analyzeFilm(synopsis, transcript, trailerUrl)
        console.log('🤖 AI analysis result:', {
          success: analysisResult.success,
          hasScores: !!analysisResult.scores,
          hasInsights: !!analysisResult.insights,
          aiModel: analysisResult.aiModel,
          error: analysisResult.error
        })

        if (!analysisResult.success || !analysisResult.scores || !analysisResult.insights) {
          throw new Error(analysisResult.error || 'AI analysis failed')
        }
        currentProgress = 85
      } catch (aiError) {
        const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown AI analysis error'
        console.error('❌ AI analysis error:', errorMessage)
        throw new Error(`AI analysis failed: ${errorMessage}`)
      }

      // Step 7: Generate audio briefing
      this.updateProgress('Generating audio briefing', currentProgress, 'processing')
      const briefingText = createBriefingText(
        synopsis.title,
        analysisResult.scores,
        analysisResult.insights,
        analysisResult.aiModel || 'unknown'
      )

      const textValidation = validateTextForAudio(briefingText)
      if (!textValidation.isValid) {
        console.warn('⚠️ Skipping audio generation:', textValidation.error)
        currentProgress = 100
      } else {
        const audioResult = await generateAudioBriefing(briefingText)
        if (!audioResult.success) {
          console.warn('⚠️ Audio generation failed, but analysis completed')
        }
        currentProgress = 100
      }

      // Step 8: Create final analysis object
      this.updateProgress('Creating analysis report', currentProgress, 'processing')
      const totalTime = Date.now() - startTime

      const analysis: FilmAnalysis = createFilmAnalysis(
        synopsis,
        trailerInfo,
        analysisResult.scores!,
        analysisResult.insights!,
        analysisResult.aiModel as 'deepseek' | 'gemini'
      )

      // Add processing stats
      analysis.processingStats = {
        transcriptionTime: isTextInput ? 0 : transcriptionTime,
        analysisTime: analysisResult.metadata?.processingTime || 0,
        audioGenerationTime: 0, // Would need to track separately
        totalTime
      }

      this.updateProgress('Analysis completed', 100, 'completed')

      // Cleanup temp files
      await this.cleanup()

      return {
        success: true,
        analysis,
        progress: {
          step: 'Analysis completed',
          progress: 100,
          status: 'completed'
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown pipeline error'
      console.error('❌ Pipeline failed:', errorMessage)

      this.updateProgress('Pipeline failed', currentProgress, 'failed', errorMessage)

      // Cleanup on failure
      await this.cleanup()

      return {
        success: false,
        progress: {
          step: 'Pipeline failed',
          progress: currentProgress,
          status: 'failed',
          error: errorMessage
        },
        error: errorMessage
      }
    }
  }

  /**
   * Validate input parameters
   */
  private async validateInputs(pdfData: string, trailerUrl: string): Promise<{ success: boolean; error?: string }> {
    // Validate PDF data
    const pdfValidation = validatePDFData(pdfData)
    if (!pdfValidation.isValid) {
      return { success: false, error: pdfValidation.error }
    }

    // Validate trailer URL
    const urlValidation = validateYouTubeUrl(trailerUrl)
    if (!urlValidation.isValid) {
      return { success: false, error: urlValidation.error }
    }

    // Check environment variables
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'GEMINI_API_KEY not configured' }
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return { success: false, error: 'AWS credentials not configured' }
    }

    return { success: true }
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(): Promise<void> {
    for (const file of this.tempFiles) {
      try {
        await cleanupAudioFile(file)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown cleanup error'
        console.warn('Failed to cleanup file:', file, errorMessage)
      }
    }
    this.tempFiles = []
  }
}

/**
 * Convenience function to process film analysis
 */
export async function processFilmAnalysis(
  pdfData: string,
  trailerUrl: string,
  progressCallback?: (progress: ProcessingProgress) => void
): Promise<PipelineResult> {
  const pipeline = new FilmAnalysisPipeline(progressCallback)
  return await pipeline.processFilm(pdfData, trailerUrl)
}
