import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void
  acceptedFileTypes?: Record<string, string[]>
  maxSize?: number
  className?: string
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  acceptedFileTypes = {
    'application/pdf': ['.pdf']
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  className
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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

  return (
    <div className={cn("w-full", className)}>
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragActive ? "Drop the PDF here..." : "Upload Film Synopsis"}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop a PDF file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
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
    </div>
  )
}
