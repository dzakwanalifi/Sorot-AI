import React, { useState } from 'react'
import { FileUploadArea } from '../components/FileUploadArea'
import { TrailerUrlInput } from '../components/TrailerUrlInput'
import { AnalysisProgress } from '../components/AnalysisProgress'
import { AnalysisResults } from '../components/AnalysisResults'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { Upload, Brain, CheckCircle, X } from 'lucide-react'
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


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6 text-primary" />
              <span>Sorot.AI Film Analysis</span>
            </div>
            <Badge variant="default" className="text-sm bg-green-600">
              Production Ready
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Analyze film trailers and synopses using dual AI capabilities:
            DeepSeek-R1 for comprehensive analysis and Google Gemini for visual analysis.
          </p>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-2 flex-wrap justify-center gap-2">
          {[
            { key: 'input', title: 'Input Data', icon: Upload },
            { key: 'process', title: 'AI Analysis', icon: Brain },
            { key: 'output', title: 'Hasil Analisis', icon: CheckCircle }
          ].map((step, index) => (
            <React.Fragment key={step.key}>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                (currentStep === 'upload' || currentStep === 'url') && step.key === 'input' ? 'bg-primary text-primary-foreground shadow-md' :
                (['extract', 'visual', 'audio', 'analyze', 'generate'].includes(currentStep) && step.key === 'process') ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                (currentStep === 'results' && step.key === 'output') ? 'bg-green-100 text-green-800 border border-green-200' :
                index < [
                  currentStep === 'upload' || currentStep === 'url' ? 0 :
                  ['extract', 'visual', 'audio', 'analyze', 'generate'].includes(currentStep) ? 1 :
                  currentStep === 'results' ? 2 : -1
                ] ? 'bg-green-100 text-green-800 border border-green-200' :
                'bg-muted text-muted-foreground'
              }`}>
                <step.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{step.title}</span>
              </div>
              {index < 2 && <div className={`w-8 h-px transition-colors duration-300 ${
                index < [
                  currentStep === 'upload' || currentStep === 'url' ? 0 :
                  ['extract', 'visual', 'audio', 'analyze', 'generate'].includes(currentStep) ? 1 :
                  currentStep === 'results' ? 2 : -1
                ] ? 'bg-green-400' :
                'bg-border'
              }`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-destructive">
                <X className="h-5 w-5" />
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Film Synopsis</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploadArea
                onFileSelect={handleFileSelect}
                onTextSubmit={handleTextSubmit}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === 'url' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Enter Trailer URL</span>
                <div className="flex items-center space-x-2">
                  {inputType === 'file' && selectedFile && (
                    <Badge variant="secondary" className="text-xs">
                      📄 PDF: {selectedFile.name}
                    </Badge>
                  )}
                  {inputType === 'text' && synopsisText && (
                    <Badge variant="secondary" className="text-xs">
                      📝 Text: {synopsisText.length} chars
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrailerUrlInput onUrlSubmit={handleUrlSubmit} />
            </CardContent>
          </Card>
        )}

        {(currentStep === 'extract' || currentStep === 'visual' || currentStep === 'audio' || currentStep === 'analyze' || currentStep === 'generate') && isAnalyzing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {currentStep === 'extract' && 'Extracting Film Synopsis'}
                  {currentStep === 'visual' && 'Analyzing Visual Elements'}
                  {currentStep === 'audio' && 'Processing Audio Content'}
                  {currentStep === 'analyze' && 'Synthesizing AI Analysis'}
                  {currentStep === 'generate' && 'Generating Audio Briefing'}
                </span>
                <div className="text-xs text-muted-foreground text-right">
                  {inputType === 'file' && selectedFile && <div>📄 {selectedFile.name}</div>}
                  {inputType === 'text' && synopsisText && <div>📝 {synopsisText.length} chars</div>}
                  {trailerUrl && <div>🎬 {trailerUrl}</div>}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisProgress
                progress={progress || {
                  stage: currentStep,
                  percentage: 0
                }}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === 'results' && currentAnalysis && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Analysis Results</span>
                  <Button variant="outline" onClick={resetAnalysis}>
                    Start New Analysis
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>

            <AnalysisResults
              analysis={currentAnalysis}
              onPlayAudio={(url) => {
                // Mock audio play
                console.log('Playing audio:', url)
                alert('Audio playback would start here in production')
              }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <Separator />
      <div className="text-center text-sm text-muted-foreground">
        <p>Sorot.AI - AI-powered film curation for festival selectors</p>
        <p>Powered by DeepSeek-R1, Google Gemini, and AWS services for comprehensive film analysis.</p>
      </div>
    </div>
  )
}
