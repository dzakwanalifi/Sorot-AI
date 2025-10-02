import { extractText } from 'unpdf'

export async function extractTextFromPDF(pdfData: string): Promise<string> {
  try {
    // Convert base64 to Uint8Array
    const pdfBuffer = Buffer.from(pdfData, 'base64')

    console.log('Processing PDF buffer of size:', pdfBuffer.length)

    // Extract text using unpdf
    const result = await extractText(pdfBuffer, {
      mergePages: true
    })
    const text = result.text

    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in PDF')
    }

    // Clean up the extracted text
    const cleanedText = text
      .replace(/\n+/g, ' ')        // Replace multiple newlines with single space
      .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
      .trim()

    console.log(`Extracted ${cleanedText.length} characters from PDF`)

    if (cleanedText.length < 50) {
      console.warn('Warning: Extracted text is very short, might be image-based PDF')
    }

    return cleanedText

  } catch (error) {
    console.error('Error extracting text from PDF:', error)

    const err = error as Error
    if (err.message?.includes('Invalid PDF')) {
      throw new Error('Invalid PDF file format')
    }

    if (err.message?.includes('Encrypted PDF')) {
      throw new Error('PDF is password-protected and cannot be processed')
    }

    throw new Error(`Failed to extract text from PDF: ${err.message}`)
  }
}
