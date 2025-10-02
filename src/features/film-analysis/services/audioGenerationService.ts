import { PollyClient, SynthesizeSpeechCommand, DescribeVoicesCommand } from '@aws-sdk/client-polly'
import { promises as fs } from 'fs'
import path from 'path'
import { ERROR_MESSAGES } from '../../../constants'

export interface AudioGenerationResult {
  success: boolean
  audioUrl?: string
  metadata?: {
    voice: string
    duration: number
    fileSize: number
    generatedAt: Date
  }
  error?: string
}

/**
 * Generate audio briefing using AWS Polly
 */
export async function generateAudioBriefing(
  text: string,
  outputDir: string = './temp',
  voiceId: string = 'Joanna'
): Promise<AudioGenerationResult> {
  try {
    console.log('🔊 Starting audio briefing generation...', { voiceId, textLength: text.length })

    const client = new PollyClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `briefing_${timestamp}_${voiceId}.mp3`
    const outputPath = path.join(outputDir, filename)

    console.log('🎵 Generating speech with Polly...', { filename })

    // Generate speech
    const command = new SynthesizeSpeechCommand({
      Text: text,
      VoiceId: voiceId as any,
      Engine: 'neural', // Use neural engine for better quality
      OutputFormat: 'mp3',
      TextType: 'text'
    })

    const response = await client.send(command)

    if (!response.AudioStream) {
      throw new Error('No audio stream received from Polly')
    }

    // Convert audio stream to buffer and save
    const audioBuffer = Buffer.from(await response.AudioStream.transformToByteArray())
    await fs.writeFile(outputPath, audioBuffer)

    // Get file stats
    const stats = await fs.stat(outputPath)

    console.log('✅ Audio briefing generated', {
      size: stats.size,
      path: outputPath,
      voice: voiceId
    })

    return {
      success: true,
      audioUrl: `/audio/${filename}`, // Relative URL for serving
      metadata: {
        voice: voiceId,
        duration: 0, // Would need additional processing to determine
        fileSize: stats.size,
        generatedAt: new Date()
      }
    }

  } catch (error) {
    console.error('❌ Audio generation failed:', error)

    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown audio generation error'

    return {
      success: false,
      error: `${ERROR_MESSAGES.ANALYSIS_FAILED}: ${errorMessage}`
    }
  }
}

/**
 * Get available Polly voices
 */
export async function getAvailableVoices(languageCode: string = 'en-US'): Promise<string[]> {
  try {
    const client = new PollyClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })

    const command = new DescribeVoicesCommand({
      LanguageCode: languageCode as any
    })

    const response = await client.send(command)

    return response.Voices?.map(voice => voice.Id!).filter(Boolean) || []

  } catch (error) {
    console.error('❌ Failed to get Polly voices:', error)
    return []
  }
}

/**
 * Create analysis summary text for audio briefing
 */
export function createBriefingText(
  title: string,
  scores: any,
  insights: any,
  aiModel: string
): string {
  const { overall, genre, theme, targetAudience, technicalQuality, emotionalImpact } = scores
  const { genre: genres, themes, targetAudience: audience, strengths } = insights

  return `
    Film Analysis Briefing for: ${title}

    Overall Score: ${overall} out of 100.

    Key Scores:
    Genre Fit: ${genre}/100
    Thematic Depth: ${theme}/100
    Audience Appeal: ${targetAudience}/100
    Technical Quality: ${technicalQuality}/100
    Emotional Impact: ${emotionalImpact}/100

    Genres: ${genres.join(', ')}

    Main Themes: ${themes.slice(0, 3).join(', ')}

    Target Audience: ${audience}

    Key Strengths: ${strengths.slice(0, 2).join(', ')}

    Analysis performed using ${aiModel === 'openai' ? 'OpenAI GPT model' : 'Google Gemini model'}.

    This concludes the automated film analysis briefing.
  `.trim().replace(/\n{3,}/g, '\n\n')
}

/**
 * Cleanup generated audio files
 */
export async function cleanupAudioFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
    console.log('🧹 Cleaned up audio file:', filePath)
  } catch (error) {
    console.warn('⚠️ Failed to cleanup audio file:', filePath, error)
  }
}

/**
 * Validate text for audio generation
 */
export function validateTextForAudio(text: string): { isValid: boolean; error?: string } {
  const trimmed = text.trim()

  if (!trimmed) {
    return { isValid: false, error: 'Text is empty' }
  }

  if (trimmed.length < 10) {
    return { isValid: false, error: 'Text too short for meaningful audio' }
  }

  if (trimmed.length > 50000) { // Polly limit is 100,000 characters, be conservative
    return { isValid: false, error: 'Text too long for audio generation' }
  }

  return { isValid: true }
}
