// Simple test to check if processing pipeline can be imported
import { processFilmAnalysis } from './src/features/film-analysis/services/processingPipeline.js'

console.log('Testing import...')
console.log('processFilmAnalysis:', typeof processFilmAnalysis)

try {
  // Test with minimal data
  const result = await processFilmAnalysis('dGVzdA==', 'https://youtube.com/watch?v=test')
  console.log('Result:', result)
} catch (error) {
  console.error('Error:', error.message)
  console.error('Stack:', error.stack)
}
