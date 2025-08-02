// controllers/healthController.js
export class HealthController {
  constructor(healthService) {
    this.healthService = healthService
  }

  getHealth(req, res, next) {
    try {
      const health = this.healthService.getBasicHealth()
      const status = health.status === 'healthy' ? 200 : 503

      res.status(status).json(health)
    } catch (error) {
      next(error)
    }
  }

  getDetailedStatus(req, res, next) {
    try {
      const status = this.healthService.getDetailedStatus()
      const httpStatus = status.status === 'healthy' ? 200 : 503

      res.status(httpStatus).json(status)
    } catch (error) {
      next(error)
    }
  }
}
