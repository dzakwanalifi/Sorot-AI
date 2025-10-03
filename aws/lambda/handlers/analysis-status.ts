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

import { progressStore } from '../utils/progressStore.js'

// Status endpoint for checking analysis progress
export const handler = async (event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Get HTTP method from API Gateway v2 format
  const httpMethod = (event as any).requestContext?.http?.method || event.httpMethod

  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // Only allow GET requests
  if (httpMethod !== 'GET') {
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
    console.log(`Checking progress for analysis ${analysisId}:`, progress ? 'found' : 'not found')
    if (progress) {
      console.log(`Progress status: ${progress.status}, step: ${progress.currentStep}/${progress.totalSteps}, progress: ${progress.progress}%`)
    }
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
