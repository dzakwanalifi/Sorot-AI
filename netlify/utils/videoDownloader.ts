import { exec } from 'yt-dlp-exec'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

const TEMP_DIR = os.tmpdir()

export async function downloadVideoAudio(youtubeUrl: string): Promise<string> {
  let tempFilePath: string | null = null

  try {
    // Generate unique filename
    const fileId = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    tempFilePath = path.join(TEMP_DIR, `${fileId}.m4a`)

    console.log('Downloading audio from:', youtubeUrl)
    console.log('Output path:', tempFilePath)

    // Use yt-dlp to download audio only
    await exec(youtubeUrl, {
      extractAudio: true,
      audioFormat: 'm4a',
      audioQuality: 128,
      output: tempFilePath,
      noPlaylist: true,
      quiet: true
    })

    // Verify file exists and has content
    const stats = await fs.stat(tempFilePath)
    if (stats.size === 0) {
      throw new Error('Downloaded audio file is empty')
    }

    console.log(`Audio downloaded successfully: ${stats.size} bytes`)
    return tempFilePath

  } catch (error) {
    console.error('Error downloading video audio:', error)

    // Clean up temp file if it exists
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath)
      } catch (cleanupError) {
        console.warn('Failed to clean up temp file:', cleanupError)
      }
    }

    const err = error as Error
    if (err.message?.includes('Video unavailable')) {
      throw new Error('Video is unavailable or private')
    }

    if (err.message?.includes('Unsupported URL')) {
      throw new Error('Unsupported video URL format')
    }

    throw new Error(`Failed to download video audio: ${err.message}`)
  }
}

export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
    console.log('Cleaned up temp file:', filePath)
  } catch (error) {
    console.warn('Failed to cleanup temp file:', error)
  }
}
