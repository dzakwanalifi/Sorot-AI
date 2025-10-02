import { exec } from 'yt-dlp-exec'
import { promises as fs } from 'fs'
import path from 'path'
import { extractYouTubeId, isValidUrl } from '../../../shared/utils'
import { ERROR_MESSAGES } from '../../../constants'

export interface AudioDownloadResult {
  success: boolean
  audioPath?: string
  metadata?: {
    duration: number
    fileSize: number
    format: string
    downloadedAt: Date
  }
  error?: string
}

/**
 * Download audio from YouTube URL
 */
export async function downloadAudioFromYouTube(
  youtubeUrl: string,
  outputDir: string = './temp'
): Promise<AudioDownloadResult> {
  try {
    console.log('🎵 Starting YouTube audio download...', { youtubeUrl })

    // Validate URL
    if (!isValidUrl(youtubeUrl)) {
      return {
        success: false,
        error: 'Invalid YouTube URL format'
      }
    }

    // Extract video ID
    const videoId = extractYouTubeId(youtubeUrl)
    if (!videoId) {
      return {
        success: false,
        error: 'Could not extract YouTube video ID'
      }
    }

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true })

    // Generate output path
    const outputPath = path.join(outputDir, `${videoId}.m4a`)
    const tempPath = path.join(outputDir, `${videoId}_temp.m4a`)

    console.log('📥 Downloading audio...', { videoId, outputPath })

    // Download audio using yt-dlp
    await exec(youtubeUrl, {
      output: tempPath,
      format: 'bestaudio[ext=m4a]/bestaudio',
      audioFormat: 'm4a',
      audioQuality: 128,
      noPlaylist: true,
      maxDownloads: 1,
      noOverwrites: false,
      quiet: true,
      noWarnings: false,
    })

    // Check if file was created
    try {
      const stats = await fs.stat(tempPath)

      if (stats.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      // Move to final location
      await fs.rename(tempPath, outputPath)

      console.log('✅ Audio download completed', {
        size: stats.size,
        path: outputPath
      })

      return {
        success: true,
        audioPath: outputPath,
        metadata: {
          duration: 0, // Will be determined during transcription
          fileSize: stats.size,
          format: 'm4a',
          downloadedAt: new Date()
        }
      }

    } catch (fileError) {
      // Cleanup temp file if it exists
      try {
        await fs.unlink(tempPath)
      } catch {}

      throw new Error('Audio download failed: file not created properly')
    }

  } catch (error) {
    console.error('❌ Audio download failed:', error)

    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown download error'

    return {
      success: false,
      error: `${ERROR_MESSAGES.NETWORK_ERROR}: ${errorMessage}`
    }
  }
}

/**
 * Cleanup temporary audio files
 */
export async function cleanupAudioFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
    console.log('🧹 Cleaned up audio file:', filePath)
  } catch (error) {
    console.warn('⚠️ Failed to cleanup audio file:', filePath, error)
  }
}

/**
 * Validate YouTube URL format
 */
export function validateYouTubeUrl(url: string): { isValid: boolean; videoId?: string; error?: string } {
  if (!isValidUrl(url)) {
    return { isValid: false, error: 'Invalid URL format' }
  }

  const videoId = extractYouTubeId(url)
  if (!videoId) {
    return { isValid: false, error: 'Not a valid YouTube URL' }
  }

  // Additional validation for YouTube domains
  const validDomains = ['youtube.com', 'youtu.be', 'www.youtube.com']
  try {
    const urlObj = new URL(url)
    if (!validDomains.includes(urlObj.hostname)) {
      return { isValid: false, error: 'Not a YouTube URL' }
    }
  } catch {
    return { isValid: false, error: 'Invalid URL structure' }
  }

  return { isValid: true, videoId }
}
