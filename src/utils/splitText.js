import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

export function chunkText(text) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // ~1000 characters per chunk
    chunkOverlap: 200, // 200 characters overlap between chunks
    separators: ['\n\n', '\n', '. ', ' ', ''], // Split by paragraphs first
  })

  return splitter.splitText(text)
}
