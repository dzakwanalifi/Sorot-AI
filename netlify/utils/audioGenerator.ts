import {
  PollyClient,
  DescribeVoicesCommand,
  SynthesizeSpeechCommand
} from '@aws-sdk/client-polly'
import type { AIAnalysisResult } from './aiAnalyzer'

// Validate required AWS environment variables
const AWS_REGION = process.env.AWS_REGION

if (!AWS_REGION) {
  throw new Error('AWS_REGION environment variable is required but not set')
}

const pollyClient = new PollyClient({
  region: AWS_REGION
})

export async function generateAudioBriefing(analysis: AIAnalysisResult): Promise<string> {
  try {
    console.log('Audio briefing generation requested')

    // Generate briefing text from analysis
    const briefingText = generateBriefingText(analysis)
    console.log(`Generated briefing text: ${briefingText.length} characters`)

    // Use Polly to generate speech directly (no S3 storage needed)
    console.log('Generating speech with AWS Polly...')

    const command = new SynthesizeSpeechCommand({
      Text: briefingText,
      OutputFormat: 'mp3',
      VoiceId: 'Joanna', // Neural voice for better quality
      Engine: 'neural',
      TextType: 'text'
    })

    const response = await pollyClient.send(command)

    if (!response.AudioStream) {
      throw new Error('No audio stream returned from Polly')
    }

    // Convert the audio stream to base64
    const audioBuffer = Buffer.from(await response.AudioStream.transformToByteArray())
    const audioBase64 = audioBuffer.toString('base64')

    console.log(`Audio briefing generated: ${audioBuffer.length} bytes`)

    // Return base64 encoded audio data
    return `data:audio/mp3;base64,${audioBase64}`

  } catch (error) {
    console.error('Audio briefing generation failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Audio briefing generation failed: ${errorMessage}`)
  }
}

function generateBriefingText(analysis: AIAnalysisResult): string {
  const { scores, insights } = analysis

  const text = `
    Film Analysis Briefing.

    Overall Score: ${scores.overall} out of 100.

    Genre Classification: ${scores.genre} out of 100.
    Primary genres identified: ${insights.genre.join(', ')}.

    Thematic Depth: ${scores.theme} out of 100.
    Key themes: ${insights.themes.join(', ')}.

    Target Audience Fit: ${scores.targetAudience} out of 100.
    Target audience: ${insights.targetAudience}.

    Technical Quality: ${scores.technicalQuality} out of 100.

    Emotional Impact: ${scores.emotionalImpact} out of 100.

    Key strengths: ${insights.strengths.join('. ')}.

    Areas for improvement: ${insights.suggestions.join('. ')}.

    This analysis was generated using ${analysis.aiModel === 'openai' ? 'OpenAI GPT OSS-120B' : 'Google Gemini'} artificial intelligence.
  `.trim().replace(/\s+/g, ' ') // Clean up formatting

  return text
}

// Optional: Get available voices for future configuration
export async function getAvailableVoices() {
  try {
    const command = new DescribeVoicesCommand({
      LanguageCode: 'en-US',
      Engine: 'neural'
    })

    const response = await pollyClient.send(command)
    return response.Voices || []

  } catch (error) {
    console.error('Error getting Polly voices:', error)
    return []
  }
}
