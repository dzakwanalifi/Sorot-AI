// Removed HTTP server imports - now using Lambda RIC directly
import { handler as analyzeHandler } from './handlers/analyze-film.js'
import { handler as statusHandler } from './handlers/analysis-status.js'
import { startLoggingContext, logInfo, logError } from './utils/logger.js'

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

// AWS Lambda handler function for RIC
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    // Start logging context for this request
    startLoggingContext(context.awsRequestId)

    const requestPath = (event as any).rawPath || event.path
    const httpMethod = (event as any).requestContext?.http?.method || event.httpMethod
    logInfo(`Incoming ${httpMethod} request to ${requestPath}`)
    logInfo(`Full event:`, JSON.stringify(event, null, 2))

    let result: APIGatewayProxyResult

    // Route requests
    if (requestPath === '/analyze' && httpMethod === 'POST') {
      result = await analyzeHandler(event, context)
    } else if (requestPath === '/status' && httpMethod === 'GET') {
      result = await statusHandler(event, context)
    } else {
      result = {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not found' })
      }
    }

    // Return result directly (Lambda RIC will handle the response)
    return result

  } catch (error) {
    logError('Handler error occurred', error instanceof Error ? error : new Error(String(error)))

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      })
    }
  }
}
