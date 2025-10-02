import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime'
import type { AIAnalysisResult } from './aiAnalyzer'

// Validate required AWS environment variables
const AWS_REGION = process.env.AWS_REGION
if (!AWS_REGION) {
  throw new Error('AWS_REGION environment variable is required but not set')
}

const bedrockClient = new BedrockRuntimeClient({
  region: AWS_REGION
})

const MODEL_ID = 'openai.gpt-oss-120b-1:0' // OpenAI gpt-oss-120b via AWS Bedrock

export async function analyzeWithOpenAI(
  synopsis: string,
  transcript: string
): Promise<AIAnalysisResult> {
  try {
    console.log('Starting OpenAI analysis via AWS Bedrock')

    const combinedText = `Film Synopsis:\n${synopsis}\n\nTrailer Transcript:\n${transcript}`

    const prompt = `
You are an expert film critic and festival selector. Analyze the following film content and provide a comprehensive evaluation.

CONTENT TO ANALYZE:
${combinedText}

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

    // For OpenAI models in AWS Bedrock, use the standard OpenAI format
    const requestBody = {
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
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

    // For OpenAI models in Bedrock, the response format may vary
    let analysisText: string

    if (responseBody.choices && responseBody.choices[0]) {
      // Standard OpenAI format
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

    // Parse the JSON response
    let analysisResult: AIAnalysisResult
    try {
      analysisResult = JSON.parse(analysisText)
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError)
      console.error('Raw analysis text:', analysisText)

      // If the model didn't return JSON, try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          analysisResult = JSON.parse(jsonMatch[0])
          console.log('Successfully extracted JSON from response')
        } catch (extractError) {
          throw new Error(`Model returned invalid JSON: ${analysisText.substring(0, 200)}...`)
        }
      } else {
        throw new Error(`Model did not return valid JSON: ${analysisText.substring(0, 200)}...`)
      }
    }

    return {
      scores: analysisResult.scores,
      insights: analysisResult.insights,
      aiModel: 'openai'
    }

  } catch (error) {
    console.error('Error in OpenAI analysis:', error)

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

    throw new Error(`OpenAI analysis failed: ${errorMessage}`)
  }
}
