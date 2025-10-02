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
    const { pdfData, trailerUrl } = body

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

    // Process the film analysis
    console.log('Starting film analysis for:', { trailerUrl, pdfSize: pdfData.length })

    const result = await processFilmAnalysis(pdfData, trailerUrl)

    console.log('Film analysis completed successfully')

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
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
