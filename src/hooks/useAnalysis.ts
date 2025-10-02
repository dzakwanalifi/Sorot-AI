import { useState, useCallback } from 'react'

export interface AnalysisState {
  isAnalyzing: boolean
  progress: number
  currentStep: string
  error: string | null
  results: any | null
}

export const useAnalysis = () => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    error: null,
    results: null,
  })

  const startAnalysis = useCallback((initialStep = 'Initializing analysis...') => {
    setAnalysisState({
      isAnalyzing: true,
      progress: 0,
      currentStep: initialStep,
      error: null,
      results: null,
    })
  }, [])

  const updateProgress = useCallback((progress: number, step: string) => {
    setAnalysisState(prev => ({
      ...prev,
      progress: Math.min(progress, 100),
      currentStep: step,
    }))
  }, [])

  const setError = useCallback((error: string) => {
    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: false,
      error,
      progress: 0,
    }))
  }, [])

  const setResults = useCallback((results: any) => {
    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: false,
      progress: 100,
      currentStep: 'Analysis completed',
      results,
    }))
  }, [])

  const resetAnalysis = useCallback(() => {
    setAnalysisState({
      isAnalyzing: false,
      progress: 0,
      currentStep: '',
      error: null,
      results: null,
    })
  }, [])

  return {
    ...analysisState,
    startAnalysis,
    updateProgress,
    setError,
    setResults,
    resetAnalysis,
  }
}
