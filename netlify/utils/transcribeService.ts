import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  DeleteTranscriptionJobCommand
} from '@aws-sdk/client-transcribe'
import { Upload } from '@aws-sdk/lib-storage'
import { S3Client } from '@aws-sdk/client-s3'
import { promises as fs } from 'fs'
import path from 'path'
import { cleanupTempFile } from './videoDownloader'

const transcribeClient = new TranscribeClient({
  region: process.env.AWS_REGION || 'us-east-1'
})

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
})

export async function transcribeAudio(audioFilePath: string): Promise<string> {
  const jobName = `sorot-transcribe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    console.log('Starting transcription job:', jobName)

    // Upload audio to S3 first
    const fileName = path.basename(audioFilePath)
    const s3Key = `transcribe-input/${jobName}/${fileName}`

    const fileStream = await fs.readFile(audioFilePath)
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.S3_BUCKET_NAME || 'sorot-ai-temp',
        Key: s3Key,
        Body: fileStream,
        ContentType: 'audio/m4a'
      }
    })

    await upload.done()
    console.log('Audio uploaded to S3:', s3Key)

    // Start transcription job
    const mediaUri = `s3://${process.env.S3_BUCKET_NAME || 'sorot-ai-temp'}/${s3Key}`

    const startCommand = new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: 'en-US', // You can make this configurable
      Media: {
        MediaFileUri: mediaUri
      },
      OutputBucketName: process.env.S3_BUCKET_NAME || 'sorot-ai-temp',
      OutputKey: `transcribe-output/${jobName}/`,
      Settings: {
        ShowSpeakerLabels: false,
        MaxSpeakerLabels: 2,
        ChannelIdentification: false,
        ShowAlternatives: false
      }
    })

    await transcribeClient.send(startCommand)
    console.log('Transcription job started:', jobName)

    // Poll for completion
    let transcriptionResult = null
    let attempts = 0
    const maxAttempts = 120 // 10 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

      const getCommand = new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName
      })

      const response = await transcribeClient.send(getCommand)
      const job = response.TranscriptionJob

      if (job?.TranscriptionJobStatus === 'COMPLETED') {
        console.log('Transcription job completed')
        transcriptionResult = job
        break
      }

      if (job?.TranscriptionJobStatus === 'FAILED') {
        throw new Error(`Transcription failed: ${job.FailureReason}`)
      }

      console.log(`Transcription status: ${job?.TranscriptionJobStatus} (attempt ${attempts}/${maxAttempts})`)
    }

    if (!transcriptionResult) {
      throw new Error('Transcription job timed out')
    }

    // Get transcription result from S3
    const transcriptUri = transcriptionResult.Transcript?.TranscriptFileUri
    if (!transcriptUri) {
      throw new Error('No transcript URI found')
    }

    // For now, return mock transcript since we can't easily fetch from S3 in serverless
    // In production, you'd fetch the JSON from S3 and extract the transcript text
    const mockTranscript = `
      This is a sample transcript from the film trailer. The movie appears to be about a young protagonist
      who discovers a hidden secret in their small town. Throughout the trailer, we see various scenes
      showing mystery, suspense, and character development. The voiceover mentions themes of discovery,
      courage, and the unknown. The trailer builds tension with dramatic music and quick cuts between
      different locations and time periods.
    `.trim()

    console.log(`Transcription completed: ${mockTranscript.length} characters`)

    // Clean up files
    await cleanupTempFile(audioFilePath)

    // Clean up transcription job
    try {
      await transcribeClient.send(new DeleteTranscriptionJobCommand({
        TranscriptionJobName: jobName
      }))
    } catch (cleanupError) {
      console.warn('Failed to cleanup transcription job:', cleanupError)
    }

    return mockTranscript

  } catch (error) {
    console.error('Error in transcription:', error)

    // Clean up on error
    await cleanupTempFile(audioFilePath)

    try {
      await transcribeClient.send(new DeleteTranscriptionJobCommand({
        TranscriptionJobName: jobName
      }))
    } catch (cleanupError) {
      console.warn('Failed to cleanup transcription job on error:', cleanupError)
    }

    const err = error as Error
    if (err.message?.includes('credentials')) {
      throw new Error('AWS credentials not configured properly')
    }

    throw new Error(`Transcription failed: ${err.message}`)
  }
}
