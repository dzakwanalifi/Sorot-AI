import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnalysisStore } from '@/types/analysis'

const initialState = {
  currentAnalysis: null,
  analysisHistory: [],
  isAnalyzing: false,
  error: null,
  progress: null,
}

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentAnalysis: (analysis) => {
        set({ currentAnalysis: analysis })
      },

      addToHistory: (analysis) => {
        const { analysisHistory } = get()
        const newHistory = [analysis, ...analysisHistory].slice(0, 50) // Keep last 50 analyses
        set({ analysisHistory: newHistory })
      },

      setAnalyzing: (analyzing) => {
        set({ isAnalyzing: analyzing })
      },

      setError: (error) => {
        set({ error })
      },

      setProgress: (progress) => {
        set({ progress })
      },

      clearCurrentAnalysis: () => {
        set({ currentAnalysis: null, error: null, progress: null })
      },

      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'sorot-ai-analysis-store',
      partialize: (state) => ({
        analysisHistory: state.analysisHistory,
        // Don't persist current analysis, analyzing state, error, or progress
      }),
    }
  )
)
