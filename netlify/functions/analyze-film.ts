import { Handler } from '@netlify/functions'
import { processFilmAnalysis } from '../utils/filmAnalysisProcessor'

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}')
    const { pdfData, trailerUrl, inputType = 'file' } = body

    // Validate required fields
    if (!pdfData || !trailerUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: pdfData and trailerUrl are required'
        })
      }
    }

    // Validate YouTube URL format
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/
    if (!youtubeRegex.test(trailerUrl)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid YouTube URL format'
        })
      }
    }

    // Process film analysis using real AI services
    console.log('Starting film analysis for:', { trailerUrl, pdfSize: pdfData.length, inputType })
    console.log('Environment check - USE_REAL_APIS:', process.env.USE_REAL_APIS)
    console.log('Environment check - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `Present (${process.env.GEMINI_API_KEY?.substring(0, 20)}...)` : 'Missing')
    console.log('Environment check - AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Present' : 'Missing')
    console.log('All env keys:', Object.keys(process.env).filter(key => key.includes('GEMINI') || key.includes('AWS') || key.includes('USE_REAL')))

    try {
      const analysisResult = await processFilmAnalysis(pdfData, trailerUrl, inputType)

      console.log('Film analysis completed successfully')
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: analysisResult
        })
      }
    } catch (error) {
      console.error('Film analysis failed:', error)
      console.error('Error stack:', (error as Error).stack)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Film analysis failed: ' + (error as Error).message,
          stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
        })
      }
    }

  } catch (error) {
    console.error('Error processing film analysis:', error)

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      })
    }
  }
}
