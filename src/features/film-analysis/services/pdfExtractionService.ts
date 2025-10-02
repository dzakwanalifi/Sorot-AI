import { extractText } from 'unpdf'
import { createFilmSynopsis } from '../../../core/domain'
import { ERROR_MESSAGES } from '../../../constants'

export interface PDFExtractionResult {
  success: boolean
  synopsis?: ReturnType<typeof createFilmSynopsis>
  error?: string
  metadata?: {
    pages: number
    textLength: number
    extractedAt: Date
  }
}

/**
 * Extract text content from PDF file
 */
export async function extractTextFromPDF(
  pdfData: string,
  fileName: string
): Promise<PDFExtractionResult> {
  try {
    console.log('🔍 Starting PDF extraction...', { fileName })

    // Convert base64 to Uint8Array
    const pdfBuffer = Uint8Array.from(atob(pdfData), c => c.charCodeAt(0))

    // Extract text using unpdf
    const result = await extractText(pdfBuffer, {
      mergePages: true
    })

    console.log('📄 PDF text extracted')

    // Handle the result structure - text can be string or string array
    let fullText: string
    const textData = (result as { text: string | string[] }).text

    if (typeof textData === 'string') {
      fullText = textData
    } else if (Array.isArray(textData)) {
      fullText = textData.join('\n\n')
    } else {
      fullText = String(textData || '')
    }

    let title = fileName.replace('.pdf', '') // Default title from filename

    // Try to extract title from first few lines
    if (!title || title === 'film_synopsis') {
      const firstLines = fullText.split('\n').slice(0, 3).join(' ')
      if (firstLines.length > 10) {
        title = firstLines.substring(0, 50) + (firstLines.length > 50 ? '...' : '')
      }
    }

    // Clean up extracted text
    fullText = fullText
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    if (!fullText || fullText.length < 50) {
      return {
        success: false,
        error: 'PDF contains insufficient text content for analysis'
      }
    }

    // Use actual page count from result
    const estimatedPages = result.totalPages || Math.max(1, Math.ceil(fullText.length / 2000))

    // Create synopsis object
    const synopsis = createFilmSynopsis(title, fullText, fileName)

    console.log('✅ PDF extraction completed', {
      pages: estimatedPages,
      textLength: fullText.length,
      title: title.substring(0, 30) + '...'
    })

    return {
      success: true,
      synopsis,
      metadata: {
        pages: estimatedPages,
        textLength: fullText.length,
        extractedAt: new Date()
      }
    }

  } catch (error) {
    console.error('❌ PDF extraction failed:', error)

    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown PDF processing error'

    return {
      success: false,
      error: `${ERROR_MESSAGES.FILE_TOO_LARGE}: ${errorMessage}`
    }
  }
}

/**
 * Validate PDF data before extraction
 */
export function validatePDFData(pdfData: string): { isValid: boolean; error?: string } {
  try {
    // Check if it's valid base64
    atob(pdfData)

    // Check minimum size (PDF header should be at least ~100 bytes)
    if (pdfData.length < 100) {
      return { isValid: false, error: 'PDF data too small' }
    }

    // Check if it starts with PDF header
    const decoded = atob(pdfData)
    if (!decoded.startsWith('%PDF-')) {
      return { isValid: false, error: 'Invalid PDF format' }
    }

    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid base64 PDF data'
    }
  }
}
