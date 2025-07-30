import { Queue } from 'bullmq'

// Re-enable internal queue - external service was causing issues
export let documentQueue: Queue | null = null

if (process.env.REDIS_URL && typeof window === 'undefined') {
  try {
    documentQueue = new Queue('document-processing', {
      connection: {
        url: process.env.REDIS_URL,
        maxRetriesPerRequest: null,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    })
    console.log('✅ Queue: Internal queue re-enabled')
  } catch (error) {
    console.error('❌ Queue: Failed to initialize:', error)
    documentQueue = null
  }
} else {
  console.log('📦 Queue: Redis not available - queue disabled')
}

// Document processing job data interface
export interface DocumentJobData {
  documentId: string
  userId: string
  fileUrl: string
  filename: string
}

// Job result interface
export interface DocumentJobResult {
  success: boolean
  extractedData?: any
  method?: string
  cost?: number
  error?: string
  processingTime?: number
}

// Queue health check function - disabled for external worker
export const checkQueueHealth = async (): Promise<{
  redis: 'connected' | 'error' | 'disconnected'
  worker: 'active' | 'inactive'
  error?: string
}> => {
  return {
    redis: 'disconnected',
    worker: 'inactive',
    error: 'Using external Railway worker service'
  }
}

// Graceful shutdown function - disabled for external worker
export const closeQueue = async () => {
  console.log('✅ Queue: External worker service - no shutdown required')
}

// Queue event listeners for monitoring
// Note: Commenting out due to TypeScript compatibility issues with Bull queue events
// documentQueue.on('completed', (job) => {
//   console.log(`✅ Queue: Job ${job.id} completed for document ${job.data.documentId}`)
// })

// documentQueue.on('failed', (job, err) => {
//   console.error(`❌ Queue: Job ${job?.id} failed for document ${job?.data?.documentId}:`, err.message)
// })

// documentQueue.on('progress', (job, progress) => {
//   console.log(`🔄 Queue: Job ${job.id} progress: ${progress}%`)
// })

export default documentQueue