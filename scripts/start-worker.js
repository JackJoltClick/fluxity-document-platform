#!/usr/bin/env node

// Simple script to start the document worker
// This should be run alongside the Next.js application

const path = require('path')

// Set up environment - load from .env.local if it exists
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

console.log('🚀 Starting document worker...')
console.log('📋 Environment check:')
console.log('   EXTRACTION_SERVICE:', process.env.EXTRACTION_SERVICE || 'not set')
console.log('   SIMPLE_MAPPING_MODE:', process.env.SIMPLE_MAPPING_MODE || 'not set')
console.log('   REDIS_HOST:', process.env.REDIS_HOST || 'localhost')
console.log('   REDIS_PORT:', process.env.REDIS_PORT || '6379')

// Start the worker using tsx
const { spawn } = require('child_process')
const workerPath = path.join(__dirname, '..', 'src', 'workers', 'document.worker.ts')

console.log('🔧 Starting worker with tsx...')
const worker = spawn('npx', ['tsx', workerPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: { ...process.env }  // Explicitly pass environment variables
})

worker.on('error', (error) => {
  console.error('❌ Worker error:', error)
  process.exit(1)
})

worker.on('close', (code) => {
  console.log(`📱 Worker exited with code ${code}`)
  process.exit(code)
})

console.log('✅ Worker started successfully')

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('📱 Received SIGTERM, shutting down worker...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('📱 Received SIGINT, shutting down worker...')
  process.exit(0)
})