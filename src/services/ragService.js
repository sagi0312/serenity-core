// services/ragService.js
import { InferenceClient } from '@huggingface/inference'
import { processBook } from '../utils/pdfProcessor.js'

export class RAGService {
  constructor(pdfPath, logger, config = {}) {
    this.pdfPath = pdfPath
    this.logger = logger
    this.chunks = []
    this.metadata = null
    this.client = new InferenceClient(process.env.HF_API_KEY)

    // Configuration
    this.topK = config.topK || 3
    this.embeddingModel =
      config.embeddingModel || 'sentence-transformers/all-MiniLM-L6-v2'
    this.aiModel = config.aiModel || 'HuggingFaceH4/zephyr-7b-beta'
    this.maxTokens = config.maxTokens || 200
    this.temperature = config.temperature || 0.7
  }

  async initialize() {
    try {
      this.logger.info('📚 Processing PDF and initializing RAG system...')

      const { chunks, metadata } = await processBook(this.pdfPath)
      this.chunks = chunks
      this.metadata = metadata

      this.logger.info('✅ RAG system initialized:', {
        totalChunks: metadata.totalChunks,
        avgLength: metadata.avgLength,
      })

      return this
    } catch (error) {
      this.logger.error('❌ RAG initialization failed:', error)
      throw error
    }
  }

  /**
   * Clean up AI response text
   * @param {string} text - Raw AI response
   * @returns {string} - Cleaned response
   */
  cleanResponse(text) {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Fix sentence spacing
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add spaces between words
      .replace(/\s+([.!?])/g, '$1') // Remove space before punctuation
      .replace(/([.!?]){2,}/g, '$1') // Remove duplicate punctuation
      .trim()
  }

  /**
   * Find relevant chunks using keyword-based similarity
   * @param {string} query - User query
   * @param {number} topK - Number of chunks to return
   * @returns {Array} - Array of relevant chunks
   */
  findRelevantChunks(query, topK = this.topK) {
    if (!this.chunks.length) {
      throw new Error('RAG system not initialized')
    }

    // Tokenize query
    const queryWords = this.tokenize(query)

    // Score each chunk
    const scoredChunks = this.chunks.map(chunk => {
      const score = this.calculateRelevanceScore(queryWords, chunk)
      return { chunk, score }
    })

    // Return top K chunks
    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.chunk)
  }

  /**
   * Calculate relevance score between query and chunk
   * @param {Array} queryWords - Tokenized query words
   * @param {string} chunk - Text chunk
   * @returns {number} - Relevance score
   */
  calculateRelevanceScore(queryWords, chunk) {
    const chunkWords = this.tokenize(chunk)
    const chunkText = chunk.toLowerCase()

    let score = 0

    queryWords.forEach(word => {
      // Exact word match
      if (chunkWords.includes(word)) {
        score += 2
      }
      // Partial match (substring)
      else if (chunkText.includes(word)) {
        score += 1
      }
    })

    // Normalize by query length to prevent bias toward longer queries
    return queryWords.length > 0 ? score / queryWords.length : 0
  }

  /**
   * Tokenize text into relevant words
   * @param {string} text - Input text
   * @returns {Array} - Array of tokens
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2) // Filter out short words
      .filter(word => !this.isStopWord(word))
  }

  /**
   * Check if word is a stop word
   * @param {string} word - Word to check
   * @returns {boolean} - True if stop word
   */
  isStopWord(word) {
    const stopWords = new Set([
      'the',
      'and',
      'but',
      'for',
      'are',
      'with',
      'his',
      'they',
      'this',
      'that',
      'was',
      'will',
      'you',
      'have',
      'can',
      'had',
    ])
    return stopWords.has(word)
  }

  /**
   * Generate AI response using retrieved context
   * @param {string} userMessage - User's message
   * @returns {Object} - AI response with metadata
   */
  async generateResponse(userMessage) {
    try {
      console.log('🔍 RAG: Starting response generation for:', userMessage)

      // Retrieve relevant context
      const relevantChunks = this.findRelevantChunks(userMessage)
      const context = relevantChunks.join('\n\n---\n\n')

      console.log('📚 RAG: Found', relevantChunks.length, 'relevant chunks')
      console.log('📄 RAG: Context length:', context.length, 'characters')

      // Build enhanced prompt
      const systemPrompt = this.buildSystemPrompt(context)

      console.log('🤖 RAG: Sending to AI model...')

      // Generate response with improved parameters
      const response = await this.client.chatCompletion({
        model: this.aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 250, // Increased for better complete responses
        temperature: 0.6, // Lower for more focused responses
        top_p: 0.9, // More focused sampling
        repetition_penalty: 1.1, // Reduce repetition
      })

      const aiResponse = response.choices[0].message.content.trim()

      // Clean up the response
      const cleanedResponse = this.cleanResponse(aiResponse)

      console.log(
        '✅ RAG: AI response generated, length:',
        cleanedResponse.length
      )
      console.log(
        '📝 RAG: First 100 chars:',
        cleanedResponse.substring(0, 100) + '...'
      )

      return {
        reply: cleanedResponse,
        metadata: {
          chunksUsed: relevantChunks.length,
          contextLength: context.length,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error('❌ RAG: Response generation failed:', error)
      this.logger.error('AI response generation failed:', error)
      throw error
    }
  }

  /**
   * Build system prompt with context
   * @param {string} context - Retrieved context
   * @returns {string} - System prompt
   */
  buildSystemPrompt(context) {
    return `You are a wise spiritual guide channeling the wisdom of "The Power of Now" by Eckhart Tolle.

RELEVANT CONTEXT FROM THE BOOK:
${context}

IMPORTANT INSTRUCTIONS:
- Use proper punctuation, grammar, and sentence structure
- Write in complete, well-formed sentences
- Use clear paragraph breaks for readability
- Maintain natural flow and proper spacing
- Draw from the context above when relevant
- Speak conversationally but maintain Tolle's gentle, present-moment focused tone
- Keep responses practical and transformative
- End responses with a complete thought

Format your response as clear, readable text with proper punctuation.`
  }

  /**
   * Get chunk count for health checks
   * @returns {number} - Number of loaded chunks
   */
  getChunkCount() {
    return this.chunks.length
  }

  /**
   * Get metadata for debugging
   * @returns {Object} - RAG system metadata
   */
  getMetadata() {
    return {
      ...this.metadata,
      chunksLoaded: this.chunks.length,
      isInitialized: this.chunks.length > 0,
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.chunks = []
    this.metadata = null
    this.logger.info('🧹 RAG service cleaned up')
  }
}
