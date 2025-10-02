import { createFilmAnalysis, FilmAnalysis } from '../../../core/domain'
import { extractTextFromPDF, validatePDFData } from './pdfExtractionService'
import { downloadAudioFromYouTube, validateYouTubeUrl, cleanupAudioFile } from './audioDownloadService'
import { transcribeAudio } from './transcriptionService'
import { analyzeFilm } from './analysisService'
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

      // Step 2: Extract PDF text
      this.updateProgress('Extracting PDF text', currentProgress, 'processing')
      const pdfResult = await extractTextFromPDF(pdfData, 'film_synopsis.pdf')
      if (!pdfResult.success || !pdfResult.synopsis) {
        throw new Error(pdfResult.error || 'PDF extraction failed')
      }
      const synopsis = pdfResult.synopsis
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

      // Step 4: Download audio
      this.updateProgress('Downloading trailer audio', currentProgress, 'processing')
      const audioResult = await downloadAudioFromYouTube(trailerUrl)
      if (!audioResult.success || !audioResult.audioPath) {
        throw new Error(audioResult.error || 'Audio download failed')
      }
      this.tempFiles.push(audioResult.audioPath)
      currentProgress = 45

      // Step 5: Transcribe audio
      this.updateProgress('Transcribing audio', currentProgress, 'processing')
      const transcriptionResult = await transcribeAudio(audioResult.audioPath)
      if (!transcriptionResult.success || !transcriptionResult.transcript) {
        throw new Error(transcriptionResult.error || 'Transcription failed')
      }
      const transcript = transcriptionResult.transcript
      currentProgress = 65

      // Step 6: Analyze with AI
      this.updateProgress('AI analysis', currentProgress, 'processing')
      const analysisResult = await analyzeFilm(synopsis, transcript, trailerUrl)
      if (!analysisResult.success || !analysisResult.scores || !analysisResult.insights) {
        throw new Error(analysisResult.error || 'AI analysis failed')
      }
      currentProgress = 85

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
        analysisResult.aiModel as 'openai' | 'gemini'
      )

      // Add processing stats
      analysis.processingStats = {
        transcriptionTime: transcriptionResult.metadata?.transcribedAt.getTime() ? Date.now() - transcriptionResult.metadata.transcribedAt.getTime() : 0,
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
        console.warn('Failed to cleanup file:', file, error)
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
