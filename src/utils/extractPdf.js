export async function extractTextFromPDF(pdfPath) {
  console.log('📂 Looking for PDF at:', pdfPath)
  const pdfExtraction = await import('pdf-extraction')
  const fs = await import('fs/promises')

  console.log('📖 Extracting text from PDF:', pdfPath)
  const buffer = await fs.readFile(pdfPath)

  const extract =
    pdfExtraction.default || pdfExtraction.extract || pdfExtraction
  const data = await extract(buffer, { splitPages: false })

  return cleanText(data.text)
}

function cleanText(rawText) {
  let text = rawText.replace(/^\d+\s*\n/gm, '')
  text = text.replace(/THE POWER OF NOW.*\n/g, '')
  text = text.replace(/Eckhart Tolle.*\n/g, '')
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.replace(/•|\u2022|\u25E6/g, '')
  text = text.replace(/This text downloaded from.*\n/g, '')
  text = text.replace(/spiritual eBooks.*\n/gi, '')
  text = text.replace(/\n{2,}(CHAPTER|Section)/g, '\n\n$1')
  return text.trim()
}
