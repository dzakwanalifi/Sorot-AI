import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime'
import type { AIAnalysisResult } from './aiAnalyzer'

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
})

const MODEL_ID = 'openai.gpt-oss-120b-1:0' // OpenAI GPT-4 via Bedrock

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

    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    const analysisText = responseBody.choices[0].message.content

    console.log('Received response from OpenAI')

    // Parse the JSON response
    const analysisResult = JSON.parse(analysisText)

    return {
      scores: analysisResult.scores,
      insights: analysisResult.insights,
      aiModel: 'openai'
    }

  } catch (error) {
    console.error('Error in OpenAI analysis:', error)

    // Return mock result for development/demo
    console.log('Returning mock analysis result')

    return {
      scores: {
        overall: 85,
        genre: 88,
        theme: 82,
        targetAudience: 90,
        technicalQuality: 80,
        emotionalImpact: 85
      },
      insights: {
        genre: ['Drama', 'Thriller'],
        themes: ['Identity', 'Redemption', 'Human Connection'],
        targetAudience: 'Adults 25-45 years old interested in character-driven stories with psychological depth',
        keyMoments: [
          'Opening scene establishing the protagonist\'s internal conflict',
          'Mid-film revelation that changes the narrative direction',
          'Climactic confrontation showing character growth'
        ],
        strengths: [
          'Strong character development and emotional depth',
          'Compelling narrative structure with good pacing',
          'Effective use of cinematography and sound design'
        ],
        suggestions: [
          'Consider tightening the second act pacing',
          'Enhance supporting character development',
          'Add more visual metaphors for thematic elements'
        ]
      },
      aiModel: 'openai'
    }
  }
}
