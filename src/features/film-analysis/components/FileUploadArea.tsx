import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Type, Clipboard } from 'lucide-react'
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize,
    multiple: false
  })

  const removeFile = () => {
    setSelectedFile(null)
  }

  const handleTextSubmit = () => {
    if (textInput.trim()) {
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
      <div className="flex space-x-2 mb-4">
        <Button
          variant={inputMode === 'file' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputMode('file')}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload PDF
        </Button>
        <Button
          variant={inputMode === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputMode('text')}
          className="flex-1"
        >
          <Type className="h-4 w-4 mr-2" />
          Paste Text
        </Button>
      </div>

      {/* File Upload Mode */}
      {inputMode === 'file' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Upload PDF File
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isDragActive ? "Drop the PDF here..." : "Drag & drop PDF file"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse • Max {Math.round(maxSize / 1024 / 1024)}MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-1 hover:bg-destructive/10 rounded transition-colors"
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Clipboard className="h-4 w-4 mr-2" />
              Paste Film Synopsis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!textSubmitted ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Paste your film synopsis here... (minimum 100 characters)"
                  value={textInput}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextInput(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {textInput.length} characters
                    {textInput.length < 100 && (
                      <span className="text-destructive"> (minimum 100)</span>
                    )}
                  </p>
                  <Button
                    onClick={handleTextSubmit}
                    disabled={textInput.trim().length < 100}
                    size="sm"
                  >
                    Use This Text
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Type className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Text Synopsis Submitted</p>
                      <p className="text-xs text-muted-foreground">
                        {textInput.length} characters
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetText}
                    className="p-1 hover:bg-destructive/10 rounded transition-colors"
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
