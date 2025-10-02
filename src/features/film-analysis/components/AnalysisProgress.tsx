import React from 'react'
import { Progress } from '@/shared/components/ui/progress'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Loader2, FileText, Youtube, Brain, Volume2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
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
  { key: 'upload', label: 'Processing PDF', icon: FileText },
  { key: 'extract', label: 'Extracting Synopsis', icon: FileText },
  { key: 'download', label: 'Downloading Trailer', icon: Youtube },
  { key: 'transcribe', label: 'Transcribing Audio', icon: Volume2 },
  { key: 'analyze', label: 'AI Analysis', icon: Brain },
  { key: 'generate', label: 'Generating Audio Brief', icon: Volume2 },
  { key: 'complete', label: 'Analysis Complete', icon: CheckCircle }
]

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  progress,
  error,
  onRetry,
  className
}) => {
  const currentStageIndex = stages.findIndex(stage => stage.key === progress.stage)
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
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-5">
          {hasError ? (
            /* Error State */
            <div className="text-center space-y-4">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base md:text-lg font-semibold text-destructive">
                    Analysis Failed
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md">
                    {getErrorMessage(error)}
                  </p>
                </div>
              </div>

              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="min-h-[44px] px-6"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>If the problem persists, please try:</p>
                <ul className="list-disc list-inside space-y-1 text-left max-w-xs mx-auto">
                  <li>Checking your internet connection</li>
                  <li>Using a different trailer URL</li>
                  <li>Trying again in a few minutes</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Normal Progress State */
            <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <h3 className="text-sm md:text-base lg:text-lg font-semibold leading-tight">
              {isComplete ? 'Analysis Complete' : 'Analyzing Film Trailer'}
            </h3>
            {!isComplete && (
              <div className="flex items-center justify-center sm:justify-end space-x-2">
                <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin flex-shrink-0" />
                <span className="text-xs md:text-sm lg:text-base text-muted-foreground font-medium">
                  {progress.percentage}%
                </span>
              </div>
            )}
          </div>

              <Progress value={progress.percentage} className="w-full h-2 md:h-3" />

              <div className="space-y-1 md:space-y-2 lg:space-y-3">
                {stages.map((stage, index) => {
                  const isActive = index === currentStageIndex && !isComplete && !hasError
                  const isCompleted = index < currentStageIndex || isComplete
                  const IconComponent = stage.icon

                  return (
                    <div
                      key={stage.key}
                      className={cn(
                        "flex items-center space-x-2 md:space-x-3 p-1.5 md:p-2 lg:p-3 rounded-md transition-colors min-h-[40px] md:min-h-[44px]",
                        isActive && "bg-primary/5 border border-primary/20",
                        isCompleted && !hasError && "text-green-600",
                        hasError && "opacity-50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 rounded-full flex-shrink-0",
                        isCompleted && !hasError
                          ? "bg-green-100 text-green-600"
                          : isActive
                          ? "bg-primary/10 text-primary animate-pulse"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {isCompleted && !hasError ? (
                          <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3 lg:h-4 lg:w-4" />
                        ) : isActive ? (
                          <Loader2 className="h-2.5 w-2.5 md:h-3 md:w-3 lg:h-4 lg:w-4 animate-spin" />
                        ) : (
                          <IconComponent className="h-2.5 w-2.5 md:h-3 md:w-3 lg:h-4 lg:w-4" />
                        )}
                      </div>
                      <span className={cn(
                        "text-xs md:text-sm lg:text-base flex-1 leading-tight",
                        isActive && !hasError && "font-medium",
                        isCompleted && !hasError && "text-green-600",
                        hasError && "text-muted-foreground"
                      )}>
                        {stage.label}
                      </span>
                      {isCompleted && !hasError && (
                        <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3 lg:h-4 lg:w-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>

              {progress.currentStep && progress.totalSteps && !hasError && (
                <div className="text-xs text-muted-foreground text-center">
                  Step {progress.currentStep} of {progress.totalSteps}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
