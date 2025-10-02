import {
  PollyClient,
  DescribeVoicesCommand,
  SynthesizeSpeechCommand
} from '@aws-sdk/client-polly'
import { Readable } from 'stream'
import type { AIAnalysisResult } from './aiAnalyzer.js'

// Validate required AWS environment variables
const AWS_REGION = process.env.AWS_REGION

if (!AWS_REGION) {
  throw new Error('AWS_REGION environment variable is required but not set')
}

const pollyClient = new PollyClient({
  region: AWS_REGION
})

// Utility function to convert readable stream to buffer
function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

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
      TextType: 'ssml' // Use SSML for better speech control
    })

    const response = await pollyClient.send(command)

    if (!response.AudioStream) {
      throw new Error('No audio stream returned from Polly')
    }

    // Convert the audio stream to buffer using stream-to-buffer utility
    const audioBuffer = await streamToBuffer(response.AudioStream as Readable)
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

  // Use SSML for better speech synthesis control
  const text = `<speak>
    <prosody rate="medium" volume="default">
      Film Analysis Briefing.

      <break time="500ms"/>
      Overall Score: ${scores.overall} out of 100.

      <break time="300ms"/>
      Genre Classification: ${scores.genre} out of 100.
      Primary genres identified: ${insights.genre.join(', ')}.

      <break time="300ms"/>
      Thematic Depth: ${scores.theme} out of 100.
      Key themes: ${insights.themes.join(', ')}.

      <break time="300ms"/>
      Target Audience Fit: ${scores.targetAudience} out of 100.
      Target audience: ${insights.targetAudience}.

      <break time="300ms"/>
      Technical Quality: ${scores.technicalQuality} out of 100.

      <break time="300ms"/>
      Emotional Impact: ${scores.emotionalImpact} out of 100.

      <break time="500ms"/>
      Key strengths: ${insights.strengths.join('. ')}.

      <break time="500ms"/>
      Areas for improvement: ${insights.suggestions.join('. ')}.

      <break time="700ms"/>
      This analysis was generated using ${analysis.aiModel === 'openai' ? 'OpenAI GPT OSS-120B' : 'Google Gemini'} artificial intelligence.
    </prosody>
  </speak>`

  return text.trim()
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
