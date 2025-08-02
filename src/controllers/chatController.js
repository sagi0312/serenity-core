// controllers/chatController.js
export class ChatController {
  constructor(ragService) {
    this.ragService = ragService
  }

  async handleSeek(req, res, next) {
    try {
      const { message } = req.body
      const sessionId = req.session.id

      // Generate AI response using RAG
      const response = await this.ragService.generateResponse(message)

      // Add session metadata
      response.metadata.sessionId = sessionId

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async getHistory(req, res, next) {
    try {
      const sessionId = req.session.id

      // TODO: Implement history storage/retrieval
      // For now, return empty history
      const history = []

      res.json({
        sessionId,
        history,
        count: history.length,
      })
    } catch (error) {
      next(error)
    }
  }
}
