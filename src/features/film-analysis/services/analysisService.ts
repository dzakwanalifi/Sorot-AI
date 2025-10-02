import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG, ERROR_MESSAGES } from '../../../constants'
import { AnalysisScores, AnalysisInsights, FilmSynopsis } from '../../../core/domain'

export interface AnalysisResult {
  success: boolean
  scores?: AnalysisScores
  insights?: AnalysisInsights
  aiModel?: 'deepseek' | 'gemini'
  error?: string
  metadata?: {
    processingTime: number
    tokensUsed?: number
    model: string
  }
}

/**
 * Analyze film using DeepSeek-R1 via AWS Bedrock
 */
export async function analyzeWithDeepSeek(
  synopsis: FilmSynopsis,
  transcript: string
): Promise<AnalysisResult> {
  const startTime = Date.now()

  try {
    console.log('🤖 Starting DeepSeek-R1 analysis via Bedrock...')

    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })

    const prompt = createAnalysisPrompt(synopsis, transcript)

    const command = new InvokeModelCommand({
      modelId: AI_CONFIG.DEEPSEEK_MODEL,
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert film critic and festival selector. Analyze films based on artistic merit, storytelling, and festival potential.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: AI_CONFIG.MAX_TOKENS,
        temperature: 0.7
      }),
      contentType: 'application/json',
      accept: 'application/json'
    })

    const response = await client.send(command)
    const result = JSON.parse(new TextDecoder().decode(response.body))

    if (!result.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from DeepSeek-R1 model')
    }

    const analysisText = result.choices[0].message.content
    const analysis = parseAnalysisResponse(analysisText)

    const processingTime = Date.now() - startTime

    console.log('✅ DeepSeek-R1 analysis completed', {
      processingTime,
      model: AI_CONFIG.DEEPSEEK_MODEL
    })

    return {
      success: true,
      ...analysis,
      aiModel: 'deepseek',
      metadata: {
        processingTime,
        tokensUsed: result.usage?.total_tokens,
        model: AI_CONFIG.DEEPSEEK_MODEL
      }
    }

  } catch (error) {
    console.error('❌ DeepSeek-R1 analysis failed:', error)

    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown DeepSeek-R1 analysis error'

    return {
      success: false,
      error: `${ERROR_MESSAGES.ANALYSIS_FAILED}: ${errorMessage}`,
      metadata: {
        processingTime: Date.now() - startTime,
        model: AI_CONFIG.DEEPSEEK_MODEL
      }
    }
  }
}

/**
 * Analyze film using Gemini 2.5 Flash-Lite (visual analysis fallback)
 */
export async function analyzeWithGemini(
  synopsis: FilmSynopsis,
  transcript: string,
  trailerUrl: string
): Promise<AnalysisResult> {
  const startTime = Date.now()

  try {
    console.log('🤖 Starting Gemini visual analysis...')

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: AI_CONFIG.GEMINI_MODEL })

    // Extract YouTube video ID
    const videoIdMatch = trailerUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    const videoId = videoIdMatch ? videoIdMatch[1] : null

    if (!videoId) {
      throw new Error('Could not extract YouTube video ID')
    }

    const prompt = createVisualAnalysisPrompt(synopsis, transcript, videoId)

    // For YouTube URLs, pass them directly to Gemini
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
    const analysis = parseAnalysisResponse(analysisText)

    const processingTime = Date.now() - startTime

    console.log('✅ Gemini analysis completed', {
      processingTime,
      model: AI_CONFIG.GEMINI_MODEL
    })

    return {
      success: true,
      ...analysis,
      aiModel: 'gemini',
      metadata: {
        processingTime,
        model: AI_CONFIG.GEMINI_MODEL
      }
    }

  } catch (error) {
    console.error('❌ Gemini analysis failed:', error)

    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown Gemini analysis error'

    return {
      success: false,
      error: `${ERROR_MESSAGES.ANALYSIS_FAILED}: ${errorMessage}`,
      metadata: {
        processingTime: Date.now() - startTime,
        model: AI_CONFIG.GEMINI_MODEL
      }
    }
  }
}

/**
 * Main analysis function with intelligent routing
 */
export async function analyzeFilm(
  synopsis: FilmSynopsis,
  transcript: string,
  trailerUrl: string
): Promise<AnalysisResult> {
  console.log('🎬 Starting film analysis...')

  // Check transcript quality to decide which model to use
  const transcriptWords = transcript.split(/\s+/).filter(word => word.length > 0).length

  console.log(`📊 Transcript quality: ${transcriptWords} words`)

  // Use Gemini for visual analysis if transcript is poor (< 50 words)
  if (transcriptWords < AI_CONFIG.TRANSCRIPT_THRESHOLD) {
    console.log('🔄 Using Gemini for visual analysis (poor transcript)')
    return await analyzeWithGemini(synopsis, transcript, trailerUrl)
  }

  // Use DeepSeek-R1 for text-based analysis (good transcript)
  console.log('🔄 Using DeepSeek-R1 for text analysis (good transcript)')
  const deepseekResult = await analyzeWithDeepSeek(synopsis, transcript)

  // If DeepSeek-R1 fails, fallback to Gemini
  if (!deepseekResult.success) {
    console.log('🔄 DeepSeek-R1 failed, falling back to Gemini...')
    return await analyzeWithGemini(synopsis, transcript, trailerUrl)
  }

  return deepseekResult
}

/**
 * Create analysis prompt for DeepSeek-R1
 */
function createAnalysisPrompt(synopsis: FilmSynopsis, transcript: string): string {
  return `
Analyze this film for festival selection potential. Provide a comprehensive evaluation based on the synopsis and trailer transcript.

SYNOPSIS:
${synopsis.content}

TRAILER TRANSCRIPT:
${transcript}

Provide your analysis in the following JSON format:

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
    "targetAudience": "detailed description based on content and style",
    "keyMoments": ["important moment1", "important moment2", "important moment3"],
    "strengths": ["strength1", "strength2", "strength3"],
    "suggestions": ["suggestion1", "suggestion2"]
  }
}

Guidelines:
- Overall: Artistic merit and festival potential
- Genre: How well it fits and innovates within its genre
- Theme: Depth and relevance of thematic content
- Target Audience: Festival audiences and art-house viewers
- Technical Quality: Cinematography, editing, sound design
- Emotional Impact: Ability to move and engage viewers

Return ONLY valid JSON, no additional text.
  `.trim()
}

/**
 * Create visual analysis prompt for Gemini
 */
function createVisualAnalysisPrompt(synopsis: FilmSynopsis, transcript: string, videoId: string): string {
  return `
You are an expert film critic specializing in visual storytelling analysis. Analyze this film trailer and synopsis for festival selection potential.

SYNOPSIS:
${synopsis.content}

TRANSCRIPT (limited):
${transcript}

TRAILER: https://www.youtube.com/watch?v=${videoId}

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
}

/**
 * Parse analysis response from AI models
 */
function parseAnalysisResponse(responseText: string): { scores: AnalysisScores; insights: AnalysisInsights } {
  try {
    // Clean the response text
    const cleanedText = responseText
      .trim()
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .trim()

    const analysis = JSON.parse(cleanedText)

    return {
      scores: analysis.scores,
      insights: analysis.insights
    }
  } catch (error) {
    console.error('❌ Failed to parse analysis response:', error)
    throw new Error('Invalid analysis response format')
  }
}
