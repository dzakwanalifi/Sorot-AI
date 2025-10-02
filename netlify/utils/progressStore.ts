// Shared progress store for analysis tracking
// Uses file-based persistence for Netlify Functions (simpler approach)

import * as fs from 'fs'
import * as path from 'path'

export interface AnalysisProgress {
  status: 'processing' | 'completed' | 'failed'
  currentStep: number
  totalSteps: number
  stepName: string
  progress: number
  result?: Record<string, unknown>
  error?: string
}

class ProgressStore {
  private store = new Map<string, AnalysisProgress>()
  private storageFile = path.join(process.cwd(), 'progress-store.json')

  constructor() {
    this.loadFromFile()
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf-8')
        const parsed = JSON.parse(data)
        this.store = new Map(Object.entries(parsed))
        console.log(`Loaded ${this.store.size} progress entries from file`)
      }
    } catch (error) {
      console.error('Error loading progress store from file:', error)
    }
  }

  private saveToFile() {
    try {
      const data = Object.fromEntries(this.store)
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Error saving progress store to file:', error)
    }
  }

  updateProgress(analysisId: string, progress: Partial<AnalysisProgress>) {
    const existing = this.store.get(analysisId)
    if (existing) {
      this.store.set(analysisId, { ...existing, ...progress })
    } else {
      this.store.set(analysisId, progress as AnalysisProgress)
    }
    this.saveToFile()
    console.log(`Updated progress for ${analysisId}: step ${progress.currentStep || existing?.currentStep}`)
  }

  getProgress(analysisId: string): AnalysisProgress | undefined {
    return this.store.get(analysisId)
  }

  setProgress(analysisId: string, progress: AnalysisProgress) {
    this.store.set(analysisId, progress)
    this.saveToFile()
    console.log(`Set progress for ${analysisId}: ${progress.status}`)
  }

  deleteProgress(analysisId: string) {
    this.store.delete(analysisId)
    this.saveToFile()
    console.log(`Deleted progress for ${analysisId}`)
  }

  // Cleanup old entries (in production, this would be handled by TTL)
  cleanup() {
    const now = Date.now()
    let cleaned = 0
    for (const [id, progress] of this.store.entries()) {
      // Remove completed/failed analyses older than 1 hour
      if ((progress.status === 'completed' || progress.status === 'failed') &&
          now - parseInt(id.split('-')[1]) > 3600000) {
        this.store.delete(id)
        cleaned++
      }
    }
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} old progress entries`)
      this.saveToFile()
    }
  }
}

export const progressStore = new ProgressStore()

// Helper functions
export function updateProgress(analysisId: string, currentStep: number, stepName: string, progress: number) {
  console.log(`Updating progress for ${analysisId}: step ${currentStep}, ${stepName}, ${progress}%`)
  progressStore.updateProgress(analysisId, {
    status: 'processing',
    currentStep,
    totalSteps: 5,
    stepName,
    progress: Math.round(progress),
  })
}

export function completeProgress(analysisId: string, result: Record<string, unknown>) {
  console.log(`Completing progress for ${analysisId} with result`)
  progressStore.setProgress(analysisId, {
    status: 'completed',
    currentStep: 5,
    totalSteps: 5,
    stepName: 'Analysis Complete',
    progress: 100,
    result,
  })
}

export function failProgress(analysisId: string, error: string) {
  progressStore.setProgress(analysisId, {
    status: 'failed',
    currentStep: 0,
    totalSteps: 5,
    stepName: 'Analysis Failed',
    progress: 0,
    error,
  })
}
