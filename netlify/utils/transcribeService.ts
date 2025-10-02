import { promises as fs } from 'fs'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Validate Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required but not set')
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

export async function transcribeAudio(audioFilePath: string): Promise<string> {
  try {
    console.log('Starting Gemini audio transcription...')

    // Read the audio file
    const audioBuffer = await fs.readFile(audioFilePath)
    const audioSize = audioBuffer.length
    console.log(`Audio file size: ${audioSize} bytes (${(audioSize / 1024 / 1024).toFixed(2)} MB)`)

    // Check file size limit (20MB for inline)
    if (audioSize > 20 * 1024 * 1024) {
      console.warn('Audio file too large for inline processing, attempting file upload...')

      // For files >20MB, we'd need to upload to Google AI Studio first
      // For now, fall back to basic analysis
      await fs.unlink(audioFilePath).catch(() => {}) // cleanup
      return 'Audio transcription unavailable - file too large for current implementation.'
    }

    // Determine MIME type based on file extension
    const fileExtension = audioFilePath.split('.').pop()?.toLowerCase()
    let mimeType = 'audio/mpeg' // default to MP3

    switch (fileExtension) {
      case 'wav':
        mimeType = 'audio/wav'
        break
      case 'm4a':
        mimeType = 'audio/mp4'
        break
      case 'aac':
        mimeType = 'audio/aac'
        break
      case 'ogg':
        mimeType = 'audio/ogg'
        break
      case 'flac':
        mimeType = 'audio/flac'
        break
    }

    console.log(`Using MIME type: ${mimeType}`)

    const prompt = `Please transcribe this audio file. Provide only the spoken text content, no additional commentary or formatting. If there is no speech or the audio is unclear, indicate that clearly.`

    console.log('Sending audio to Gemini for transcription...')
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: audioBuffer.toString('base64'),
          mimeType: mimeType
        }
      }
    ])

    const response = await result.response
    const transcript = response.text().trim()

    console.log(`Transcription completed: ${transcript.length} characters`)

    // Clean up the audio file
    await fs.unlink(audioFilePath).catch(cleanupError => {
      console.warn('Failed to cleanup audio file:', cleanupError)
    })

    return transcript

  } catch (error) {
    console.error('Gemini transcription failed:', error)

    // Clean up the audio file on error
    await fs.unlink(audioFilePath).catch(() => {})

    // Provide fallback transcript for visual analysis
    console.log('Using fallback transcript for visual analysis only')
    return 'Audio transcription unavailable. Using visual analysis only.'
  }
}
