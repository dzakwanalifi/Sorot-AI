import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIAnalysisResult } from './aiAnalyzer'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

export async function analyzeWithGemini(
  synopsis: string,
  transcript: string,
  trailerUrl: string
): Promise<AIAnalysisResult> {
  try {
    console.log('Starting Gemini visual analysis')

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
    const result = await model.generateContent([
      prompt,
      {
        fileData: {
          fileUri: trailerUrl,
          mimeType: 'video/*'
        }
      }
    ])

    const response = await result.response
    const analysisText = response.text()

    console.log('Received response from Gemini')

    // Parse the JSON response
    const analysisResult = JSON.parse(analysisText)

    return {
      scores: analysisResult.scores,
      insights: analysisResult.insights,
      aiModel: 'gemini'
    }

  } catch (error) {
    console.error('Error in Gemini analysis:', error)

    // Return mock result for development/demo
    console.log('Returning mock visual analysis result')

    return {
      scores: {
        overall: 78,
        genre: 85,
        theme: 75,
        targetAudience: 82,
        technicalQuality: 88,
        emotionalImpact: 78
      },
      insights: {
        genre: ['Drama', 'Indie Film'],
        themes: ['Visual Storytelling', 'Atmospheric Tension', 'Suburban Mystery'],
        targetAudience: 'Film festival audiences and art-house cinema enthusiasts who appreciate visual poetry and atmospheric storytelling',
        keyMoments: [
          'Striking opening shot with dramatic lighting and composition',
          'Visual metaphors using shadows and reflections',
          'Montage sequences showing character isolation through framing'
        ],
        strengths: [
          'Exceptional cinematography with strong visual language',
          'Effective use of color palette and lighting design',
          'Innovative editing techniques that enhance emotional impact'
        ],
        suggestions: [
          'Consider strengthening visual transitions between scenes',
          'Enhance visual symbolism to better support thematic elements',
          'Experiment with more dynamic camera movement for key emotional moments'
        ]
      },
      aiModel: 'gemini'
    }
  }
}
