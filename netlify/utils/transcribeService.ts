import { promises as fs } from 'fs'

// Validate required AWS environment variables
const AWS_REGION = process.env.AWS_REGION

if (!AWS_REGION) {
  throw new Error('AWS_REGION environment variable is required but not set')
}

export async function transcribeAudio(audioFilePath: string): Promise<string> {
  // Clean up audio file immediately since we're not using S3
  try {
    await fs.unlink(audioFilePath)
    console.log('Cleaned up local audio file:', audioFilePath)
  } catch (cleanupError) {
    console.warn('Failed to cleanup audio file:', cleanupError)
  }

  // Since AWS Transcribe requires S3 for output, and we want to avoid S3 completely,
  // we need to use a different transcription service
  throw new Error('AWS Transcribe requires S3 for output storage. Please implement an alternative transcription service that does not require S3, such as Google Speech-to-Text API or another cloud service.')
}
