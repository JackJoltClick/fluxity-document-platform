#!/usr/bin/env tsx

// Load environment variables first
import { config } from 'dotenv'
import { join } from 'path'

// Load .env.local first, then .env
config({ path: join(__dirname, '..', '.env.local') })
config({ path: join(__dirname, '..', '.env') })

// Start the document worker process
import '../src/workers/document.worker'

console.log('🚀 Document worker process started')
console.log('📋 Environment:')
console.log('   EXTRACTION_SERVICE:', process.env.EXTRACTION_SERVICE || 'not set')
console.log('   REDIS_HOST:', process.env.REDIS_HOST || 'localhost')
console.log('   REDIS_PORT:', process.env.REDIS_PORT || '6379')

// Keep process alive
process.on('SIGTERM', () => {
  console.log('📱 Received SIGTERM, shutting down worker...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('📱 Received SIGINT, shutting down worker...')
  process.exit(0)
})