import React, { useState } from 'react'
import { FileUploadArea } from '../components/FileUploadArea'
import { TrailerUrlInput } from '../components/TrailerUrlInput'
import { AnalysisProgress } from '../components/AnalysisProgress'
import { AnalysisResults } from '../components/AnalysisResults'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Brain, X } from 'lucide-react'
import { useAnalysisStore } from '@/lib/store'
import { apiClient } from '../../../shared/services'
import { fileToBase64 } from '../../../shared/utils'
import type { FilmAnalysis } from '@/types/analysis'

// API Response types
interface AnalysisStartResponse {
  success: boolean
  data: {
    analysisId: string
    status: string
    message: string
  }
}

interface AnalysisProgressResponse {
  success: boolean
  data: {
    status: 'processing' | 'completed' | 'failed'
    currentStep: number
    totalSteps: number
    stepName: string
    progress: number
    result?: FilmAnalysis
    error?: string
  }
}

export const FilmAnalysisContainer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [synopsisText, setSynopsisText] = useState('')
  const [inputType, setInputType] = useState<'file' | 'text'>('file')
  const [trailerUrl, setTrailerUrl] = useState('')
  const [currentStep, setCurrentStep] = useState<'upload' | 'url' | 'extract' | 'visual' | 'audio' | 'analyze' | 'generate' | 'results'>('upload')

  const { currentAnalysis, isAnalyzing, error, setAnalyzing, setError, setCurrentAnalysis, setProgress, progress } = useAnalysisStore()

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setSynopsisText('') // Clear text if switching to file
    setInputType('file')
    setCurrentStep('url')
  }

  const handleTextSubmit = (text: string) => {
    setSynopsisText(text)
    setSelectedFile(null) // Clear file if switching to text
    setInputType('text')
    setCurrentStep('url')
  }

  const handleUrlSubmit = async (url: string) => {
    setTrailerUrl(url)
    setCurrentStep('extract')
    setAnalyzing(true)
    setError(null)
    setProgress({ stage: 'extract', percentage: 10 })

    try {
      let pdfData: string

      if (inputType === 'file' && selectedFile) {
        // Convert file to base64 for API
        pdfData = await fileToBase64(selectedFile)
      } else if (inputType === 'text' && synopsisText) {
        // For text input, create base64 encoded text
        // Backend will handle text-to-analysis conversion
        pdfData = btoa(synopsisText)
      } else {
        throw new Error('No synopsis provided')
      }

      // Debug: log what we're sending
      console.log('Sending to API:', {
        pdfData: pdfData.substring(0, 100) + '...',
        pdfDataLength: pdfData.length,
        trailerUrl: url,
        inputType
      })

      // Start the analysis
      const response = await apiClient.post<AnalysisStartResponse>('/analyze', {
        pdfData,
        trailerUrl: url,
        inputType
      })

      if (response.success && response.data?.data?.analysisId) {
        const analysisId = response.data.data.analysisId

        // Smart polling with exponential backoff for better performance
        let pollCount = 0
        let pollInterval: NodeJS.Timeout
        let consecutiveErrors = 0
        const maxConsecutiveErrors = 5
        // eslint-disable-next-line prefer-const
        let timeoutId: NodeJS.Timeout | undefined

        // Exponential backoff calculator
        const calculateBackoffDelay = (attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number => {
          const exponentialDelay = baseDelay * Math.pow(2, attempt)
          const jitter = Math.random() * 0.1 * exponentialDelay // Add 10% jitter
          return Math.min(exponentialDelay + jitter, maxDelay)
        }

        const smartPolling = async () => {
          try {
            const statusResponse = await apiClient.get<AnalysisProgressResponse>(`/status?id=${analysisId}`)

            if (statusResponse.success && statusResponse.data?.data) {
              const progress = statusResponse.data.data
              pollCount++
              consecutiveErrors = 0 // Reset error counter on success

              // Map backend step numbers to frontend stage names
              const stageMapping = {
                1: 'extract', // Processing PDF
                2: 'visual', // Visual Analysis (Gemini)
                3: 'audio', // Audio Enhancement (optional)
                4: 'analyze', // AI Synthesis (OpenAI)
                5: 'generate' // Generating Audio Brief
              }

              const stage = stageMapping[progress.currentStep as keyof typeof stageMapping] || 'analyze'

              // Update current step based on backend progress
              const stepMapping = {
                1: 'extract',
                2: 'visual',
                3: 'audio',
                4: 'analyze',
                5: 'generate'
              } as const

              const newCurrentStep = stepMapping[progress.currentStep as keyof typeof stepMapping] || 'analyze'
              if (newCurrentStep !== currentStep) {
                setCurrentStep(newCurrentStep)
              }

              setProgress({
                stage,
                percentage: progress.progress,
                currentStep: progress.currentStep,
                totalSteps: progress.totalSteps
              })

              if (progress.status === 'completed' && progress.result) {
                clearTimeout(pollInterval)
                if (timeoutId) clearTimeout(timeoutId)
                setProgress({ stage: 'complete', percentage: 100 })
                setCurrentAnalysis(progress.result)
                setCurrentStep('results')
                setAnalyzing(false)
                return // Stop polling
              } else if (progress.status === 'failed') {
                clearTimeout(pollInterval)
                if (timeoutId) clearTimeout(timeoutId)
                setError(progress.error || 'Analysis failed')
                setAnalyzing(false)
                return // Stop polling
              }

              // Smart exponential backoff based on progress stage and poll count
              let nextInterval: number

              if (progress.currentStep <= 2) {
                // Early stages (PDF extract, Visual analysis): Fast polling
                nextInterval = calculateBackoffDelay(Math.min(pollCount - 1, 3), 1000, 2000)
              } else if (progress.currentStep <= 4) {
                // Middle stages (Audio, AI synthesis): Medium polling
                nextInterval = calculateBackoffDelay(Math.min(pollCount - 1, 2), 2000, 5000)
              } else {
                // Final stage (Audio generation): Slower polling
                nextInterval = calculateBackoffDelay(Math.min(pollCount - 1, 1), 3000, 8000)
              }

              // Schedule next poll
              pollInterval = setTimeout(smartPolling, nextInterval)
            } else {
              // No progress data received - treat as error
              consecutiveErrors++
              console.warn(`No progress data received (attempt ${consecutiveErrors}/${maxConsecutiveErrors})`)

              if (consecutiveErrors >= maxConsecutiveErrors) {
                clearTimeout(pollInterval)
                if (timeoutId) clearTimeout(timeoutId)
                setError('Connection lost - unable to retrieve analysis progress')
                setAnalyzing(false)
                return
              }

              const retryDelay = calculateBackoffDelay(consecutiveErrors - 1, 2000, 15000)
              pollInterval = setTimeout(smartPolling, retryDelay)
            }
          } catch (pollError) {
            console.error('Error polling status:', pollError)
            consecutiveErrors++

            if (consecutiveErrors >= maxConsecutiveErrors) {
              clearTimeout(pollInterval)
              if (timeoutId) clearTimeout(timeoutId)
              setError(`Failed to check analysis progress: ${pollError instanceof Error ? pollError.message : 'Unknown error'}`)
              setAnalyzing(false)
              return
            }

            // Retry with exponential backoff
            const retryDelay = calculateBackoffDelay(consecutiveErrors - 1, 2000, 15000)
            pollInterval = setTimeout(smartPolling, retryDelay)
          }
        }

        // Start smart polling with a small delay to allow backend to initialize
        setTimeout(() => {
          smartPolling()
        }, 500) // 500ms delay

        // Global timeout after 5 minutes
        timeoutId = setTimeout(() => {
          clearTimeout(pollInterval)
          if (isAnalyzing) {
            setError('Analysis timed out. Please try again.')
            setAnalyzing(false)
          }
        }, 300000) // 5 minutes

      } else {
        throw new Error(response.data?.data?.message || response.error || 'Failed to start analysis')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed. Please try again.'
      setError(errorMessage)
      console.error('Analysis error:', err)
      setAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setSelectedFile(null)
    setSynopsisText('')
    setInputType('file')
    setTrailerUrl('')
    setCurrentStep('upload')
    setCurrentAnalysis(null)
    setError(null)
  }

  // Enhanced Error Handling Functions
  const getErrorMessage = (error: string | null): string => {
    if (!error) return 'An unexpected error occurred'

    const errorLower = error.toLowerCase()

    if (errorLower.includes('network') || errorLower.includes('fetch')) {
      return 'Network connection failed. Please check your internet connection and try again.'
    }

    if (errorLower.includes('timeout')) {
      return 'The analysis is taking longer than expected. This might be due to high server load.'
    }

    if (errorLower.includes('pdf') || errorLower.includes('file')) {
      return 'There was an issue processing your PDF file. Please ensure it\'s a valid PDF and try again.'
    }

    if (errorLower.includes('video') || errorLower.includes('trailer') || errorLower.includes('youtube')) {
      return 'Unable to process the trailer video. Please check the URL and ensure the video is accessible.'
    }

    if (errorLower.includes('quota') || errorLower.includes('limit')) {
      return 'Service quota exceeded. Please try again in a few minutes.'
    }

    if (errorLower.includes('unauthorized') || errorLower.includes('auth')) {
      return 'Authentication failed. Please refresh the page and try again.'
    }

    if (errorLower.includes('server') || errorLower.includes('internal')) {
      return 'Server error occurred. Our team has been notified and is working on a fix.'
    }

    return error // Return original error if no specific match
  }

  const canRetry = (error: string | null): boolean => {
    if (!error) return false

    const errorLower = error.toLowerCase()
    const retryableErrors = [
      'network', 'timeout', 'fetch', 'connection',
      'server', 'internal', 'quota', 'limit',
      'pdf', 'file', 'video', 'trailer', 'youtube'
    ]

    return retryableErrors.some(keyword => errorLower.includes(keyword))
  }

  const handleRetry = () => {
    setError(null)
    if (currentStep === 'url' && trailerUrl) {
      handleUrlSubmit(trailerUrl)
    } else {
      setCurrentStep('upload')
    }
  }


  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar - Desktop Only */}
      <div className="hidden lg:flex lg:w-72 xl:w-80 lg:flex-col lg:border-r lg:bg-muted/20">
        <div className="p-2 md:p-3 lg:p-4 border-b">
          <div className="flex items-center space-x-1.5 md:space-x-2 mb-0.5 md:mb-1">
            <Brain className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <span className="text-lg md:text-xl font-semibold">Sorot.AI</span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            AI-powered film curation for festival selectors
          </p>
        </div>

        {/* Progress Sidebar */}
        <div className="flex-1 p-2 md:p-3 lg:p-4">
          <div className="space-y-1.5 md:space-y-2 lg:space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Analysis Progress
            </h3>

            {/* Progress Steps - Simplified */}
            <div className="space-y-2">
              {[
                { title: 'Input', current: currentStep === 'upload' || currentStep === 'url' },
                { title: 'Process', current: ['extract', 'visual', 'audio', 'analyze', 'generate'].includes(currentStep) },
                { title: 'Results', current: currentStep === 'results' }
              ].map((step, index) => (
                <div
                  key={step.title}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 ${
                    step.current ? 'bg-primary text-primary-foreground shadow-sm' :
                    index < (currentStep === 'upload' || currentStep === 'url' ? 0 :
                      ['extract', 'visual', 'audio', 'analyze', 'generate'].includes(currentStep) ? 1 :
                      currentStep === 'results' ? 2 : -1) ? 'bg-green-100 text-green-800' :
                    'bg-background hover:bg-muted/50'
                  }`}
                >
                  <div className="w-2 h-2 bg-current rounded-full" />
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
              ))}
            </div>

            {/* Current Status Info - Simplified */}
            <div className="mt-2 md:mt-3 lg:mt-4 p-1.5 md:p-2 bg-background rounded-lg border">
              <div className="text-xs text-muted-foreground mb-0.5">Status</div>
              <div className="font-medium text-xs md:text-sm">
                {isAnalyzing && progress ? `${progress.percentage}% complete` :
                 currentStep === 'upload' ? 'Ready to upload' :
                 currentStep === 'url' ? 'Ready for trailer' :
                 currentStep === 'results' ? 'Analysis complete' :
                 'Waiting...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-background border-b p-1.5 md:p-2 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <Brain className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="text-base md:text-lg font-semibold">Sorot.AI</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-1.5 md:p-2 lg:p-3 xl:p-4 max-w-none">
          {/* Progress Steps - Mobile Only */}
          <div className="lg:hidden flex justify-center mb-1.5 md:mb-2 lg:mb-3">
            <div className="flex items-center space-x-0.5 md:space-x-1 flex-wrap justify-center gap-0.5 md:gap-1 w-full max-w-lg">
              {[
                { title: 'Input', current: currentStep === 'upload' || currentStep === 'url' },
                { title: 'Process', current: ['extract', 'visual', 'audio', 'analyze', 'generate'].includes(currentStep) },
                { title: 'Results', current: currentStep === 'results' }
              ].map((step, index) => (
                <React.Fragment key={step.title}>
                  <div className={`flex items-center space-x-0.5 md:space-x-1 px-1.5 md:px-2 py-1.5 md:py-2 rounded-lg transition-all duration-300 min-h-[36px] md:min-h-[40px] ${
                    step.current ? 'bg-primary text-primary-foreground shadow-md' :
                    index < (currentStep === 'upload' || currentStep === 'url' ? 0 :
                      ['extract', 'visual', 'audio', 'analyze', 'generate'].includes(currentStep) ? 1 :
                      currentStep === 'results' ? 2 : -1) ? 'bg-green-100 text-green-800 border border-green-200' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-current rounded-full" />
                    <span className="text-xs font-medium leading-tight">{step.title}</span>
                  </div>
                  {index < 2 && <div className={`w-2 md:w-3 lg:w-4 h-px transition-colors duration-300 ${
                    index < (
                      currentStep === 'upload' || currentStep === 'url' ? 0 :
                      ['extract', 'visual', 'audio', 'analyze', 'generate'].includes(currentStep) ? 1 :
                      currentStep === 'results' ? 2 : -1
                    ) ? 'bg-green-400' :
                    'bg-border'
                  }`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Main Content - Ultra Compact Layout */}
          <div className="max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto space-y-1 md:space-y-1.5 lg:space-y-2">
            {error && (
              <Card className="border-destructive shadow-sm bg-destructive/5">
                <CardContent className="pt-1.5 md:pt-2 lg:pt-3">
                  <div className="space-y-1 md:space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 md:gap-1.5">
                      <div className="flex items-start space-x-2 flex-1">
                        <X className="h-4 w-4 md:h-5 md:w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-medium text-destructive mb-1">Analysis Failed</h3>
                          <p className="text-sm md:text-base text-destructive/90 leading-relaxed">
                            {getErrorMessage(error)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-0.5 md:gap-1 w-full sm:w-auto">
                        {canRetry(error) && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleRetry}
                            className="min-h-[44px] bg-destructive hover:bg-destructive/90"
                          >
                            Try Again
                          </Button>
                        )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setError(null)}
                          className="w-full sm:w-auto min-h-[44px]"
                >
                  Dismiss
                </Button>
                      </div>
                    </div>

                    {error.includes('network') || error.includes('timeout') ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-0.5 md:p-1">
                        <p className="text-xs text-blue-800">
                          💡 <strong>Tip:</strong> Check your internet connection and try again.
                        </p>
                      </div>
                    ) : error.includes('file') || error.includes('PDF') ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-0.5 md:p-1">
                        <p className="text-xs text-amber-800">
                          💡 <strong>Suggestion:</strong> Make sure your PDF file is valid and try uploading again.
                        </p>
                      </div>
                    ) : error.includes('video') || error.includes('trailer') ? (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-0.5 md:p-1">
                        <p className="text-xs text-purple-800">
                          💡 <strong>Help:</strong> Ensure the trailer URL is valid and the video is accessible.
                        </p>
                      </div>
                    ) : null}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'upload' && (
              <Card className="shadow-sm">
                <CardHeader className="pb-1 md:pb-1.5">
                  <CardTitle className="text-xs md:text-sm">Upload Synopsis</CardTitle>
            </CardHeader>
                <CardContent className="pt-0">
              <FileUploadArea
                onFileSelect={handleFileSelect}
                onTextSubmit={handleTextSubmit}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === 'url' && (
              <Card className="shadow-sm">
                <CardHeader className="pb-1 md:pb-1.5">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-0.5">
                    <span className="text-xs md:text-sm">Trailer URL</span>
                    <div className="flex flex-wrap items-center gap-0.5">
                  {inputType === 'file' && selectedFile && (
                    <Badge variant="secondary" className="text-xs">
                          📄 {selectedFile.name.length > 15 ? `${selectedFile.name.substring(0, 15)}...` : selectedFile.name}
                    </Badge>
                  )}
                  {inputType === 'text' && synopsisText && (
                    <Badge variant="secondary" className="text-xs">
                          📝 {synopsisText.length} chars
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
                <CardContent className="pt-0">
              <TrailerUrlInput onUrlSubmit={handleUrlSubmit} />
            </CardContent>
          </Card>
        )}

        {(currentStep === 'extract' || currentStep === 'visual' || currentStep === 'audio' || currentStep === 'analyze' || currentStep === 'generate') && isAnalyzing && (
              <Card className="shadow-sm">
                <CardHeader className="pb-0.5 md:pb-1">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-0.5">
                    <span className="text-xs md:text-sm">
                  {currentStep === 'extract' && 'Extracting Film Synopsis'}
                  {currentStep === 'visual' && 'Analyzing Visual Elements'}
                  {currentStep === 'audio' && 'Processing Audio Content'}
                  {currentStep === 'analyze' && 'Synthesizing AI Analysis'}
                  {currentStep === 'generate' && 'Generating Audio Briefing'}
                </span>
              </CardTitle>
            </CardHeader>
                <CardContent className="pt-0">
              <AnalysisProgress
                progress={progress || {
                  stage: currentStep,
                  percentage: 0
                }}
                error={error}
                onRetry={handleRetry}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === 'results' && currentAnalysis && (
              <div className="space-y-1 md:space-y-1.5 lg:space-y-2">
                <Card className="shadow-sm">
                  <CardHeader className="pb-0.5 md:pb-1">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-0.5 md:gap-1">
                      <span className="text-xs md:text-sm">Analysis Results</span>
                      <Button
                        variant="outline"
                        onClick={resetAnalysis}
                        className="w-full sm:w-auto min-h-[44px]"
                      >
                    Start New Analysis
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>

            <AnalysisResults
              analysis={currentAnalysis}
            />
          </div>
        )}
      </div>

        </div>
      </div>
    </div>
  )
}
