// index.js
import express from 'express'
import dotenv from 'dotenv'
import { AppConfig } from './config/app.js'
import { MiddlewareManager } from './middleware/index.js'
import { RouteManager } from './routes/index.js'
import { RAGService } from './services/ragService.js'
import { HealthService } from './services/healthService.js'
import { ErrorHandler } from './middleware/errorHandler.js'
import { Logger } from './utils/logger.js'

// Load environment variables
dotenv.config()

class SpiritualChatApp {
  constructor() {
    this.app = express()
    this.config = new AppConfig()
    this.logger = new Logger()
    this.ragService = new RAGService(this.config.pdfPath, this.logger)
    this.healthService = new HealthService(this.ragService)
    this.middlewareManager = new MiddlewareManager(this.config)
    this.routeManager = new RouteManager(this.ragService, this.healthService)
    this.errorHandler = new ErrorHandler(this.logger)
  }

  async initialize() {
    try {
      this.logger.info('🚀 Initializing Spiritual Chat Application...')

      // Initialize RAG system first
      await this.ragService.initialize()

      // Setup middleware
      this.middlewareManager.setup(this.app)

      // Setup routes
      this.routeManager.setup(this.app)

      // Setup error handling (must be last)
      this.errorHandler.setup(this.app)

      this.logger.info('✅ Application initialized successfully')

      return this
    } catch (error) {
      this.logger.error('❌ Failed to initialize application:', error)
      throw error
    }
  }

  async start() {
    try {
      const server = this.app.listen(this.config.port, () => {
        this.logger.info(
          `🕯️ Spiritual chat server running on port ${this.config.port}`
        )
        this.logger.info(
          `📚 RAG system ready with ${this.ragService.getChunkCount()} chunks`
        )
      })

      // Graceful shutdown
      this.setupGracefulShutdown(server)

      return server
    } catch (error) {
      this.logger.error('❌ Failed to start server:', error)
      process.exit(1)
    }
  }

  setupGracefulShutdown(server) {
    const shutdown = signal => {
      this.logger.info(`📴 Received ${signal}. Shutting down gracefully...`)

      server.close(() => {
        this.logger.info('✅ Server closed')
        this.ragService.cleanup()
        process.exit(0)
      })
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  }
}

// Application entry point
async function main() {
  try {
    const app = new SpiritualChatApp()
    await app.initialize()
    await app.start()
  } catch (error) {
    console.error('💥 Application startup failed:', error)
    process.exit(1)
  }
}

// Start the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { SpiritualChatApp }
