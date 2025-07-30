import crypto from 'crypto'

/**
 * Test script for Mailgun webhook security features
 * Run with: npx tsx scripts/test-mailgun-webhook-security.ts
 */

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/mailgun'
const SIGNING_KEY = 'test-signing-key' // Use your actual key for testing

interface TestResult {
  test: string
  expected: string
  actual: string
  passed: boolean
}

const results: TestResult[] = []

function generateSignature(timestamp: string, token: string, signingKey: string): string {
  return crypto
    .createHmac('sha256', signingKey)
    .update(timestamp + token)
    .digest('hex')
}

async function testWebhook(
  testName: string,
  timestamp: string,
  token: string,
  signature: string,
  expectedStatus: number
): Promise<void> {
  const formData = new FormData()
  formData.append('timestamp', timestamp)
  formData.append('token', token)
  formData.append('signature', signature)
  formData.append('from', 'test@example.com')
  formData.append('subject', 'Test Email')
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData
    })
    
    results.push({
      test: testName,
      expected: `Status ${expectedStatus}`,
      actual: `Status ${response.status}`,
      passed: response.status === expectedStatus
    })
  } catch (error) {
    results.push({
      test: testName,
      expected: `Status ${expectedStatus}`,
      actual: `Error: ${error instanceof Error ? error.message : String(error)}`,
      passed: false
    })
  }
}

async function runTests() {
  console.log('🧪 Testing Mailgun Webhook Security...\n')
  
  // Test 1: Valid webhook
  const validTimestamp = Math.floor(Date.now() / 1000).toString()
  const validToken = crypto.randomBytes(32).toString('hex')
  const validSignature = generateSignature(validTimestamp, validToken, SIGNING_KEY)
  
  await testWebhook(
    'Valid webhook signature',
    validTimestamp,
    validToken,
    validSignature,
    404 // Expected because email not registered
  )
  
  // Test 2: Replay attack (same token twice)
  await new Promise(resolve => setTimeout(resolve, 100))
  await testWebhook(
    'Replay attack prevention',
    validTimestamp,
    validToken,
    validSignature,
    401 // Should be rejected
  )
  
  // Test 3: Old timestamp (6 minutes old)
  const oldTimestamp = (Math.floor(Date.now() / 1000) - 360).toString()
  const oldToken = crypto.randomBytes(32).toString('hex')
  const oldSignature = generateSignature(oldTimestamp, oldToken, SIGNING_KEY)
  
  await testWebhook(
    'Old timestamp rejection',
    oldTimestamp,
    oldToken,
    oldSignature,
    401
  )
  
  // Test 4: Future timestamp (2 minutes in future)
  const futureTimestamp = (Math.floor(Date.now() / 1000) + 120).toString()
  const futureToken = crypto.randomBytes(32).toString('hex')
  const futureSignature = generateSignature(futureTimestamp, futureToken, SIGNING_KEY)
  
  await testWebhook(
    'Future timestamp rejection',
    futureTimestamp,
    futureToken,
    futureSignature,
    401
  )
  
  // Test 5: Invalid signature
  const invalidTimestamp = Math.floor(Date.now() / 1000).toString()
  const invalidToken = crypto.randomBytes(32).toString('hex')
  const invalidSignature = 'invalid-signature'
  
  await testWebhook(
    'Invalid signature rejection',
    invalidTimestamp,
    invalidToken,
    invalidSignature,
    401
  )
  
  // Test 6: Missing parameters
  const formData = new FormData()
  formData.append('timestamp', validTimestamp)
  // Missing token and signature
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData
    })
    
    results.push({
      test: 'Missing parameters rejection',
      expected: 'Status 400',
      actual: `Status ${response.status}`,
      passed: response.status === 400
    })
  } catch (error) {
    results.push({
      test: 'Missing parameters rejection',
      expected: 'Status 400',
      actual: `Error: ${error instanceof Error ? error.message : String(error)}`,
      passed: false
    })
  }
  
  // Test 7: Rate limiting (send 101 requests)
  console.log('Testing rate limiting (this may take a moment)...')
  let rateLimitHit = false
  
  for (let i = 0; i < 102; i++) {
    const rlTimestamp = Math.floor(Date.now() / 1000).toString()
    const rlToken = crypto.randomBytes(32).toString('hex')
    const rlSignature = generateSignature(rlTimestamp, rlToken, SIGNING_KEY)
    
    const formData = new FormData()
    formData.append('timestamp', rlTimestamp)
    formData.append('token', rlToken)
    formData.append('signature', rlSignature)
    formData.append('from', 'test@example.com')
    
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'x-forwarded-for': '192.168.1.1' // Simulate same IP
        }
      })
      
      if (response.status === 429) {
        rateLimitHit = true
        break
      }
    } catch (error) {
      // Ignore errors for rate limit test
    }
    
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  results.push({
    test: 'Rate limiting (100 requests/hour)',
    expected: 'Rate limit hit',
    actual: rateLimitHit ? 'Rate limit hit' : 'Rate limit not hit',
    passed: rateLimitHit
  })
  
  // Print results
  console.log('\n📊 Test Results:\n')
  console.log('Test Name                          | Expected       | Actual         | Result')
  console.log('-----------------------------------|----------------|----------------|--------')
  
  results.forEach(result => {
    const testName = result.test.padEnd(34)
    const expected = result.expected.padEnd(14)
    const actual = result.actual.padEnd(14)
    const status = result.passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${testName} | ${expected} | ${actual} | ${status}`)
  })
  
  const passed = results.filter(r => r.passed).length
  const total = results.length
  
  console.log(`\n🎯 Summary: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('✅ All security tests passed!')
  } else {
    console.log('❌ Some security tests failed. Please review and fix.')
  }
}

// Run tests
runTests().catch(console.error)