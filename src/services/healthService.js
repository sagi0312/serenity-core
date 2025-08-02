// services/healthService.js
export class HealthService {
  constructor(ragService) {
    this.ragService = ragService
    this.startTime = new Date()
    this.version = '1.0.0'
  }

  getBasicHealth() {
    const isRagReady = this.ragService.getChunkCount() > 0

    return {
      status: isRagReady ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: this.getUptime(),
    }
  }

  getDetailedStatus() {
    const ragMetadata = this.ragService.getMetadata()
    const isRagReady = ragMetadata.isInitialized

    return {
      status: isRagReady ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: this.getUptime(),
      startTime: this.startTime.toISOString(),
      services: {
        rag: {
          status: isRagReady ? 'operational' : 'failed',
          chunksLoaded: ragMetadata.chunksLoaded || 0,
          totalChunks: ragMetadata.totalChunks || 0,
          avgChunkLength: ragMetadata.avgLength || 0,
          originalLength: ragMetadata.originalLength || 0,
        },
        memory: this.getMemoryUsage(),
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          environment: process.env.NODE_ENV || 'development',
        },
      },
    }
  }

  getUptime() {
    const uptimeMs = Date.now() - this.startTime.getTime()
    const uptimeSeconds = Math.floor(uptimeMs / 1000)

    const hours = Math.floor(uptimeSeconds / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const seconds = uptimeSeconds % 60

    return {
      ms: uptimeMs,
      human: `${hours}h ${minutes}m ${seconds}s`,
    }
  }

  getMemoryUsage() {
    const usage = process.memoryUsage()

    return {
      rss: this.formatBytes(usage.rss),
      heapTotal: this.formatBytes(usage.heapTotal),
      heapUsed: this.formatBytes(usage.heapUsed),
      external: this.formatBytes(usage.external),
    }
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'

    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`
  }
}
