// Test different ways to load environment variables
import { readFileSync } from 'fs'
import { config } from 'dotenv'

console.log('🔍 Testing Environment Loading...\n')

// Method 1: Direct file read
console.log('Method 1: Direct file read')
try {
  const envContent = readFileSync('.env', 'utf8')
  const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/)
  if (apiKeyMatch) {
    const directKey = apiKeyMatch[1].trim()
    console.log('✅ Direct read - API key found')
    console.log('Length:', directKey.length)
    console.log('Starts with AIza:', directKey.startsWith('AIza'))
  } else {
    console.log('❌ Direct read - API key not found')
  }
} catch (error) {
  console.log('❌ Direct read failed:', error.message)
}

console.log('\n' + '='.repeat(50) + '\n')

// Method 2: dotenv config
console.log('Method 2: dotenv config')
try {
  const result = config({ path: '.env' })
  console.log('dotenv loaded:', result.parsed ? 'Yes' : 'No')
  console.log('Error:', result.error?.message || 'None')

  console.log('process.env.GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY)
  if (process.env.GEMINI_API_KEY) {
    console.log('Length:', process.env.GEMINI_API_KEY.length)
    console.log('Starts with AIza:', process.env.GEMINI_API_KEY.startsWith('AIza'))
  }
} catch (error) {
  console.log('❌ dotenv failed:', error.message)
}

console.log('\n' + '='.repeat(50) + '\n')

// Method 3: Test with actual API call
console.log('Method 3: Test API call with loaded key')
if (process.env.GEMINI_API_KEY) {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    console.log('📡 Testing API call...')
    const result = await model.generateContent('Hello!')
    const response = await result.response
    console.log('✅ API call successful!')
    console.log('Response:', response.text().substring(0, 50) + '...')

  } catch (error) {
    console.log('❌ API call failed:', error.message)
  }
} else {
  console.log('❌ No GEMINI_API_KEY in process.env')
}
