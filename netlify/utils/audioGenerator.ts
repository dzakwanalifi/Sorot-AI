import {
  PollyClient,
  DescribeVoicesCommand
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
  console.log('Audio briefing generation requested')

  // Generate briefing text from analysis
  const briefingText = generateBriefingText(analysis)
  console.log(`Generated briefing text: ${briefingText.length} characters`)

  // Since we want to avoid S3 for temporary data, we need to implement an alternative approach
  // For now, we'll throw an error indicating this needs to be implemented differently
  throw new Error('Audio briefing generation requires S3 for storage. Please implement an alternative approach for temporary audio generation, such as returning audio as base64 data or using a different cloud service that doesn\'t require persistent storage.')
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
