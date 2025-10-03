import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FilmAnalysis } from '@/types/analysis'

interface AnalysisResultsProps {
  analysis: FilmAnalysis
  onStartNew?: () => void
  className?: string
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysis,
  onStartNew,
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
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span className="text-xs">Network interruption during processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span className="text-xs">Server-side processing errors</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span className="text-xs">Corrupted analysis results</span>
                </li>
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
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-green-50 border-green-200'
    if (score >= 70) return 'bg-blue-50 border-blue-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall Score */}
      <Card className="shadow-sm border-2">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className={`text-4xl md:text-5xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}/100
            </div>
            <div className="text-lg font-semibold">
              {overallScore >= 85 ? '🎉 Excellent' : overallScore >= 70 ? '👍 Good' : overallScore >= 60 ? '🤔 Fair' : '😞 Needs Work'}
            </div>
            <div className="text-sm text-muted-foreground">
              AI-Powered Film Analysis
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className={cn("shadow-sm", getScoreBg(analysis.scores.genre))}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎭</span>
              <span className="text-sm font-medium">Genre</span>
            </div>
              <span className={cn("text-lg font-bold", getScoreColor(analysis.scores.genre))}>
                {analysis.scores.genre}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("shadow-sm", getScoreBg(analysis.scores.theme))}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📖</span>
              <span className="text-sm font-medium">Themes</span>
            </div>
              <span className={cn("text-lg font-bold", getScoreColor(analysis.scores.theme))}>
                {analysis.scores.theme}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("shadow-sm", getScoreBg(analysis.scores.targetAudience))}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="text-sm font-medium">Audience</span>
            </div>
              <span className={cn("text-lg font-bold", getScoreColor(analysis.scores.targetAudience))}>
                {analysis.scores.targetAudience}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("shadow-sm", getScoreBg(analysis.scores.technicalQuality))}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔧</span>
              <span className="text-sm font-medium">Technical</span>
            </div>
              <span className={cn("text-lg font-bold", getScoreColor(analysis.scores.technicalQuality))}>
                {analysis.scores.technicalQuality}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("shadow-sm", getScoreBg(analysis.scores.emotionalImpact))}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">❤️</span>
              <span className="text-sm font-medium">Emotional</span>
            </div>
              <span className={cn("text-lg font-bold", getScoreColor(analysis.scores.emotionalImpact))}>
                {analysis.scores.emotionalImpact}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎨</span>
                <span className="text-sm font-medium">Visual</span>
              </div>
              <span className="text-lg font-bold text-purple-600">
                {analysis.insights?.keyMoments?.length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Story & Visual Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Genre & Themes */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              🎭 Story Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2 text-muted-foreground">Genres</div>
              <div className="flex flex-wrap gap-1">
                {analysis.insights?.genre?.map((genre, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                )) || <span className="text-xs text-muted-foreground">No genres identified</span>}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2 text-muted-foreground">Themes</div>
              <div className="space-y-2">
                {analysis.insights?.themes?.map((theme, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-sm leading-relaxed">{theme}</span>
                  </div>
                )) || <span className="text-xs text-muted-foreground">No themes identified</span>}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2 text-muted-foreground">Target Audience</div>
              <p className="text-sm">{analysis.insights?.targetAudience || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Key Visual Moments */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              🎬 Visual Moments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.insights?.keyMoments?.map((moment, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm leading-relaxed">{moment}</span>
                </div>
              )) || <span className="text-sm text-muted-foreground">No visual analysis available</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            🧠 Detailed Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="strengths">
              <AccordionTrigger className="text-sm flex items-center gap-2 [&>svg]:text-green-600">
                ✅ Strengths
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                {analysis.insights?.strengths?.map((strength, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm leading-relaxed">{strength}</span>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No strengths identified</p>}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="suggestions">
              <AccordionTrigger className="text-sm flex items-center gap-2 [&>svg]:text-amber-600">
                💡 Suggestions
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                {analysis.insights?.suggestions?.map((suggestion, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm leading-relaxed">{suggestion}</span>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No suggestions available</p>}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>


      {/* Audio Summary */}
      {analysis.audioBriefing && (
        <Card className="shadow-sm bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              🔊 Audio Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <audio controls className="w-full h-10 rounded-lg" preload="metadata">
              <source src={analysis.audioBriefing.url} type="audio/mpeg" />
              <source src={analysis.audioBriefing.url} type="audio/mp3" />
              Your browser does not support the audio element.
            </audio>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Voice: {analysis.audioBriefing.voice}</span>
              <span>Duration: {Math.round(analysis.audioBriefing.duration)}s</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="flex justify-center pt-6">
        {onStartNew && (
          <Button
            onClick={onStartNew}
            className="min-h-[44px] px-8"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Start New Analysis
          </Button>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground py-2">
        <p>Analysis ID: {analysis.id}</p>
        <p>Completed: {new Date(analysis.completedAt).toLocaleString()}</p>
      </div>
    </div>
  )
}
