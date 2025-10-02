// Application Constants

// API Configuration
export const API_CONFIG = {
  // AWS Lambda API Gateway endpoint
  BASE_URL: import.meta.env?.VITE_API_BASE_URL ||
    (import.meta.env?.PROD
      ? 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod'
      : 'http://localhost:8080'),
  FUNCTIONS_BASE: '', // Not used with AWS Lambda
  TIMEOUT: 900000, // 15 minutes for AWS Lambda timeout
} as const

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['application/pdf'],
  MAX_VIDEO_SIZE: 20 * 1024 * 1024, // 20MB for video processing
} as const

// AI Model Configuration
export const AI_CONFIG = {
  OPENAI_MODEL: 'openai.gpt-oss-120b-1:0',
  GEMINI_MODEL: 'gemini-2.5-flash-lite',
  TRANSCRIPT_THRESHOLD: 50, // words - below this triggers visual analysis
  MAX_TOKENS: 2000,
} as const

// UI Configuration
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 5000,
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'File type not supported.',
  ANALYSIS_FAILED: 'Analysis failed. Please try again.',
  MISSING_FIELDS: 'Please provide all required information.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  ANALYSIS_COMPLETE: 'Film analysis completed successfully!',
  FILE_UPLOADED: 'File uploaded successfully.',
  AUDIO_GENERATED: 'Audio briefing generated.',
} as const
