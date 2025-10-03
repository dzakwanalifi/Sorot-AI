import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIAnalysisResult, VisualAnalysisResult } from './aiAnalyzer.js'

// Validate Gemini API key is present
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required but not set')
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })


export async function analyzeWithGeminiVisual(trailerUrl: string): Promise<VisualAnalysisResult> {
  try {
    console.log('Starting Gemini visual analysis for trailer:', trailerUrl)

    const prompt = `
You are an expert film critic specializing in visual storytelling analysis. Analyze this film trailer's visual elements comprehensively.

Focus on:
1. VISUAL STORYTELLING: Describe key visual elements, color palette, composition, camera work, editing rhythm
2. EMOTIONAL TONE: Analyze mood, atmosphere, character expressions, lighting effects
3. CINEMATOGRAPHIC TECHNIQUES: Camera angles, movement, transitions, visual effects
4. KEY SCENES: Provide timestamps (MM:SS format) for important visual moments
5. VISUAL STYLE: Overall aesthetic, genre indicators, production quality

Return a detailed analysis in the following JSON format:

{
  "visualAnalysis": "Comprehensive description of visual storytelling and cinematography",
  "timestamps": [
    {"time": "00:05", "description": "Opening scene visual description"},
    {"time": "00:15", "description": "Key emotional moment description"},
    {"time": "00:30", "description": "Climax scene visual description"}
  ],
  "emotionalTone": "Overall emotional atmosphere and mood",
  "visualStyle": "Cinematography style, color palette, production aesthetic"
}

Guidelines:
- Use timestamps in MM:SS format for specific moments
- Focus on visual elements that reveal story, character, and theme
- Analyze how cinematography supports emotional narrative
- Consider festival appeal based on visual innovation and artistry

Return ONLY valid JSON, no additional text.
    `.trim()

    console.log('Calling Gemini API for visual analysis')

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

    console.log('Received visual analysis from Gemini, length:', analysisText.length)
    console.log('Raw Gemini response preview:', analysisText.substring(0, 500) + '...')

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = analysisText.trim()

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // If still starts with backtick, try to find JSON within
    if (jsonText.includes('`')) {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      }
    }

    console.log('Extracted JSON text:', jsonText.substring(0, 200) + '...')

    // Parse the JSON response
    const analysisResult = JSON.parse(jsonText)

    return {
      visualAnalysis: analysisResult.visualAnalysis,
      timestamps: analysisResult.timestamps || [],
      emotionalTone: analysisResult.emotionalTone,
      visualStyle: analysisResult.visualStyle
    }

  } catch (error) {
    console.error('Error in Gemini visual analysis:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Provide specific error messages
    if (errorMessage.includes('API key not valid')) {
      throw new Error('Invalid Gemini API key. Please check your API key configuration')
    }

    if (errorMessage.includes('QUOTA_EXCEEDED')) {
      throw new Error('Gemini API quota exceeded. Please check your usage limits')
    }

    if (errorMessage.includes('RATE_LIMIT_EXCEEDED')) {
      throw new Error('Gemini API rate limit exceeded. Please try again later')
    }

    throw new Error(`Gemini visual analysis failed: ${errorMessage}`)
  }
}
