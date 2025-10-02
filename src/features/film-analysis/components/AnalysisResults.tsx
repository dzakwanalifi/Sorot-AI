import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import {
  Star,
  Users,
  Film,
  Target,
  Lightbulb,
  ThumbsUp,
  Play
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FilmAnalysis } from '@/types/analysis'

interface AnalysisResultsProps {
  analysis: FilmAnalysis
  onPlayAudio?: (url: string) => void
  className?: string
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysis,
  onPlayAudio,
  className
}) => {
  // Add safety checks for the analysis data structure
  if (!analysis || !analysis.scores || typeof analysis.scores.overall !== 'number') {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Analysis data is incomplete or malformed.</p>
            <p className="text-sm text-gray-600 mt-2">
              Please try the analysis again.
            </p>
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
    <div className={cn("space-y-6", className)}>
      {/* Overall Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Analysis Results</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {analysis.aiModel === 'openai' ? 'OpenAI' : 'Gemini'} Analysis
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "p-6 rounded-lg border-2 text-center",
            getScoreBgColor(overallScore)
          )}>
            <div className="flex items-center justify-center mb-4">
              <Star className={cn("h-8 w-8 mr-2", getScoreColor(overallScore))} />
              <span className={cn("text-4xl font-bold", getScoreColor(overallScore))}>
                {overallScore}/100
              </span>
            </div>
            <p className="text-lg font-medium mb-2">
              {overallScore >= 80 ? 'Excellent' :
               overallScore >= 60 ? 'Good' : 'Needs Improvement'}
            </p>
            <p className="text-sm text-muted-foreground">
              Film festival suitability score
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {labels[key as keyof typeof labels]}
                    </span>
                    <span className={cn("text-sm font-bold", getScoreColor(score))}>
                      {score}/100
                    </span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Details */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {/* Genre & Themes */}
            <AccordionItem value="genre-themes">
              <AccordionTrigger className="text-left">
                <div className="flex items-center">
                  <Film className="h-4 w-4 mr-2" />
                  Genre & Themes
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.insights.genre.map((genre, index) => (
                        <Badge key={index} variant="secondary">{genre}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.insights.themes.map((theme, index) => (
                        <Badge key={index} variant="outline">{theme}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Target Audience */}
            <AccordionItem value="audience">
              <AccordionTrigger className="text-left">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Target Audience
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">{analysis.insights.targetAudience}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Key Moments */}
            <AccordionItem value="key-moments">
              <AccordionTrigger className="text-left">
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Key Moments
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {analysis.insights.keyMoments.map((moment, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm">{moment}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Strengths */}
            <AccordionItem value="strengths">
              <AccordionTrigger className="text-left">
                <div className="flex items-center text-green-600">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Strengths
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {analysis.insights.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Suggestions */}
            <AccordionItem value="suggestions">
              <AccordionTrigger className="text-left">
                <div className="flex items-center text-blue-600">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Suggestions for Improvement
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {analysis.insights.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Audio Briefing */}
      {analysis.audioBriefing && (
        <Card>
          <CardHeader>
            <CardTitle>Audio Briefing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Analysis Audio Summary</p>
                  <p className="text-sm text-muted-foreground">
                    Generated by AWS Polly • {Math.round(analysis.audioBriefing.duration)}s • {analysis.audioBriefing.voice}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => onPlayAudio?.(analysis.audioBriefing!.url)}
                variant="outline"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Play Audio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Analysis completed in {(analysis.processingStats.totalTime / 1000).toFixed(1)} seconds</p>
        <p>Analysis ID: {analysis.id}</p>
      </div>
    </div>
  )
}
