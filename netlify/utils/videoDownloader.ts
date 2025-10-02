import { exec } from 'yt-dlp-exec'
import { promises as fs } from 'fs'
import fsSync from 'fs'
import path from 'path'
import os from 'os'

const TEMP_DIR = os.tmpdir()

// Configure yt-dlp and ffmpeg binary paths for Netlify functions
const YTDLP_BINARY_PATHS = [
  // Netlify dev serve location
  path.join(process.cwd(), '.netlify', 'functions-serve', 'analyze-film', 'netlify', 'bin', os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'),
  // Original local development location
  path.join(process.cwd(), 'bin', os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'),
  // Netlify functions location
  path.join(process.cwd(), 'netlify', 'functions', 'bin', os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp')
]

const FFMPEG_BINARY_PATHS = [
  // Netlify dev serve location
  path.join(process.cwd(), '.netlify', 'functions-serve', 'analyze-film', 'netlify', 'bin', os.platform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'),
  // Original local development location
  path.join(process.cwd(), 'bin', os.platform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'),
  // Netlify functions location
  path.join(process.cwd(), 'netlify', 'functions', 'bin', os.platform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
]

// Check if custom binary exists in any of the possible locations, otherwise use system binary
function getYtDlpBinaryPath(): string | undefined {
  for (const binaryPath of YTDLP_BINARY_PATHS) {
    if (fsSync.existsSync(binaryPath)) {
      console.log(`Found yt-dlp binary at: ${binaryPath}`)
      return binaryPath
    }
  }
  console.log('No custom yt-dlp binary found, will use system PATH')
  return undefined
}

function getFfmpegBinaryPath(): string | undefined {
  for (const binaryPath of FFMPEG_BINARY_PATHS) {
    if (fsSync.existsSync(binaryPath)) {
      console.log(`Found ffmpeg binary at: ${binaryPath}`)
      return binaryPath
    }
  }
  console.log('No custom ffmpeg binary found, will use system PATH')
  return undefined
}

export async function downloadVideoAudio(youtubeUrl: string): Promise<string> {
  let tempFilePath: string | null = null

  try {
    // Validate YouTube URL format first
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/
    if (!youtubeRegex.test(youtubeUrl)) {
      throw new Error('Invalid YouTube URL format')
    }

    // Generate unique filename
    const fileId = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    tempFilePath = path.join(TEMP_DIR, `${fileId}.m4a`)

    console.log('Downloading audio from:', youtubeUrl)
    console.log('Output path:', tempFilePath)

    // Use yt-dlp to download audio only - throw error if fails
    const customBinary = getYtDlpBinaryPath()
    const ffmpegBinary = getFfmpegBinaryPath()

    if (customBinary) {
      // If we have a custom binary, use direct exec with the full path
      const { execSync } = await import('child_process')
      let command = `"${customBinary}" "${youtubeUrl}" --extract-audio --audio-format m4a --audio-quality 128 --output "${tempFilePath}" --no-playlist --quiet`

      // Add ffmpeg location if available
      if (ffmpegBinary) {
        command += ` --ffmpeg-location "${ffmpegBinary}"`
      }

      try {
        execSync(command, { stdio: 'inherit' })
      } catch (error) {
        throw new Error(`Command failed: ${command}\n${(error as Error).message}`)
      }
    } else {
      // Fallback to yt-dlp-exec if no custom binary found
      await exec(youtubeUrl, {
        extractAudio: true,
        audioFormat: 'm4a',
        audioQuality: 128,
        output: tempFilePath,
        noPlaylist: true,
        quiet: true
      })
    }

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

    // Provide specific error messages for common issues
    if (err.message?.includes('Video unavailable')) {
      throw new Error('Video is unavailable or private')
    }

    if (err.message?.includes('Unsupported URL')) {
      throw new Error('Unsupported video URL format')
    }

    if (err.message?.includes('The system cannot find the path specified')) {
      throw new Error('yt-dlp executable not found. Please ensure yt-dlp is installed and accessible in PATH')
    }

    throw new Error(`Failed to download video audio: ${err.message}`)
  }
}

