import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime'
import type { AIAnalysisResult, VisualAnalysisResult } from './aiAnalyzer.js'

// Validate required AWS environment variables
const AWS_REGION = process.env.AWS_REGION
if (!AWS_REGION) {
  throw new Error('AWS_REGION environment variable is required but not set')
}

const bedrockClient = new BedrockRuntimeClient({
  region: AWS_REGION
})

const MODEL_ID = 'us.deepseek.r1-v1:0' // DeepSeek-R1 inference profile via AWS Bedrock

export async function analyzeWithDeepSeek(
  synopsis: string,
  visualAnalysis: VisualAnalysisResult,
  transcript: string
): Promise<AIAnalysisResult> {
  try {
    console.log('Starting DeepSeek-R1 synthesis analysis via AWS Bedrock')

    const combinedContent = `
Film Synopsis:
${synopsis}

Visual Analysis:
${visualAnalysis.visualAnalysis}

Emotional Tone: ${visualAnalysis.emotionalTone}
Visual Style: ${visualAnalysis.visualStyle}

Key Timestamps:
${visualAnalysis.timestamps.map(t => `${t.time}: ${t.description}`).join('\n')}

Transcript:
${transcript}
    `.trim()

    const prompt = `
You are an expert film critic and festival selector. Analyze the following comprehensive film content that combines synopsis, visual analysis, and transcript data.

CONTENT TO ANALYZE:
${combinedContent}

Please provide a detailed analysis in the following JSON format:
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
    "targetAudience": "detailed description of target audience",
    "keyMoments": ["moment1", "moment2", "moment3"],
    "strengths": ["strength1", "strength2", "strength3"],
    "suggestions": ["suggestion1", "suggestion2"]
  }
}

Guidelines:
- Overall score should reflect festival selection potential
- Be specific and detailed in your analysis
- Consider artistic merit, technical quality, and market potential
- Provide constructive feedback for improvement
- Focus on elements that would matter to festival selectors

Return ONLY valid JSON, no additional text.
    `.trim()

    // For DeepSeek-R1 in AWS Bedrock, use specific prompt format with special tokens
    const formattedPrompt = `<｜begin▁of▁sentence｜><｜User｜>${prompt}<｜Assistant｜><think>\n`

    const requestBody = {
      prompt: formattedPrompt,
      max_tokens: 1500,
      temperature: 0.7,
      top_p: 0.9
    }

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    })

    console.log('Sending request to Bedrock...')
    const response = await bedrockClient.send(command)

    console.log('Raw response received from Bedrock')
    const responseText = new TextDecoder().decode(response.body)
    console.log('Response body:', responseText.substring(0, 500) + '...')

    const responseBody = JSON.parse(responseText)

    // For DeepSeek-R1 models in Bedrock, the response format may vary
    let analysisText: string

    if (responseBody.choices && responseBody.choices[0]) {
      // Standard format
      analysisText = responseBody.choices[0].message?.content || responseBody.choices[0].text || ''
    } else if (responseBody.completions && responseBody.completions[0]) {
      // Alternative format
      analysisText = responseBody.completions[0].data?.text || responseBody.completions[0].text || ''
    } else if (responseBody.text) {
      // Direct text response
      analysisText = responseBody.text
    } else if (responseBody.content) {
      // Content field
      analysisText = responseBody.content
    } else {
      // Fallback to raw response
      analysisText = responseText
    }

    console.log('Extracted analysis text:', analysisText.substring(0, 200) + '...')

    // Parse the JSON response with robust error handling
    let analysisResult: AIAnalysisResult | undefined
    try {
      analysisResult = JSON.parse(analysisText)
      console.log('Successfully parsed JSON response directly')
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError)
      console.error('Raw analysis text:', analysisText.substring(0, 200) + '...')

      // Handle responses that start with <reasoning> tags
      let cleanedText = analysisText.trim()

      // Remove reasoning sections if present
      if (cleanedText.startsWith('<reasoning>')) {
        const reasoningEnd = cleanedText.indexOf('</reasoning>')
        if (reasoningEnd !== -1) {
          cleanedText = cleanedText.substring(reasoningEnd + 13).trim()
          console.log('Removed reasoning section, remaining text:', cleanedText.substring(0, 200) + '...')
        }
      }

      // Try to find JSON content using a simpler approach
      const jsonStart = cleanedText.indexOf('{')
      if (jsonStart !== -1) {
        // Extract everything from the first { to the end
        const potentialJson = cleanedText.substring(jsonStart)

        // Try to find the matching closing brace by counting braces
        let braceCount = 0
        let jsonEnd = -1

        for (let i = 0; i < potentialJson.length; i++) {
          if (potentialJson[i] === '{') braceCount++
          else if (potentialJson[i] === '}') {
            braceCount--
            if (braceCount === 0) {
              jsonEnd = i
              break
            }
          }
        }

        if (jsonEnd !== -1) {
          const jsonString = potentialJson.substring(0, jsonEnd + 1)
          console.log('Extracted potential JSON:', jsonString.substring(0, 300) + '...')

          try {
            const parsedData = JSON.parse(jsonString)

            // Check if it has the expected structure
            if (parsedData.scores && parsedData.insights) {
              analysisResult = parsedData
              console.log('Successfully parsed complete JSON structure')
            } else if (parsedData.overall !== undefined && parsedData.genre !== undefined && parsedData.insights) {
              // Handle malformed response where scores are at root level
              console.log('Detected malformed response structure, restructuring scores...')
              analysisResult = {
                scores: {
                  overall: parsedData.overall,
                  genre: parsedData.genre,
                  theme: parsedData.theme,
                  targetAudience: parsedData.targetAudience,
                  technicalQuality: parsedData.technicalQuality,
                  emotionalImpact: parsedData.emotionalImpact
                },
                insights: parsedData.insights,
                aiModel: 'deepseek'
              }
              console.log('Successfully restructured and parsed malformed JSON')
            } else {
              throw new Error('Parsed JSON does not have expected structure')
            }
          } catch (jsonError: unknown) {
            const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown parsing error'
            console.error('Failed to parse extracted JSON:', errorMessage)
            throw new Error(`JSON parsing failed: ${errorMessage}`)
          }
        } else {
          throw new Error('Could not find matching closing brace for JSON')
        }
      } else {
        throw new Error(`No JSON opening brace found in response: ${cleanedText.substring(0, 200)}...`)
      }
    }

    if (!analysisResult) {
      throw new Error('Failed to parse analysis result from model response')
    }

    return {
      scores: analysisResult.scores,
      insights: analysisResult.insights,
      aiModel: 'deepseek'
    }

  } catch (error) {
    console.error('Error in DeepSeek-R1 analysis:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Provide specific error messages for common issues
    if (errorMessage.includes('credentials')) {
      throw new Error('AWS credentials not configured properly')
    }

    if (errorMessage.includes('Access Denied')) {
      throw new Error('Access denied to AWS Bedrock. Please check IAM permissions')
    }

    if (errorMessage.includes('ValidationException')) {
      throw new Error('Invalid request to AWS Bedrock. Please check model configuration')
    }

    throw new Error(`DeepSeek-R1 analysis failed: ${errorMessage}`)
  }
}
