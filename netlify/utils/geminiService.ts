import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIAnalysisResult } from './aiAnalyzer'

// Validate Gemini API key is present
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required but not set')
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

export async function analyzeWithGemini(
  synopsis: string,
  transcript: string,
  trailerUrl: string
): Promise<AIAnalysisResult> {
  try {
    console.log('Starting Gemini visual analysis')

    console.log('Using Gemini API with configured key')

    // Extract YouTube video ID for API
    const videoIdMatch = trailerUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    const videoId = videoIdMatch ? videoIdMatch[1] : null

    if (!videoId) {
      throw new Error('Could not extract YouTube video ID')
    }

    const prompt = `
You are an expert film critic specializing in visual storytelling analysis. Analyze this film trailer and synopsis for festival selection potential.

SYNOPSIS:
${synopsis}

TRANSCRIPT (limited):
${transcript}

TRAILER URL: https://www.youtube.com/watch?v=${videoId}

Based on the visual storytelling, cinematography, editing, and thematic elements you can infer from the trailer, provide a comprehensive analysis in the following JSON format:

{
  "scores": {
    "overall": <number 0-100>,
    "genre": <number 0-100>,
    "theme": <number 0-100>,
    "targetAudience": <number 0-100>,
    "technicalQuality": <number 0-100>,
    "emotionalImpact": <number 0-100>
  },
  "insights": {
    "genre": ["primary genre", "secondary genre"],
    "themes": ["theme1", "theme2", "theme3"],
    "targetAudience": "detailed description based on visual style and themes",
    "keyMoments": ["visual moment1", "visual moment2", "visual moment3"],
    "strengths": ["visual strength1", "visual strength2", "visual strength3"],
    "suggestions": ["visual improvement1", "visual improvement2"]
  }
}

Guidelines for visual analysis:
- Analyze cinematography, lighting, composition, color palette
- Consider editing rhythm and visual storytelling techniques
- Evaluate how visuals support the emotional narrative
- Assess technical quality of production values
- Consider festival appeal based on artistic merit and innovation

Return ONLY valid JSON, no additional text.
    `.trim()

    // For YouTube URLs, we can pass them directly to Gemini
    console.log('Calling Gemini API with prompt length:', prompt.length)

    const result = await model.generateContent([
      prompt,
      {
        fileData: {
          fileUri: trailerUrl,
          mimeType: 'video/*'
        }
      }
    ])

    console.log('Gemini API call completed, getting response...')
    const response = await result.response
    const analysisText = response.text()

    console.log('Received response from Gemini, length:', analysisText.length)
    console.log('Gemini response preview:', analysisText.substring(0, 200) + '...')

    // Parse the JSON response
    const analysisResult = JSON.parse(analysisText)

    return {
      scores: analysisResult.scores,
      insights: analysisResult.insights,
      aiModel: 'gemini'
    }

  } catch (error) {
    console.error('Error in Gemini analysis:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Provide specific error messages for common issues
    if (errorMessage.includes('API key not valid')) {
      throw new Error('Invalid Gemini API key. Please check your API key configuration')
    }

    if (errorMessage.includes('QUOTA_EXCEEDED')) {
      throw new Error('Gemini API quota exceeded. Please check your usage limits')
    }

    if (errorMessage.includes('RATE_LIMIT_EXCEEDED')) {
      throw new Error('Gemini API rate limit exceeded. Please try again later')
    }

    throw new Error(`Gemini analysis failed: ${errorMessage}`)
  }
}
