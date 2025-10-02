import React, { useState } from 'react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Play, Check, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrailerUrlInputProps {  z
  onUrlSubmit: (url: string) => void
  className?: string
}

export const TrailerUrlInput: React.FC<TrailerUrlInputProps> = ({
  onUrlSubmit,
  className
}) => {
  const [url, setUrl] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const validateYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]{11}/
    return youtubeRegex.test(url)
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    if (value.trim() === '') {
      setIsValid(null)
    } else {
      setIsValid(validateYouTubeUrl(value))
    }
  }

  const handleSubmit = async () => {
    if (!isValid || !url.trim()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onUrlSubmit(url.trim())
      // Success - error state will be handled by parent component
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to process trailer URL. Please check the link and try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleSubmit()
    }
  }

  return (
    <div className={cn("space-y-2 md:space-y-3", className)}>
      <Label htmlFor="trailer-url" className="text-xs md:text-sm lg:text-base font-medium">
        Trailer URL
      </Label>

      {/* Submit Error Display */}
      {submitError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <WifiOff className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">Connection Error</p>
              <p className="text-sm text-destructive/90 mt-1">{submitError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSubmitError(null)}
              className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Input
            id="trailer-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => {
              handleUrlChange(e.target.value)
              if (submitError) setSubmitError(null) // Clear error when user starts typing
            }}
            onKeyPress={handleKeyPress}
            disabled={isSubmitting}
            className={cn(
              "pr-8 md:pr-10 min-h-[44px] text-xs md:text-sm lg:text-base",
              isValid === false && "border-destructive focus-visible:ring-destructive",
              isValid === true && "border-green-500 focus-visible:ring-green-500",
              isSubmitting && "opacity-75"
            )}
          />
          {isValid !== null && !isSubmitting && (
            <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2">
              {isValid ? (
                <Check className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
              )}
            </div>
          )}
          {isSubmitting && (
            <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || !url.trim() || isSubmitting}
          className="w-full sm:w-auto min-h-[44px] px-3 md:px-4 lg:px-6 text-xs md:text-sm lg:text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3 w-3 md:h-4 md:w-4 mr-2 animate-spin flex-shrink-0" />
              Processing...
            </>
          ) : (
            <>
              <Play className="h-3 w-3 md:h-4 md:w-4 mr-2 flex-shrink-0" />
              Analyze
            </>
          )}
        </Button>
      </div>

      {/* URL Validation Messages */}
      {isValid === false && url.trim() && !submitError && (
        <div className="flex items-center space-x-2 text-xs md:text-sm text-destructive">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>Please enter a valid YouTube URL</span>
        </div>
      )}

      {isValid === true && !submitError && (
        <div className="flex items-center space-x-2 text-xs md:text-sm text-green-600">
          <Check className="h-3 w-3 flex-shrink-0" />
          <span>Valid YouTube URL detected</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        Supported: YouTube watch URLs (youtube.com/watch?v=...), shortened links (youtu.be/...), and embed links
      </p>
    </div>
  )
}
