import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import {
  Star,
  Users,
  Film,
  Target,
  Lightbulb,
  ThumbsUp,
  Play,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FilmAnalysis } from '@/types/analysis'

interface AnalysisResultsProps {
  analysis: FilmAnalysis
  className?: string
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysis,
  className
}) => {
  // Add safety checks for the analysis data structure
  if (!analysis || !analysis.scores || typeof analysis.scores.overall !== 'number') {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-destructive">Results Unavailable</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                The analysis data appears to be incomplete or corrupted. This can happen due to:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 max-w-xs mx-auto text-left">
                <li>• Network interruption during processing</li>
                <li>• Server-side processing errors</li>
                <li>• Corrupted analysis results</li>
              </ul>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="min-h-[44px]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Start New Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const overallScore = analysis.scores.overall

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className={cn("space-y-4 md:space-y-6", className)}>
      {/* Overall Score & Detailed Scores - 2 Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
        {/* Overall Score Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-1.5 md:pb-2 lg:pb-3">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-1.5 md:gap-2">
              <span className="text-xs md:text-sm lg:text-base">Results</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 md:px-2 md:py-1 w-fit">
                {analysis.aiModel === 'deepseek' ? 'DeepSeek-R1' : 'Gemini'} Analysis
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={cn(
              "p-1.5 md:p-2 lg:p-3 rounded-lg border-2 text-center",
              getScoreBgColor(overallScore)
            )}>
              <div className="flex items-center justify-center mb-0.5 md:mb-1 lg:mb-2">
                <Star className={cn("h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 mr-1 md:mr-2", getScoreColor(overallScore))} />
                <span className={cn("text-base md:text-lg lg:text-xl font-bold", getScoreColor(overallScore))}>
                  {overallScore}/100
                </span>
              </div>
              <p className="text-xs md:text-sm font-medium mb-0.5">
                {overallScore >= 80 ? 'Excellent' :
                 overallScore >= 60 ? 'Good' : 'Needs Improvement'}
              </p>
              <p className="text-xs text-muted-foreground">
                Festival suitability score
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Scores */}
        <Card className="shadow-sm">
          <CardHeader className="pb-1.5 md:pb-2 lg:pb-3">
            <CardTitle className="text-sm md:text-base lg:text-lg">Detailed Scores</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              {Object.entries(analysis.scores).map(([key, score]) => {
                if (key === 'overall') return null
                const labels = {
                  genre: 'Genre Classification',
                  theme: 'Thematic Depth',
                  targetAudience: 'Target Audience Fit',
                  technicalQuality: 'Technical Quality',
                  emotionalImpact: 'Emotional Impact'
                }

                return (
                  <div key={key} className="space-y-1.5 p-1.5 md:p-2 bg-muted/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium leading-tight">
                        {labels[key as keyof typeof labels]}
                      </span>
                      <span className={cn("text-xs font-bold", getScoreColor(score))}>
                        {score}/100
                      </span>
                    </div>
                    <Progress value={score} className="h-1 md:h-1.5" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Details - Compact Accordion */}
      <Card className="shadow-sm">
        <CardHeader className="pb-1.5 md:pb-2 lg:pb-3">
          <CardTitle className="text-sm md:text-base lg:text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="multiple" className="w-full space-y-1.5 md:space-y-2">
            {/* Genre & Themes */}
            <AccordionItem value="genre-themes" className="border rounded-lg">
              <AccordionTrigger className="text-left px-2 py-1.5 md:px-3 md:py-2 hover:no-underline">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Film className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium">Genre & Themes</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2 md:px-3 md:pb-3">
                <div className="space-y-1.5 md:space-y-2">
                  <div>
                    <h4 className="font-medium mb-0.5 md:mb-1 text-xs md:text-sm">Genres</h4>
                    <div className="flex flex-wrap gap-0.5 md:gap-1">
                      {analysis.insights.genre.map((genre, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">{genre}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-0.5 md:mb-1 text-xs md:text-sm">Themes</h4>
                    <div className="flex flex-wrap gap-0.5 md:gap-1">
                      {analysis.insights.themes.map((theme, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{theme}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Target Audience */}
            <AccordionItem value="audience" className="border rounded-lg">
              <AccordionTrigger className="text-left px-2 py-1.5 md:px-3 md:py-2 hover:no-underline">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Users className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium">Target Audience</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2 md:px-3 md:pb-3">
                <div className="p-1.5 md:p-2 bg-muted/50 rounded-lg">
                  <p className="text-xs md:text-sm leading-relaxed">{analysis.insights.targetAudience}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Key Moments */}
            <AccordionItem value="key-moments" className="border rounded-lg">
              <AccordionTrigger className="text-left px-2 py-1.5 md:px-3 md:py-2 hover:no-underline">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Target className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium">Key Moments</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2 md:px-3 md:pb-3">
                <ul className="space-y-0.5 md:space-y-1">
                  {analysis.insights.keyMoments.map((moment, index) => (
                    <li key={index} className="flex items-start gap-1.5 md:gap-2">
                      <span className="inline-block w-0.5 h-0.5 md:w-1 md:h-1 bg-primary rounded-full mt-1.5 md:mt-2 flex-shrink-0" />
                      <span className="text-xs md:text-sm leading-relaxed">{moment}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Strengths */}
            <AccordionItem value="strengths" className="border rounded-lg">
              <AccordionTrigger className="text-left px-2 py-1.5 md:px-3 md:py-2 hover:no-underline">
                <div className="flex items-center gap-1.5 md:gap-2 text-green-600">
                  <ThumbsUp className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium">Strengths</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2 md:px-3 md:pb-3">
                <ul className="space-y-0.5 md:space-y-1">
                  {analysis.insights.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-1.5 md:gap-2">
                      <span className="inline-block w-0.5 h-0.5 md:w-1 md:h-1 bg-green-500 rounded-full mt-1.5 md:mt-2 flex-shrink-0" />
                      <span className="text-xs md:text-sm leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Suggestions */}
            <AccordionItem value="suggestions" className="border rounded-lg">
              <AccordionTrigger className="text-left px-2 py-1.5 md:px-3 md:py-2 hover:no-underline">
                <div className="flex items-center gap-1.5 md:gap-2 text-blue-600">
                  <Lightbulb className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium">Suggestions</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2 md:px-3 md:pb-3">
                <ul className="space-y-0.5 md:space-y-1">
                  {analysis.insights.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-1.5 md:gap-2">
                      <span className="inline-block w-0.5 h-0.5 md:w-1 md:h-1 bg-blue-500 rounded-full mt-1.5 md:mt-2 flex-shrink-0" />
                      <span className="text-xs md:text-sm leading-relaxed">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Audio Briefing - Compact */}
      {analysis.audioBriefing && (
        <Card className="shadow-sm">
          <CardHeader className="pb-1.5 md:pb-2 lg:pb-3">
            <CardTitle className="text-sm md:text-base lg:text-lg">Audio Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex items-center space-x-1.5 md:space-x-2">
                <div className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Play className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs md:text-sm">Audio Summary</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(analysis.audioBriefing.duration || 0)}s • {analysis.audioBriefing.voice}
                  </p>
                </div>
              </div>

              {/* HTML5 Audio Player */}
              <div className="bg-muted/50 rounded-lg p-1.5 md:p-2">
                <audio
                  controls
                  className="w-full h-8 md:h-10"
                  preload="metadata"
                >
                  <source
                    src={analysis.audioBriefing.url}
                    type="audio/mpeg"
                  />
                  <source
                    src={analysis.audioBriefing.url}
                    type="audio/mp3"
                  />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer - Compact */}
      <div className="text-center text-xs text-muted-foreground py-1.5 md:py-2">
        <p>ID: {analysis.id}</p>
      </div>
    </div>
  )
}
