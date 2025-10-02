import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Type, Clipboard, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void
  onTextSubmit: (text: string) => void
  acceptedFileTypes?: Record<string, string[]>
  maxSize?: number
  className?: string
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  onTextSubmit,
  acceptedFileTypes = {
    'application/pdf': ['.pdf']
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  className
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file')
  const [textInput, setTextInput] = useState('')
  const [textSubmitted, setTextSubmitted] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: Array<{ file: File; errors: Array<{ code: string; message: string }> }>) => {
    setUploadError(null)

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors.some((error: { code: string; message: string }) => error.code === 'file-too-large')) {
        setUploadError(`File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`)
      } else if (rejection.errors.some((error: { code: string; message: string }) => error.code === 'file-invalid-type')) {
        setUploadError('Invalid file type. Please upload a PDF file only.')
      } else {
        setUploadError('File upload failed. Please try again with a valid PDF file.')
      }
      return
    }

    // Handle accepted files
    const file = acceptedFiles[0]
    if (file) {
      setIsUploading(true)

      // Validate file content (basic check)
      if (file.type !== 'application/pdf') {
        setUploadError('The uploaded file is not a valid PDF. Please check the file format.')
        setIsUploading(false)
        return
      }

      setSelectedFile(file)
      onFileSelect(file)
      setIsUploading(false)
    }
  }, [onFileSelect, maxSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize,
    multiple: false
  })

  const removeFile = () => {
    setSelectedFile(null)
    setUploadError(null)
  }

  const handleTextSubmit = () => {
    if (textInput.trim().length < 100) {
      setUploadError('Text must be at least 100 characters long.')
      return
    }

    if (textInput.trim()) {
      setUploadError(null)
      onTextSubmit(textInput.trim())
      setTextSubmitted(true)
    }
  }

  const resetText = () => {
    setTextInput('')
    setTextSubmitted(false)
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Mode Toggle */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 md:mb-4 lg:mb-6">
        <Button
          variant={inputMode === 'file' ? 'default' : 'outline'}
          size="default"
          onClick={() => setInputMode('file')}
          className="flex-1 min-h-[44px] justify-center text-xs md:text-sm lg:text-base"
        >
          <Upload className="h-3 w-3 md:h-4 md:w-4 mr-2 flex-shrink-0" />
          Upload PDF
        </Button>
        <Button
          variant={inputMode === 'text' ? 'default' : 'outline'}
          size="default"
          onClick={() => setInputMode('text')}
          className="flex-1 min-h-[44px] justify-center text-xs md:text-sm lg:text-base"
        >
          <Type className="h-3 w-3 md:h-4 md:w-4 mr-2 flex-shrink-0" />
          Paste Text
        </Button>
      </div>

      {/* File Upload Mode */}
      {inputMode === 'file' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-base md:text-lg flex items-center">
              <FileText className="h-4 w-4 md:h-5 md:w-5 mr-2 flex-shrink-0" />
              Upload PDF File
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Upload Error Display */}
            {uploadError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-destructive font-medium">Upload Error</p>
                    <p className="text-sm text-destructive/90 mt-1">{uploadError}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadError(null)}
                    className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 md:p-6 text-center cursor-pointer transition-colors min-h-[120px] flex flex-col justify-center relative",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50",
                  isUploading && "pointer-events-none opacity-75"
                )}
              >
                <input {...getInputProps()} />
                {isUploading ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-b-2 border-primary"></div>
                    <div className="space-y-1">
                      <p className="text-sm md:text-base font-medium">Processing file...</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Please wait</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 md:h-10 md:w-10 text-muted-foreground mb-2 md:mb-3" />
                    <div className="space-y-1 md:space-y-2">
                      <p className="text-sm md:text-base font-medium">
                        {isDragActive ? "Drop the PDF here..." : "Drag & drop PDF file"}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        or click to browse • Max {Math.round(maxSize / 1024 / 1024)}MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-3 md:p-4 bg-muted/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base truncate">{selectedFile.name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-2 hover:bg-destructive/10 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Text Input Mode */}
      {inputMode === 'text' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-base md:text-lg flex items-center">
              <Clipboard className="h-4 w-4 md:h-5 md:w-5 mr-2 flex-shrink-0" />
              Paste Film Synopsis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Text Input Error Display */}
            {uploadError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-destructive font-medium">Input Error</p>
                    <p className="text-sm text-destructive/90 mt-1">{uploadError}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadError(null)}
                    className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {!textSubmitted ? (
              <div className="space-y-3 md:space-y-4">
                <Textarea
                  placeholder="Paste your film synopsis here... (minimum 100 characters)"
                  value={textInput}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setTextInput(e.target.value)
                    if (uploadError) setUploadError(null) // Clear error when user starts typing
                  }}
                  className="min-h-[120px] md:min-h-[140px] resize-none text-sm md:text-base"
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {textInput.length} characters
                    </p>
                    {textInput.length < 100 && (
                      <span className="text-xs text-destructive">(minimum 100)</span>
                    )}
                    {textInput.length >= 100 && (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                  <Button
                    onClick={handleTextSubmit}
                    disabled={textInput.trim().length < 100}
                    size="default"
                    className="w-full sm:w-auto min-h-[44px] text-xs md:text-sm lg:text-base"
                  >
                    Use This Text
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-3 md:p-4 bg-muted/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                    <Type className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base">Text Synopsis Submitted</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {textInput.length} characters
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetText}
                    className="p-2 hover:bg-destructive/10 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
