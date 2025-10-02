import { GoogleGenerativeAI } from '@google/generative-ai'
import { promises as fs } from 'fs'
import { AI_CONFIG, ERROR_MESSAGES } from '../../../constants'

export interface TranscriptionResult {
  success: boolean
  transcript?: string
  metadata?: {
    duration: number
    wordCount: number
    language: string
    transcribedAt: Date
  }
  error?: string
}

/**
 * Transcribe audio using Gemini 2.5 Flash-Lite
 */
export async function transcribeAudioWithGemini(
  audioPath: string
): Promise<TranscriptionResult> {
  try {
    console.log('🎙️ Starting Gemini transcription...', { audioPath })

    // Check if audio file exists
    const stats = await fs.stat(audioPath)
    if (stats.size === 0) {
      throw new Error('Audio file is empty')
    }

    // Read audio file
    const audioBuffer = await fs.readFile(audioPath)
    const audioBase64 = audioBuffer.toString('base64')

    console.log('📤 Sending audio to Gemini...', {
      size: stats.size,
      base64Length: audioBase64.length
    })

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: AI_CONFIG.GEMINI_MODEL })

    // Create transcription prompt
    const prompt = `Please transcribe this audio file completely and accurately. Include all spoken words, sound effects, and background audio descriptions if relevant. Format the transcript as clean text without timestamps unless there are multiple speakers or important scene changes.

Guidelines:
- Transcribe all spoken dialogue and narration
- Include descriptions of significant sound effects in [brackets]
- Note speaker changes if detectable
- Maintain original language of the audio
- Provide complete transcript without omissions

Return only the transcript text, no additional formatting or headers.`

    // Send to Gemini for transcription
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'audio/m4a',
          data: audioBase64
        }
      }
    ])

    const response = await result.response
    const transcript = response.text().trim()

    if (!transcript || transcript.length < 10) {
      return {
        success: false,
        error: 'Transcription returned insufficient content'
      }
    }

    // Count words
    const wordCount = transcript.split(/\s+/).filter(word => word.length > 0).length

    console.log('✅ Gemini transcription completed', {
      wordCount,
      transcriptLength: transcript.length
    })

    return {
      success: true,
      transcript,
      metadata: {
        duration: 0, // Will be updated if available
        wordCount,
        language: 'auto-detected', // Gemini auto-detects
        transcribedAt: new Date()
      }
    }

  } catch (error) {
    console.error('❌ Gemini transcription failed:', error)

    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown transcription error'

    return {
      success: false,
      error: `${ERROR_MESSAGES.ANALYSIS_FAILED}: ${errorMessage}`
    }
  }
}

/**
 * Fallback transcription using AWS Transcribe (if needed)
 */
export async function transcribeAudioWithAWS(
  _audioPath: string
): Promise<TranscriptionResult> {
  // This would implement AWS Transcribe as fallback
  // For now, return not implemented
  console.log('⚠️ AWS Transcribe fallback not yet implemented')
  return {
    success: false,
    error: 'AWS Transcribe fallback not implemented'
  }
}

/**
 * Main transcription function with Gemini primary, AWS fallback
 */
export async function transcribeAudio(
  audioPath: string,
  useAWSFallback: boolean = false
): Promise<TranscriptionResult> {
  console.log('🎙️ Starting audio transcription...')

  // Try Gemini first
  const geminiResult = await transcribeAudioWithGemini(audioPath)

  if (geminiResult.success) {
    return geminiResult
  }

  // If Gemini fails and AWS fallback is enabled
  if (useAWSFallback) {
    console.log('🔄 Gemini failed, trying AWS fallback...')
    return await transcribeAudioWithAWS(audioPath)
  }

  // Return Gemini error
  return geminiResult
}

/**
 * Validate transcript quality
 */
export function validateTranscript(transcript: string): {
  isValid: boolean;
  quality: 'good' | 'poor' | 'insufficient';
  wordCount: number;
  reason?: string;
} {
  const wordCount = transcript.split(/\s+/).filter(word => word.length > 0).length

  if (wordCount < 10) {
    return {
      isValid: false,
      quality: 'insufficient',
      wordCount,
      reason: 'Transcript too short (< 10 words)'
    }
  }

  if (wordCount < 50) {
    return {
      isValid: true,
      quality: 'poor',
      wordCount,
      reason: 'Limited dialogue detected'
    }
  }

  return {
    isValid: true,
    quality: 'good',
    wordCount
  }
}
