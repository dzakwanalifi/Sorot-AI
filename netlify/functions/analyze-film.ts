import { Handler } from '@netlify/functions'
import { processFilmAnalysis } from '../utils/filmAnalysisProcessor'
import { progressStore, updateProgress, completeProgress, failProgress } from '../utils/progressStore'

// Status endpoint for checking analysis progress
export const statusHandler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const analysisId = event.queryStringParameters?.id
    if (!analysisId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Analysis ID required' })
      }
    }

    const progress = progressStore.getProgress(analysisId)
    if (!progress) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Analysis not found' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: progress
      })
    }

  } catch (error) {
    console.error('Error checking analysis status:', error)

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

  // Handle GET requests for status checking
  if (event.httpMethod === 'GET') {
    const analysisId = event.queryStringParameters?.id
    if (!analysisId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Analysis ID required' })
      }
    }

    const progress = progressStore.getProgress(analysisId)
    if (!progress) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Analysis not found' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: progress
      })
    }
  }

  // Only allow POST requests for analysis
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

    // Generate unique analysis ID
    const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Initialize progress
    updateProgress(analysisId, 1, 'Processing PDF', 0)

    // Start analysis asynchronously
    processFilmAnalysis(pdfData, trailerUrl, inputType, (step, stepName, progress) => {
      updateProgress(analysisId, step, stepName, progress)
    }).then((result) => {
      completeProgress(analysisId, result)
    }).catch((error) => {
      console.error('Film analysis failed:', error)
      failProgress(analysisId, (error as Error).message)
    })

    // Return analysis ID immediately
    console.log('Film analysis started with ID:', analysisId)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          analysisId,
          status: 'processing',
          message: 'Analysis started successfully'
        }
      })
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
