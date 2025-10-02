// In-memory progress store for analysis tracking
// Note: This approach is less reliable as progress is lost on function restarts
// but works for development/testing without shared storage

export interface AnalysisProgress {
  status: 'processing' | 'completed' | 'failed'
  currentStep: number
  totalSteps: number
  stepName: string
  progress: number
  result?: Record<string, unknown>
  error?: string
}

class InMemoryProgressStore {
  private store = new Map<string, AnalysisProgress>()

  constructor() {
    console.log('ProgressStore initialized (in-memory only)')
  }

  updateProgress(analysisId: string, progress: Partial<AnalysisProgress>) {
    const existing = this.store.get(analysisId)
    if (existing) {
      this.store.set(analysisId, { ...existing, ...progress })
    } else {
      this.store.set(analysisId, progress as AnalysisProgress)
    }
    console.log(`Updated progress for ${analysisId}: step ${progress.currentStep || existing?.currentStep}`)
  }

  getProgress(analysisId: string): AnalysisProgress | undefined {
    return this.store.get(analysisId)
  }

  setProgress(analysisId: string, progress: AnalysisProgress) {
    this.store.set(analysisId, progress)
    console.log(`Set progress for ${analysisId}: ${progress.status}`)
  }

  deleteProgress(analysisId: string) {
    this.store.delete(analysisId)
    console.log(`Deleted progress for ${analysisId}`)
  }

  // Basic cleanup (less aggressive since in-memory)
  cleanup() {
    const now = Date.now()
    let cleaned = 0
    for (const [id, progress] of this.store.entries()) {
      // Remove old entries after 30 minutes
      if ((progress.status === 'completed' || progress.status === 'failed') &&
          now - parseInt(id.split('-')[1]) > 1800000) { // 30 minutes
        this.store.delete(id)
        cleaned++
      }
    }
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} old progress entries`)
    }
  }
}

export const progressStore = new InMemoryProgressStore()

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
  console.log(`Result object keys:`, Object.keys(result))
  console.log(`Result has scores:`, !!result.scores)
  const completedProgress = {
    status: 'completed' as const,
    currentStep: 5,
    totalSteps: 5,
    stepName: 'Analysis Complete',
    progress: 100,
    result,
  }
  console.log(`Setting completed progress:`, completedProgress.status, completedProgress.currentStep, completedProgress.stepName)
  progressStore.setProgress(analysisId, completedProgress)
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
