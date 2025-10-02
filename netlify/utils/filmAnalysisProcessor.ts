import { extractTextFromPDF } from './pdfProcessor'
import { downloadVideoAudio } from './videoDownloader'
import { transcribeAudio } from './transcribeService'
import { analyzeFilmContent } from './aiAnalyzer'
import { generateAudioBriefing } from './audioGenerator'
import type { FilmAnalysis } from '../../src/types/analysis'

export async function processFilmAnalysis(
  pdfData: string,
  trailerUrl: string
): Promise<FilmAnalysis> {
  const startTime = Date.now()
  let transcript: string | null = null

  try {
    // Step 1: Extract text from PDF
    console.log('Step 1: Extracting text from PDF...')
    const synopsis = await extractTextFromPDF(pdfData)
    console.log(`Extracted ${synopsis.length} characters from PDF`)

    // Step 2: Download video audio
    console.log('Step 2: Downloading video audio...')
    const audioPath = await downloadVideoAudio(trailerUrl)
    console.log('Audio downloaded successfully')

    // Step 3: Transcribe audio
    console.log('Step 3: Transcribing audio...')
    transcript = await transcribeAudio(audioPath)
    console.log(`Transcription completed: ${transcript.length} characters`)

    // Step 4: AI Analysis with routing decision
    console.log('Step 4: Running AI analysis...')
    const analysisResult = await analyzeFilmContent(
      synopsis,
      transcript,
      trailerUrl
    )

    // Step 5: Generate audio briefing
    console.log('Step 5: Generating audio briefing...')
    const audioUrl = await generateAudioBriefing(analysisResult)

    const processingTime = Date.now() - startTime

    // Compile final result
    const result: FilmAnalysis = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      synopsis: synopsis.substring(0, 500) + (synopsis.length > 500 ? '...' : ''),
      trailerUrl,
      transcript: transcript.substring(0, 1000) + (transcript.length > 1000 ? '...' : ''),
      scores: analysisResult.scores,
      insights: analysisResult.insights,
      audioBriefingUrl: audioUrl,
      processingTime,
      aiModel: analysisResult.aiModel,
      createdAt: new Date()
    }

    console.log(`Analysis completed in ${processingTime}ms using ${analysisResult.aiModel}`)
    return result

  } catch (error) {
    console.error('Error in film analysis process:', error)
    throw error
  }
}
