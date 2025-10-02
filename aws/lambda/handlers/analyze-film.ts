// AWS Lambda types
interface APIGatewayProxyEvent {
  httpMethod: string
  path: string
  queryStringParameters?: Record<string, string>
  headers?: Record<string, string>
  body?: string | null
  requestContext: {
    requestId: string
  }
}

interface APIGatewayProxyResult {
  statusCode: number
  headers?: Record<string, string>
  body?: string
}

interface Context {
  callbackWaitsForEmptyEventLoop: boolean
  functionName: string
  functionVersion: string
  invokedFunctionArn: string
  memoryLimitInMB: string
  awsRequestId: string
  logGroupName: string
  logStreamName: string
  identity?: unknown
  clientContext?: unknown
  getRemainingTimeInMillis: () => number
  done: () => void
  fail: () => void
  succeed: () => void
}

import { config } from 'dotenv'
import { processFilmAnalysis } from '../utils/filmAnalysisProcessor.js'
import { progressStore, updateProgress, completeProgress, failProgress } from '../utils/progressStore.js'

// Load environment variables
config()

// Film analysis endpoint
export const handler = async (event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {
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
    console.log(`Checking progress for analysis ${analysisId}:`, progress ? 'found' : 'not found')
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

    // Initialize progress immediately
    updateProgress(analysisId, 1, 'Processing PDF', 0)

    // Start analysis asynchronously
    processFilmAnalysis(pdfData, trailerUrl, inputType, (step, stepName, progress) => {
      updateProgress(analysisId, step, stepName, progress)
    }).then((result) => {
      completeProgress(analysisId, result as unknown as Record<string, unknown>)
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
