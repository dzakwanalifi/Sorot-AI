// Shared progress store for analysis tracking
// In production, replace with Redis or database

export interface AnalysisProgress {
  status: 'processing' | 'completed' | 'failed'
  currentStep: number
  totalSteps: number
  stepName: string
  progress: number
  result?: any
  error?: string
}

class ProgressStore {
  private store = new Map<string, AnalysisProgress>()

  updateProgress(analysisId: string, progress: Partial<AnalysisProgress>) {
    const existing = this.store.get(analysisId)
    if (existing) {
      this.store.set(analysisId, { ...existing, ...progress })
    } else {
      this.store.set(analysisId, progress as AnalysisProgress)
    }
  }

  getProgress(analysisId: string): AnalysisProgress | undefined {
    return this.store.get(analysisId)
  }

  setProgress(analysisId: string, progress: AnalysisProgress) {
    this.store.set(analysisId, progress)
  }

  deleteProgress(analysisId: string) {
    this.store.delete(analysisId)
  }

  // Cleanup old entries (in production, this would be handled by TTL)
  cleanup() {
    const now = Date.now()
    for (const [id, progress] of this.store.entries()) {
      // Remove completed/failed analyses older than 1 hour
      if ((progress.status === 'completed' || progress.status === 'failed') &&
          now - parseInt(id.split('-')[1]) > 3600000) {
        this.store.delete(id)
      }
    }
  }
}

export const progressStore = new ProgressStore()

// Helper functions
export function updateProgress(analysisId: string, currentStep: number, stepName: string, progress: number) {
  progressStore.updateProgress(analysisId, {
    status: 'processing',
    currentStep,
    totalSteps: 5,
    stepName,
    progress: Math.round(progress),
  })
}

export function completeProgress(analysisId: string, result: any) {
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
