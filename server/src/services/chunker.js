import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 150,
  separators: ['\n\n', '\n', '. ', ' ', ''],
})

export async function createChunks(pages) {
  const chunks = []

  for (const page of pages) {
    if (!page.text.trim()) continue

    const pageChunks = await splitter.splitText(page.text)
    for (const text of pageChunks) {
      chunks.push({
        text,
        pageNumber: page.pageNumber,
        chunkIndex: chunks.length,
      })
    }
  }

  return chunks
}
