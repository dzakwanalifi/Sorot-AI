import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { TranscribeClient, ListTranscriptionJobsCommand } from '@aws-sdk/client-transcribe'
import { PollyClient, DescribeVoicesCommand } from '@aws-sdk/client-polly'
import { config } from 'dotenv'

config({ path: '.env' })

console.log('🔍 Testing AWS Services Integration...\n')

// Test Bedrock
async function testBedrock() {
  try {
    console.log('Testing AWS Bedrock (OpenAI gpt-oss-120b)...')

    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    })

    const command = new InvokeModelCommand({
      modelId: 'openai.gpt-oss-120b-1:0',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Hello! Confirm you are OpenAI gpt-oss-120b model ready for film analysis.'
          }
        ],
        max_tokens: 100
      }),
      contentType: 'application/json',
      accept: 'application/json'
    })

    const response = await client.send(command)
    const result = JSON.parse(new TextDecoder().decode(response.body))

    console.log('✅ Bedrock test successful!')
    console.log('Response:', result.choices[0].message.content.substring(0, 50) + '...')

    return true
  } catch (error) {
    console.error('❌ Bedrock test failed:', error.message)
    return false
  }
}

// Test Transcribe
async function testTranscribe() {
  try {
    console.log('Testing AWS Transcribe...')

    const client = new TranscribeClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    })

    const command = new ListTranscriptionJobsCommand({
      MaxResults: 1
    })

    const response = await client.send(command)

    console.log('✅ Transcribe test successful!')
    console.log('Jobs found:', response.TranscriptionJobSummaries?.length || 0)

    return true
  } catch (error) {
    console.error('❌ Transcribe test failed:', error.message)
    return false
  }
}

// Test Polly
async function testPolly() {
  try {
    console.log('Testing AWS Polly...')

    const client = new PollyClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    })

    const command = new DescribeVoicesCommand({
      LanguageCode: 'en-US'
    })

    const response = await client.send(command)

    console.log('✅ Polly test successful!')
    console.log('Voices available:', response.Voices?.length || 0)

    return true
  } catch (error) {
    console.error('❌ Polly test failed:', error.message)
    return false
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting AWS Services Integration Tests\n')

  const results = await Promise.all([
    testBedrock(),
    testTranscribe(),
    testPolly()
  ])

  const allPassed = results.every(result => result)

  console.log('\n' + '='.repeat(50))
  if (allPassed) {
    console.log('🎉 ALL AWS SERVICES TESTS PASSED!')
    console.log('✅ Sorot.AI ready for film analysis')
    console.log('✅ OpenAI gpt-oss-120b via Bedrock: Active')
    console.log('✅ AWS Transcribe: Ready for audio transcription')
    console.log('✅ AWS Polly: Ready for audio briefing generation')
  } else {
    console.log('❌ SOME TESTS FAILED - Check permissions')
  }

  return allPassed
}

runAllTests()
