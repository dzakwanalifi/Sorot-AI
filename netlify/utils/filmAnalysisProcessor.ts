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

  // Cost estimation mode: Enable real APIs for cost calculation
  const USE_REAL_APIS = process.env.USE_REAL_APIS === 'true'

  try {
    // Step 1: Extract text from PDF
    console.log('Step 1: Extracting text from PDF...')
    const synopsis = await extractTextFromPDF(pdfData)
    console.log(`Extracted ${synopsis.length} characters from PDF`)

    if (USE_REAL_APIS) {
      // Step 2: Download video audio (COSTLY - only when explicitly enabled)
      console.log('Step 2: Downloading video audio...')
      const audioPath = await downloadVideoAudio(trailerUrl)
      console.log('Audio downloaded successfully')

      // Step 3: Transcribe audio (COSTLY - only when explicitly enabled)
      console.log('Step 3: Transcribing audio...')
      transcript = await transcribeAudio(audioPath)
      console.log(`Transcription completed: ${transcript.length} characters`)
    } else {
      // Mock transcript for development (cost-free)
      console.log('Step 2-3: Using mock transcript for development (cost-saving mode)')
      transcript = `Mock transcript for development: This appears to be a compelling film trailer showcasing character development and emotional storytelling. The visual style suggests artistic cinematography with focus on atmospheric elements.`
      console.log(`Mock transcription: ${transcript.length} characters`)
    }

    // Step 4: AI Analysis with routing decision
    console.log('Step 4: Running AI analysis...')
    let analysisResult

    if (USE_REAL_APIS) {
      analysisResult = await analyzeFilmContent(synopsis, transcript, trailerUrl)
    } else {
      // Mock analysis for development (cost-free)
      console.log('Using mock AI analysis for development (cost-saving mode)')
      analysisResult = {
        scores: {
          overall: 82,
          genre: 85,
          theme: 78,
          targetAudience: 88,
          technicalQuality: 80,
          emotionalImpact: 82
        },
        insights: {
          genre: ['Drama', 'Indie Film'],
          themes: ['Character Journey', 'Emotional Depth', 'Atmospheric Storytelling'],
          targetAudience: 'Art-house cinema audiences and film festival attendees seeking character-driven narratives with artistic cinematography',
          keyMoments: [
            'Opening sequence establishing character motivation',
            'Key emotional turning point in the narrative',
            'Powerful closing imagery leaving lasting impact'
          ],
          strengths: [
            'Strong character development and emotional authenticity',
            'Artistic cinematography with atmospheric visuals',
            'Compelling narrative structure that builds tension effectively'
          ],
          suggestions: [
            'Consider enhancing supporting character arcs',
            'Experiment with more dynamic editing rhythms',
            'Add subtle sound design elements for emotional depth'
          ]
        },
        aiModel: 'mock' as any
      }
    }

    // Step 5: Generate audio briefing
    console.log('Step 5: Generating audio briefing...')
    let audioUrl: string

    if (USE_REAL_APIS) {
      audioUrl = await generateAudioBriefing(analysisResult)
    } else {
      // Mock audio URL for development (cost-free)
      console.log('Using mock audio URL for development (cost-saving mode)')
      audioUrl = `https://example.com/mock-audio-${Date.now()}.mp3`
    }

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

    console.log(`Analysis completed in ${processingTime}ms using ${analysisResult.aiModel} (real APIs: ${USE_REAL_APIS})`)
    return result

  } catch (error) {
    console.error('Error in film analysis process:', error)
    throw error
  }
}
