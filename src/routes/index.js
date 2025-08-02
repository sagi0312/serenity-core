// routes/index.js
import { ChatController } from '../controllers/chatController.js'
import { HealthController } from '../controllers/healthController.js'
import { ValidationMiddleware } from '../middleware/validation.js'

export class RouteManager {
  constructor(ragService, healthService) {
    this.chatController = new ChatController(ragService)
    this.healthController = new HealthController(healthService)
    this.validation = new ValidationMiddleware()
  }

  setup(app) {
    // Chat routes
    app.post(
      '/api/seek',
      this.validation.validateChatMessage,
      this.chatController.handleSeek.bind(this.chatController)
    )

    app.get(
      '/api/history',
      this.chatController.getHistory.bind(this.chatController)
    )

    // Health routes
    app.get(
      '/health',
      this.healthController.getHealth.bind(this.healthController)
    )

    app.get(
      '/api/status',
      this.healthController.getDetailedStatus.bind(this.healthController)
    )

    // 404 handler for unmatched routes
    app.use((req, res, next) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
      })
    })
  }
}
