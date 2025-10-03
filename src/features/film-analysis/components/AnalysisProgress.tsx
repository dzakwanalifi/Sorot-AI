import React from 'react'
import { Progress } from '@/shared/components/ui/progress'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Loader2, FileText, Youtube, Brain, Volume2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { DeepSeek } from '@lobehub/icons'
import { cn } from '@/lib/utils'

interface AnalysisProgressProps {
  progress: {
    stage: string
    percentage: number
    currentStep?: number
    totalSteps?: number
  }
  error?: string | null
  onRetry?: () => void
  className?: string
}

const stages = [
  { key: 'upload', label: 'Processing PDF', icon: FileText, logo: null },
  { key: 'extract', label: 'Extracting Synopsis', icon: FileText, logo: null },
  { key: 'download', label: 'Downloading Trailer', icon: Youtube, logo: null },
  { key: 'transcribe', label: 'Transcribing Audio', icon: Volume2, logo: null },
  { key: 'analyze', label: 'AI Analysis', icon: Brain, logo: DeepSeek },
  { key: 'generate', label: 'Generating Audio Brief', icon: Volume2, logo: null },
  { key: 'complete', label: 'Analysis Complete', icon: CheckCircle, logo: null }
]

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  progress,
  error,
  onRetry,
  className
}) => {
  const currentStageIndex = stages.findIndex(stage => stage.key === progress.stage)
  const currentStage = stages[currentStageIndex] || stages[0]
  const LogoComponent = currentStage.logo
  const isComplete = progress.stage === 'complete'
  const hasError = !!error


  const getErrorMessage = (error: string): string => {
    const errorLower = error.toLowerCase()

    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return 'Network connection lost. Please check your internet and try again.'
    }

    if (errorLower.includes('timeout')) {
      return 'Analysis is taking too long. This might be due to high server load.'
    }

    if (errorLower.includes('quota') || errorLower.includes('limit')) {
      return 'Service quota exceeded. Please try again in a few minutes.'
    }

    if (errorLower.includes('server') || errorLower.includes('internal')) {
      return 'Server error occurred. Our team has been notified.'
    }

    return error
  }

  return (
    <Card className={cn("w-full shadow-sm", className)}>
      <CardContent className="p-3 md:p-4 lg:p-5">
        <div className="space-y-2 md:space-y-3 lg:space-y-4">
          {hasError ? (
            /* Error State */
            <div className="text-center space-y-3 md:space-y-4 lg:space-y-5">
              <div className="flex flex-col items-center space-y-2 md:space-y-3">
                <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <h3 className="text-sm md:text-base lg:text-lg font-semibold text-destructive">
                    Failed
                  </h3>
                  <p className="text-xs md:text-sm lg:text-base text-muted-foreground leading-relaxed max-w-md">
                    {getErrorMessage(error)}
                  </p>
                </div>
              </div>

              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="min-h-[44px] px-4 md:px-6 lg:px-8 text-sm md:text-base lg:text-lg"
                >
                  <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Try Again
                </Button>
              )}

              <div className="text-xs md:text-sm text-muted-foreground space-y-1">
                <p>If the problem persists, please try:</p>
                <ul className="list-disc list-inside space-y-1 text-left max-w-xs mx-auto">
                  <li>Check internet connection</li>
                  <li>Use different trailer URL</li>
                  <li>Try again in a few minutes</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Normal Progress State */
            <>
              <Progress value={progress.percentage} className="w-full h-2 md:h-3" />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/10 text-primary animate-pulse scale-110">
                    {LogoComponent ? (
                      <div className="scale-75">
                        <LogoComponent size={16} />
                      </div>
                    ) : (
                      <Loader2 className="h-2 w-2 md:h-2.5 md:w-2.5 animate-spin" />
                    )}
                  </div>
                  <span className="text-xs md:text-sm font-medium text-primary">
                    {currentStage.label}
                  </span>
                </div>

                {progress.currentStep && progress.totalSteps && !hasError && (
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Step {progress.currentStep} of {progress.totalSteps}
                  </div>
                )}
              </div>

              {!isComplete && (
                <div className="flex items-center justify-center space-x-2 pt-1">
                  <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin flex-shrink-0 text-primary" />
                  <span className="text-xs md:text-sm text-muted-foreground font-medium">
                    {progress.percentage}%
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
