// middleware/errorHandler.js
export class ErrorHandler {
  constructor(logger) {
    this.logger = logger
  }

  setup(app) {
    // Global error handler (must be last middleware)
    app.use((error, req, res, next) => {
      this.handleError(error, req, res, next)
    })
  }

  handleError(error, req, res, next) {
    // Default to 500 server error
    let status = error.status || error.statusCode || 500
    let message = error.message || 'Internal server error'

    // Log the error
    this.logger.error('Request error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.session?.id,
    })

    // Handle specific error types
    if (error.name === 'ValidationError') {
      status = 400
      message = 'Validation failed'
    } else if (error.name === 'UnauthorizedError') {
      status = 401
      message = 'Unauthorized'
    } else if (error.code === 'ENOENT') {
      status = 404
      message = 'Resource not found'
    }

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development'

    const errorResponse = {
      error: message,
      status,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    }

    // Add debug info in development
    if (isDevelopment) {
      errorResponse.stack = error.stack
      errorResponse.details = error.details || undefined
    }

    res.status(status).json(errorResponse)
  }
}
