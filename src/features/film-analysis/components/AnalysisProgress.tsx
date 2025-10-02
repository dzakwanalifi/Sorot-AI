import React from 'react'
import { Progress } from '@/shared/components/ui/progress'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Loader2, FileText, Youtube, Brain, Volume2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisProgressProps {
  progress: {
    stage: string
    percentage: number
    currentStep?: number
    totalSteps?: number
  }
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
  className
}) => {
  const currentStageIndex = stages.findIndex(stage => stage.key === progress.stage)
  const isComplete = progress.stage === 'complete'

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isComplete ? 'Analysis Complete' : 'Analyzing Film Trailer'}
            </h3>
            {!isComplete && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  {progress.percentage}%
                </span>
              </div>
            )}
          </div>

          <Progress value={progress.percentage} className="w-full" />

          <div className="space-y-2">
            {stages.map((stage, index) => {
              const isActive = index === currentStageIndex && !isComplete
              const isCompleted = index < currentStageIndex || isComplete
              const IconComponent = stage.icon

              return (
                <div
                  key={stage.key}
                  className={cn(
                    "flex items-center space-x-3 p-2 rounded-md transition-colors",
                    isActive && "bg-primary/5 border border-primary/20",
                    isCompleted && "text-green-600"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full",
                    isCompleted
                      ? "bg-green-100 text-green-600"
                      : isActive
                      ? "bg-primary/10 text-primary animate-pulse"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconComponent className="h-4 w-4" />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm",
                    isActive && "font-medium",
                    isCompleted && "text-green-600"
                  )}>
                    {stage.label}
                  </span>
                  {isCompleted && (
                    <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                  )}
                </div>
              )
            })}
          </div>

          {progress.currentStep && progress.totalSteps && (
            <div className="text-xs text-muted-foreground text-center">
              Step {progress.currentStep} of {progress.totalSteps}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
