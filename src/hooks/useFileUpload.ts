import { useState, useCallback } from 'react'
import { UPLOAD_CONFIG, ERROR_MESSAGES } from '../constants'

export interface FileUploadResult {
  file: File | null
  error: string | null
  isValid: boolean
}

export const useFileUpload = () => {
  const [uploadResult, setUploadResult] = useState<FileUploadResult>({
    file: null,
    error: null,
    isValid: false,
  })

  const validateFile = useCallback((file: File): { isValid: boolean; error: string | null } => {
    // Check file size
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.FILE_TOO_LARGE,
      }
    }

    // Check file type
    if (!UPLOAD_CONFIG.ALLOWED_FILE_TYPES.includes(file.type as any)) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_FILE_TYPE,
      }
    }

    return { isValid: true, error: null }
  }, [])

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) {
      setUploadResult({
        file: null,
        error: null,
        isValid: false,
      })
      return
    }

    const validation = validateFile(file)

    setUploadResult({
      file: validation.isValid ? file : null,
      error: validation.error,
      isValid: validation.isValid,
    })
  }, [validateFile])

  const clearUpload = useCallback(() => {
    setUploadResult({
      file: null,
      error: null,
      isValid: false,
    })
  }, [])

  return {
    ...uploadResult,
    handleFileSelect,
    clearUpload,
    validateFile,
  }
}
