import { createServer, IncomingMessage, ServerResponse } from 'http'
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

// AWS Lambda Runtime API server
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    // Parse request
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const method = req.method || 'GET'

    // Start logging context for this request
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    startLoggingContext(requestId)

    logInfo(`Incoming ${method} request to ${url.pathname}`)

    // Collect request body
    let body = ''
    for await (const chunk of req) {
      body += chunk
    }

    // Create AWS Lambda API Gateway event object
    const event: APIGatewayProxyEvent = {
      httpMethod: method,
      path: url.pathname,
      queryStringParameters: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(
        Object.entries(req.headers).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(', ') : String(value || '')
        ])
      ),
      body: body || null,
      requestContext: {
        requestId: requestId
      }
    }

    // Create AWS Lambda context
    const context: Context = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'sorot-ai-lambda',
      functionVersion: '1.0.0',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:sorot-ai-lambda',
      memoryLimitInMB: '1024',
      awsRequestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      logGroupName: '/aws/lambda/sorot-ai-lambda',
      logStreamName: '2024/01/01/[$LATEST]abcd1234567890',
      identity: undefined,
      clientContext: undefined,
      getRemainingTimeInMillis: () => 300000,
      done: () => {},
      fail: () => {},
      succeed: () => {}
    }

    let result: APIGatewayProxyResult | void

    // Route requests
    if (url.pathname === '/analyze' && method === 'POST') {
      result = await analyzeHandler(event, context)
    } else if (url.pathname === '/status' && method === 'GET') {
      result = await statusHandler(event, context)
    } else {
      result = {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not found' })
      }
    }

    // Send response
    if (result && typeof result === 'object' && 'statusCode' in result) {
      res.statusCode = result.statusCode || 200

      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, String(value))
        })
      }

      res.end(result.body || '')
    } else {
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }

  } catch (error) {
    logError('Server error occurred', error instanceof Error ? error : new Error(String(error)))
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
})

// Start server on Lambda runtime API port
const port = process.env.PORT || 8080
server.listen(port, () => {
  console.log(`Sorot.AI Lambda container listening on port ${port}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})
