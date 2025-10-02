import React, { useState } from 'react'
import { FileUploadArea } from '../components/FileUploadArea'
import { TrailerUrlInput } from '../components/TrailerUrlInput'
import { AnalysisProgress } from '../components/AnalysisProgress'
import { AnalysisResults } from '../components/AnalysisResults'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { Upload, Youtube, Brain, CheckCircle, X } from 'lucide-react'
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
  const [currentStep, setCurrentStep] = useState<'upload' | 'url' | 'analyze' | 'results'>('upload')

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
    setCurrentStep('analyze')
    setAnalyzing(true)
    setError(null)
    setProgress({ stage: 'upload', percentage: 10 })

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
      const response = await apiClient.post<AnalysisStartResponse>('/.netlify/functions/analyze-film', {
        pdfData,
        trailerUrl: url,
        inputType
      })

      if (response.success && response.data?.data?.analysisId) {
        const analysisId = response.data.data.analysisId

        // Smart polling with exponential backoff for better performance
        let pollCount = 0
        let pollInterval: NodeJS.Timeout
        let timeoutId: NodeJS.Timeout

        const smartPolling = async () => {
          try {
            const statusResponse = await apiClient.get<AnalysisProgressResponse>(`/.netlify/functions/analysis-status?id=${analysisId}`)

            if (statusResponse.success && statusResponse.data?.data) {
              const progress = statusResponse.data.data
              pollCount++

              // Map backend step numbers to frontend stage names
              const stageMapping = {
                1: 'extract', // Processing PDF
                2: 'download', // Downloading Trailer
                3: 'transcribe', // Transcribing Audio
                4: 'analyze', // AI Analysis
                5: 'generate' // Generating Audio Brief
              }

              const stage = stageMapping[progress.currentStep as keyof typeof stageMapping] || 'analyze'

              setProgress({
                stage,
                percentage: progress.progress,
                currentStep: progress.currentStep,
                totalSteps: progress.totalSteps
              })

              if (progress.status === 'completed' && progress.result) {
                clearInterval(pollInterval)
                clearTimeout(timeoutId)
                setProgress({ stage: 'complete', percentage: 100 })
                setCurrentAnalysis(progress.result)
                setCurrentStep('results')
                setAnalyzing(false)
                return // Stop polling
              } else if (progress.status === 'failed') {
                clearInterval(pollInterval)
                clearTimeout(timeoutId)
                setError(progress.error || 'Analysis failed')
                setAnalyzing(false)
                return // Stop polling
              }

              // Dynamic polling interval based on progress
              // Early stages: fast polling (1-2s), later stages: slower polling (3-5s)
              const baseInterval = progress.currentStep <= 2 ? 1500 : 3000
              const backoffMultiplier = Math.min(pollCount * 0.1, 2) // Max 2x slowdown
              const nextInterval = Math.round(baseInterval * (1 + backoffMultiplier))

              // Schedule next poll
              pollInterval = setTimeout(smartPolling, nextInterval)
            } else {
              // Retry with exponential backoff on error
              const retryDelay = Math.min(1000 * Math.pow(2, pollCount), 10000) // Max 10s
              pollInterval = setTimeout(smartPolling, retryDelay)
            }
          } catch (pollError) {
            console.error('Error polling status:', pollError)
            pollCount++

            // Retry with exponential backoff
            const retryDelay = Math.min(1000 * Math.pow(2, pollCount), 10000) // Max 10s
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

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'upload': return <Upload className="h-5 w-5" />
      case 'url': return <Youtube className="h-5 w-5" />
      case 'analyze': return <Brain className="h-5 w-5" />
      case 'results': return <CheckCircle className="h-5 w-5" />
      default: return null
    }
  }

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'upload': return 'Upload Film Synopsis'
      case 'url': return 'Enter Trailer URL'
      case 'analyze': return 'AI Analysis in Progress'
      case 'results': return 'Analysis Complete'
      default: return ''
    }
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
            OpenAI GPT OSS-120B for text analysis and Google Gemini for visual analysis.
          </p>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {['upload', 'url', 'analyze', 'results'].map((step, index) => (
            <React.Fragment key={step}>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === step
                  ? 'bg-primary text-primary-foreground'
                  : index < ['upload', 'url', 'analyze', 'results'].indexOf(currentStep)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {getStepIcon(step)}
                <span className="text-sm font-medium">{getStepTitle(step)}</span>
              </div>
              {index < 3 && <div className="w-8 h-px bg-border" />}
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
              <CardTitle>Step 1: Upload Film Synopsis</CardTitle>
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
                <span>Step 2: Enter Trailer URL</span>
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

        {currentStep === 'analyze' && isAnalyzing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Step 3: AI Analysis in Progress</span>
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
                  stage: 'analyze',
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
        <p>Powered by OpenAI GPT OSS-120B, Google Gemini, and AWS services for comprehensive film analysis.</p>
      </div>
    </div>
  )
}
