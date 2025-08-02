// middleware/index.js
import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { v4 as uuidv4 } from 'uuid'

export class MiddlewareManager {
  constructor(config) {
    this.config = config
  }

  setup(app) {
    // Security headers
    app.use(helmet())

    // CORS
    app.use(cors(this.config.corsConfig))

    // Body parsing
    app.use(express.json({ limit: '1mb' }))
    app.use(express.urlencoded({ extended: true }))

    // Session management
    this.setupSession(app)

    // Rate limiting
    this.setupRateLimit(app)

    // Session ID middleware
    this.setupSessionId(app)

    // Request logging
    this.setupRequestLogging(app)
  }

  setupSession(app) {
    const sessionConfig = {
      ...this.config.sessionConfig,
      secret: this.config.sessionSecret || uuidv4(),
    }

    app.use(session(sessionConfig))
  }

  setupRateLimit(app) {
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindow,
      max: this.config.rateLimitMax,
      message: {
        error: 'Too many requests. Please wait a moment before trying again.',
        retryAfter: Math.ceil(this.config.rateLimitWindow / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      // Custom key generator for better tracking
      keyGenerator: req => {
        return req.session?.id || req.ip
      },
    })

    app.use('/api', limiter)
  }

  setupSessionId(app) {
    app.use((req, res, next) => {
      if (!req.session.id) {
        req.session.id = uuidv4()
      }
      next()
    })
  }

  setupRequestLogging(app) {
    if (this.config.isDevelopment) {
      app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
        next()
      })
    }
  }
}
