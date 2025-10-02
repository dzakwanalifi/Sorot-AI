import { createServer, IncomingMessage, ServerResponse } from 'http'
import { handler as analyzeHandler } from './handlers/analyze-film.js'
import { handler as statusHandler } from './handlers/analysis-status.js'

// AWS Lambda event interface
interface LambdaEvent {
  httpMethod: string
  path: string
  queryStringParameters?: Record<string, string>
  headers?: Record<string, string>
  body?: string | null
  requestContext: {
    requestId: string
  }
}

// AWS Lambda Runtime API server
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    // Parse request
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const method = req.method || 'GET'

    // Collect request body
    let body = ''
    for await (const chunk of req) {
      body += chunk
    }

    // Create Lambda event object
    const event = {
      httpMethod: method,
      path: url.pathname,
      queryStringParameters: Object.fromEntries(url.searchParams),
      headers: req.headers,
      body: body || null,
      requestContext: {
        requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    }

    let result: any

    // Route requests
    if (url.pathname === '/analyze' && method === 'POST') {
      result = await analyzeHandler(event as any, {} as any)
    } else if (url.pathname === '/status' && method === 'GET') {
      result = await statusHandler(event as any, {} as any)
    } else {
      result = {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not found' })
      }
    }

    // Send response
    if (result && typeof result === 'object') {
      res.statusCode = result.statusCode || 200

      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, value as string)
        })
      }

      res.end(result.body || '')
    } else {
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }

  } catch (error) {
    console.error('Server error:', error)
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
