#!/usr/bin/env node

/* eslint-env node */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { platform, arch } from 'os';

function installFfmpeg(currentPlatform, currentArch) {
  console.log('Installing ffmpeg...');

  let downloadUrl = '';
  let binaryName = 'ffmpeg.exe';

  // Determine the correct ffmpeg binary for the platform
  if (currentPlatform === 'win32') {
    // Use a static build of ffmpeg for Windows
    downloadUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';
    binaryName = 'ffmpeg.exe';
  } else if (currentPlatform === 'linux') {
    downloadUrl = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';
    binaryName = 'ffmpeg';
  } else if (currentPlatform === 'darwin') {
    if (currentArch === 'arm64') {
      downloadUrl = 'https://www.osxexperts.net/ffmpeg7arm.zip';
    } else {
      downloadUrl = 'https://www.osxexperts.net/ffmpeg7.zip';
    }
    binaryName = 'ffmpeg';
  } else {
    throw new Error(`Unsupported platform: ${currentPlatform}-${currentArch}`);
  }

  try {
    // Create bin directory if it doesn't exist
    const binDir = path.join(process.cwd(), 'bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    const binaryPath = path.join(binDir, binaryName);

    console.log(`Downloading ffmpeg from ${downloadUrl}`);
    console.log(`Target path: ${binaryPath}`);

    if (currentPlatform === 'win32') {
      // For Windows, download zip and extract
      const zipPath = path.join(binDir, 'ffmpeg.zip');
      execSync(`powershell -Command "Invoke-WebRequest -Uri '${downloadUrl}' -OutFile '${zipPath}'"`, { stdio: 'inherit' });

      // Extract ffmpeg.exe from zip (it's in the bin folder of the zip)
      execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${binDir}' -Force"`, { stdio: 'inherit' });

      // Find and copy ffmpeg.exe from the extracted folder
      const extractedDir = fs.readdirSync(binDir).find(dir => dir.startsWith('ffmpeg-'));
      if (extractedDir) {
        const ffmpegSrc = path.join(binDir, extractedDir, 'bin', 'ffmpeg.exe');
        if (fs.existsSync(ffmpegSrc)) {
          fs.copyFileSync(ffmpegSrc, binaryPath);
        }
      }

      // Clean up
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      if (extractedDir) {
        execSync(`rmdir /s /q "${path.join(binDir, extractedDir)}"`, { stdio: 'inherit' });
      }
    } else {
      // For Unix-like systems, download and extract
      const archivePath = path.join(binDir, currentPlatform === 'linux' ? 'ffmpeg.tar.xz' : 'ffmpeg.zip');
      execSync(`curl -L -o "${archivePath}" "${downloadUrl}"`, { stdio: 'inherit' });

      if (currentPlatform === 'linux') {
        execSync(`tar -xf "${archivePath}" -C "${binDir}"`, { stdio: 'inherit' });
        // Find the extracted ffmpeg binary
        const extractedDir = fs.readdirSync(binDir).find(dir => dir.includes('ffmpeg'));
        if (extractedDir) {
          const ffmpegSrc = path.join(binDir, extractedDir, 'ffmpeg');
          if (fs.existsSync(ffmpegSrc)) {
            fs.copyFileSync(ffmpegSrc, binaryPath);
            execSync(`chmod +x "${binaryPath}"`, { stdio: 'inherit' });
          }
        }
      } else {
        // macOS
        execSync(`unzip -o "${archivePath}" -d "${binDir}"`, { stdio: 'inherit' });
        const ffmpegSrc = path.join(binDir, 'ffmpeg');
        if (fs.existsSync(ffmpegSrc)) {
          fs.copyFileSync(ffmpegSrc, binaryPath);
          execSync(`chmod +x "${binaryPath}"`, { stdio: 'inherit' });
        }
      }

      // Clean up archive
      if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
    }

    // Test the binary
    const testCommand = currentPlatform === 'win32' ? `"${binaryPath}" -version | findstr "ffmpeg version"` : `"${binaryPath}" -version | head -1`;
    try {
      const version = execSync(testCommand, { encoding: 'utf8' });
      console.log(`ffmpeg installed successfully: ${version.trim()}`);
    } catch (error) {
      console.log('ffmpeg installed but version check failed');
    }

    console.log(`ffmpeg installed successfully to ${binaryPath}`);

    console.log('ffmpeg installation completed successfully');

  } catch (error) {
    console.error('Failed to install ffmpeg:', error.message);
    // Don't exit - ffmpeg is optional, yt-dlp might work without it
  }
}

function installYtDlp() {
  console.log('Installing yt-dlp...');

  const currentPlatform = platform();
  const currentArch = arch();

  let downloadUrl = '';
  let binaryName = 'yt-dlp';

  // Determine the correct binary for the platform
  if (currentPlatform === 'win32') {
    // Windows x64 is the most common, but yt-dlp.exe works on both 32-bit and 64-bit Windows
    downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    binaryName = 'yt-dlp.exe';
  } else if (currentPlatform === 'linux') {
    downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
  } else if (currentPlatform === 'darwin') {
    if (currentArch === 'arm64') {
      downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
    } else {
      downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
    }
  } else {
    throw new Error(`Unsupported platform: ${currentPlatform}-${currentArch}`);
  }

  try {
    // Create bin directory if it doesn't exist
    const binDir = path.join(process.cwd(), 'bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    const binaryPath = path.join(binDir, binaryName);

    console.log(`Downloading yt-dlp from ${downloadUrl}`);
    console.log(`Target path: ${binaryPath}`);

    // Download the binary using platform-specific commands
    if (currentPlatform === 'win32') {
      // Use PowerShell to download on Windows
      execSync(`powershell -Command "Invoke-WebRequest -Uri '${downloadUrl}' -OutFile '${binaryPath}'"`, { stdio: 'inherit' });
    } else {
      // Try curl first, then wget on Unix-like systems
      try {
        execSync(`curl -L -o "${binaryPath}" "${downloadUrl}"`, { stdio: 'inherit' });
      } catch (curlError) {
        console.log('curl failed, trying wget...');
        execSync(`wget -O "${binaryPath}" "${downloadUrl}"`, { stdio: 'inherit' });
      }
    }

    // Make the binary executable on Unix systems
    if (currentPlatform !== 'win32') {
      execSync(`chmod +x "${binaryPath}"`, { stdio: 'inherit' });
    }

    // Test the binary
    const testCommand = currentPlatform === 'win32' ? `"${binaryPath}" --version` : `"${binaryPath}" --version`;
    const version = execSync(testCommand).toString().trim();
    console.log(`yt-dlp installed successfully: ${version}`);

    console.log(`yt-dlp installed successfully to ${binaryPath}`);

    console.log('yt-dlp installation completed successfully');

  } catch (error) {
    console.error('Failed to install yt-dlp:', error.message);
    process.exit(1);
  }
}

// Run the installation if this script is executed directly
installYtDlp();
installFfmpeg(platform(), arch());
