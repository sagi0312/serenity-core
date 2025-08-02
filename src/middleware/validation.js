// middleware/validation.js
export class ValidationMiddleware {
  validateChatMessage(req, res, next) {
    const { message } = req.body

    // Check if message exists
    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        code: 'MISSING_MESSAGE',
      })
    }

    // Check message type
    if (typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message must be a string',
        code: 'INVALID_MESSAGE_TYPE',
      })
    }

    // Check if message is not empty after trimming
    if (message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message cannot be empty',
        code: 'EMPTY_MESSAGE',
      })
    }

    // Check message length
    if (message.length > 500) {
      return res.status(400).json({
        error: 'Message too long. Please keep it under 500 characters.',
        code: 'MESSAGE_TOO_LONG',
        maxLength: 500,
        currentLength: message.length,
      })
    }

    // Check for minimum meaningful length
    if (message.trim().length < 3) {
      return res.status(400).json({
        error: 'Message must be at least 3 characters long',
        code: 'MESSAGE_TOO_SHORT',
        minLength: 3,
      })
    }

    // Sanitize message (remove excessive whitespace)
    req.body.message = message.trim().replace(/\s+/g, ' ')

    next()
  }

  validateSessionId(req, res, next) {
    if (!req.session?.id) {
      return res.status(400).json({
        error: 'Invalid session',
        code: 'INVALID_SESSION',
      })
    }
    next()
  }
}
