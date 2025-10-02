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

// Server-Sent Events for real-time progress updates
// Note: AWS Lambda has limitations with true streaming,
// so this implements a hybrid approach with fast reconnects
export const handler = async (event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
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
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const analysisId = event.queryStringParameters?.id
    if (!analysisId) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Analysis ID required' })
      }
    }

    const progress = progressStore.getProgress(analysisId)
    if (!progress) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Analysis not found' })
      }
    }

    // Format as SSE data with proper SSE format
    const sseData = [
      `event: progress`,
      `id: ${Date.now()}`,
      `data: ${JSON.stringify(progress)}`,
      `` // Empty line to end the event
    ].join('\n')

    return {
      statusCode: 200,
      headers,
      body: sseData
    }

  } catch (error) {
    console.error('Error streaming progress:', error)

    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      })
    }
  }
}
