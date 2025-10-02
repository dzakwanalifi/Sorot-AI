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
import type { FilmAnalysis } from '@/types/analysis'

export const FilmAnalysisContainer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [trailerUrl, setTrailerUrl] = useState('')
  const [currentStep, setCurrentStep] = useState<'upload' | 'url' | 'analyze' | 'results'>('upload')

  const { currentAnalysis, isAnalyzing, error, setAnalyzing, setError, setCurrentAnalysis } = useAnalysisStore()

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setCurrentStep('url')
  }

  const handleUrlSubmit = async (url: string) => {
    setTrailerUrl(url)
    setCurrentStep('analyze')
    setAnalyzing(true)

    try {
      // Simulate analysis process
      setTimeout(() => {
        // Mock analysis result
        const mockAnalysis: FilmAnalysis = {
          id: 'analysis-' + Date.now(),
          title: 'Sample Film Title',
          synopsis: 'This is a sample film synopsis for testing purposes.',
          trailerUrl: url,
          transcript: 'Sample transcript from the trailer audio processing.',
          scores: {
            overall: 85,
            genre: 88,
            theme: 82,
            targetAudience: 90,
            technicalQuality: 80,
            emotionalImpact: 85
          },
          insights: {
            genre: ['Drama', 'Thriller'],
            themes: ['Identity', 'Redemption', 'Human Connection'],
            targetAudience: 'Adults 25-45 years old interested in character-driven stories',
            keyMoments: [
              'Opening scene establishes the protagonist\'s internal conflict',
              'Mid-film revelation changes the narrative direction',
              'Climactic confrontation reveals character growth'
            ],
            strengths: [
              'Strong character development',
              'Compelling narrative structure',
              'Effective use of cinematography'
            ],
            suggestions: [
              'Consider tightening the pacing in the second act',
              'Enhance emotional depth in supporting character arcs'
            ]
          },
          audioBriefingUrl: 'https://example.com/audio-briefing.mp3',
          processingTime: 12500, // 12.5 seconds
          aiModel: 'openai',
          createdAt: new Date()
        }

        setCurrentAnalysis(mockAnalysis)
        setAnalyzing(false)
        setCurrentStep('results')
      }, 3000)

    } catch (err) {
      setError('Analysis failed. Please try again.')
      setAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setSelectedFile(null)
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
            <Badge variant="secondary" className="text-sm">
              Demo Mode
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Analyze film trailers and synopses using dual AI capabilities:
            OpenAI GPT-4 for text analysis and Google Gemini for visual analysis.
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
              <FileUploadArea onFileSelect={handleFileSelect} />
            </CardContent>
          </Card>
        )}

        {currentStep === 'url' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Step 2: Enter Trailer URL</span>
                {selectedFile && (
                  <Badge variant="secondary" className="text-xs">
                    PDF: {selectedFile.name}
                  </Badge>
                )}
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
                <div className="text-xs text-muted-foreground">
                  {selectedFile && <div>📄 {selectedFile.name}</div>}
                  {trailerUrl && <div>🎬 {trailerUrl}</div>}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisProgress
                progress={{
                  stage: 'analyze',
                  percentage: 75,
                  currentStep: 3,
                  totalSteps: 4
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
        <p>This is a demo with mock data. Real analysis requires AWS and Google AI setup.</p>
      </div>
    </div>
  )
}
