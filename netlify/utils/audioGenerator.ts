import {
  PollyClient,
  SynthesizeSpeechCommand,
  DescribeVoicesCommand
} from '@aws-sdk/client-polly'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { AIAnalysisResult } from './aiAnalyzer'

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1'
})

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
})

export async function generateAudioBriefing(analysis: AIAnalysisResult): Promise<string> {
  try {
    console.log('Starting audio briefing generation with Polly')

    // Generate briefing text from analysis
    const briefingText = generateBriefingText(analysis)

    console.log(`Generated briefing text: ${briefingText.length} characters`)

    // Synthesize speech
    const synthesizeCommand = new SynthesizeSpeechCommand({
      Text: briefingText,
      OutputFormat: 'mp3',
      VoiceId: 'Joanna', // Professional female voice
      Engine: 'neural',
      TextType: 'text'
    })

    const response = await pollyClient.send(synthesizeCommand)

    if (!response.AudioStream) {
      throw new Error('No audio stream received from Polly')
    }

    // Convert stream to buffer
    const audioBuffer = Buffer.from(await response.AudioStream.transformToByteArray())

    // Upload to S3
    const audioKey = `audio-briefings/briefing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'sorot-ai-temp',
      Key: audioKey,
      Body: audioBuffer,
      ContentType: 'audio/mpeg',
      ACL: 'public-read' // Make it publicly accessible
    })

    await s3Client.send(uploadCommand)

    const audioUrl = `https://${process.env.S3_BUCKET_NAME || 'sorot-ai-temp'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${audioKey}`

    console.log('Audio briefing uploaded to S3:', audioUrl)

    return audioUrl

  } catch (error) {
    console.error('Error generating audio briefing:', error)

    // Return mock URL for development/demo
    console.log('Returning mock audio URL')

    return `https://example.com/audio-briefing-${Date.now()}.mp3`
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

    This analysis was generated using ${analysis.aiModel === 'openai' ? 'OpenAI GPT-4' : 'Google Gemini'} artificial intelligence.
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
