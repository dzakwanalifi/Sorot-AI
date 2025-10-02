import React, { useState } from 'react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Play, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrailerUrlInputProps {
  onUrlSubmit: (url: string) => void
  className?: string
}

export const TrailerUrlInput: React.FC<TrailerUrlInputProps> = ({
  onUrlSubmit,
  className
}) => {
  const [url, setUrl] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)

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

  const handleSubmit = () => {
    if (isValid && url.trim()) {
      onUrlSubmit(url.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleSubmit()
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="trailer-url" className="text-sm font-medium">
        Trailer URL
      </Label>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Input
            id="trailer-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className={cn(
              "pr-10",
              isValid === false && "border-destructive focus-visible:ring-destructive",
              isValid === true && "border-green-500 focus-visible:ring-green-500"
            )}
          />
          {isValid !== null && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValid ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || !url.trim()}
          className="px-6"
        >
          <Play className="h-4 w-4 mr-2" />
          Analyze
        </Button>
      </div>
      {isValid === false && url.trim() && (
        <p className="text-sm text-destructive">
          Please enter a valid YouTube URL
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Supported: YouTube watch URLs, youtu.be links
      </p>
    </div>
  )
}
