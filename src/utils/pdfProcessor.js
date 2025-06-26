import { extractTextFromPDF } from './extractPdf.js'
import { chunkText } from './splitText.js'

export async function processBook(pdfPath) {
  try {
    const fullText = await extractTextFromPDF(pdfPath)
    const chunks = await chunkText(fullText)

    const totalChunks = chunks.length
    const avgLength = Math.round(
      chunks.reduce((sum, c) => sum + c.length, 0) / totalChunks
    )

    return {
      chunks,
      metadata: {
        originalLength: fullText.length,
        totalChunks,
        avgLength,
      },
    }
  } catch (error) {
    console.error('PDF processing failed:', error)
    throw error
  }
}
