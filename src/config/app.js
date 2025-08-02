// config/app.js
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class AppConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development'
    this.port = parseInt(process.env.PORT) || 3000
    this.isDevelopment = this.env === 'development'
    this.isProduction = this.env === 'production'

    // API Configuration
    this.hfApiKey = process.env.HF_API_KEY
    this.sessionSecret = process.env.SESSION_SECRET
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

    // File paths
    this.pdfPath = path.join(__dirname, '../../books/power_of_now.pdf')

    // Rate limiting
    this.rateLimitWindow = 60 * 1000 // 1 minute
    this.rateLimitMax = 10

    // Session configuration
    this.sessionConfig = {
      secret: this.sessionSecret,
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: this.isProduction,
        maxAge: 86400000, // 24 hours
      },
    }

    // CORS configuration
    this.corsConfig = {
      origin: this.frontendUrl,
      credentials: true,
    }

    // AI Model configuration
    this.aiConfig = {
      model: 'HuggingFaceH4/zephyr-7b-beta',
      maxTokens: 200,
      temperature: 0.7,
      embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
    }

    // Validation
    this.validate()
  }

  validate() {
    const required = ['HF_API_KEY']
    const missing = required.filter(key => !process.env[key])

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      )
    }
  }
}
