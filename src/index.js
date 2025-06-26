import express from 'express'
import session from 'express-session'
import { InferenceClient } from '@huggingface/inference'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { saveMessage } from './utils/history.js'
import { processBook } from './utils/pdfProcessor.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

dotenv.config()

const app = express()
const client = new InferenceClient(process.env.HF_API_KEY)
// get the directory name of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PDF_PATH = path.join(__dirname, '../books/power_of_now.pdf')

// Initialize PDF processing during server startup
let bookChunks = [] // Will store processed chunks
async function initializeApp() {
  try {
    const { chunks, metadata } = await processBook(PDF_PATH)
    bookChunks = chunks // Make available globally

    console.log('✅ Book ready. Metadata:', {
      totalChunks: metadata.totalChunks,
      avgLength: metadata.avgLength,
    })

    // Start server only after processing completes
    app.listen(PORT, () => {
      console.log(`🕯️ Spiritual chat running on port ${PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to initialize:', error)
    process.exit(1) // Crash the app if processing fails
  }
}

// Session configuration (for anonymous user tracking)
app.use(
  session({
    secret: process.env.SESSION_SECRET || uuidv4(),
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400000, // 24 hours
    },
  })
)

// Security headers
app.use(helmet())

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: 'Too many requests. Please wait a moment before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api', limiter)
app.use(express.json({ limit: '1mb' }))

// Generate session ID if doesn't exist
app.use((req, res, next) => {
  if (!req.session.id) {
    req.session.id = uuidv4() // Anonymous unique ID
  }
  next()
})

app.post('/api/seek', async (req, res) => {
  try {
    const { message } = req.body

    // Input validation
    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0
    ) {
      return res.status(400).json({ error: 'Valid message required' })
    }

    if (message.length > 500) {
      return res.status(400).json({
        error: 'Message too long. Please keep it under 500 characters.',
      })
    }

    const response = await client.chatCompletion({
      model: 'HuggingFaceH4/zephyr-7b-beta',
      messages: [
        {
          role: 'system',
          content:
            'You are a wise spiritual guide sharing wisdom from Buddhism, Hinduism, and Taoism. Be gentle and compassionate.',
        },
        { role: 'user', content: message },
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    const wisdom = response.choices[0].message.content.trim()

    // Save to history (fire-and-forget with error handling)
    try {
      await saveMessage(req.session.id, message, wisdom)
    } catch (historyError) {
      console.error('History save failed:', historyError)
      // Continue even if history fails
    }

    res.json({
      reply: wisdom,
      metadata: {
        sessionId: req.session.id,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      error: 'Please try again',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
})

// New endpoint to fetch conversation history
app.get('/api/history', async (req, res) => {
  try {
    const history = await getHistory(req.session.id)
    res.json(history)
  } catch (error) {
    console.error('History fetch failed:', error)
    res.status(500).json({ error: 'Failed to retrieve history' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    sessionCount: req.sessionStore?.length || 'N/A',
  })
})

const PORT = process.env.PORT || 3000

initializeApp()
