import { Handler } from '@netlify/functions'
import { progressStore } from '../utils/progressStore'

// Status endpoint for checking analysis progress
export const handler: Handler = async (event) => {
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

    // Check the shared progress store
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
