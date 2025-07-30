// Load environment variables first
import dotenv from 'dotenv'
import path from 'path'

// Load .env.local and .env files
dotenv.config({ path: path.join(__dirname, '../../.env.local') })
dotenv.config({ path: path.join(__dirname, '../../.env') })

import { Worker } from 'bullmq'
import { supabaseAdmin } from '@/src/lib/supabase/auth-server'
import { ExtractionRouterService } from '@/src/services/extraction/extraction-router.service'
import { BusinessLogicService } from '@/src/services/accounting/business-logic.service'
import { DocumentJobData, DocumentJobResult } from '@/src/lib/queue/queues'
import { AccountingMappingResult } from '@/src/types/accounting.types'
import Redis from 'ioredis'

console.log('🚀 Document worker process started')
console.log('📋 Environment:')
console.log('  EXTRACTION_SERVICE:', process.env.EXTRACTION_SERVICE)
console.log('  SIMPLE_MAPPING_MODE:', process.env.SIMPLE_MAPPING_MODE)
console.log('  REDIS_HOST:', process.env.REDIS_HOST || 'localhost')
console.log('  REDIS_PORT:', process.env.REDIS_PORT || '6379')

// Simplified Redis connection for worker
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

redis.on('connect', () => {
  console.log('✅ Worker: Redis connected successfully')
})

redis.on('error', (err) => {
  console.error('❌ Worker: Redis error:', err.message)
})

// Document processing worker
const documentWorker = new Worker(
  'document-processing',
  async (job) => {
    const { documentId, userId, fileUrl, filename } = job.data as DocumentJobData
    const startTime = Date.now()
    
    console.log(`🔄 WORKER: Processing job ${job.id} for document ${documentId} (${filename})`)
    console.log(`📊 WORKER: Job data:`, { documentId, userId, filename, fileUrl })
    
    try {
      // Update document status to 'processing'
      await updateDocumentStatus(documentId, 'processing')
      await job.updateProgress(25)
      
      // Initialize extraction router
      console.log(`🤖 WORKER: Initializing extraction router for ${documentId}`)
      const extractionRouter = new ExtractionRouterService()
      await job.updateProgress(35)
      
      // Perform extraction
      console.log(`📄 WORKER: Starting extraction for ${fileUrl}`)
      const extractionResult = await extractionRouter.extract(fileUrl)
      await job.updateProgress(60)
      
      // Process business logic mapping
      console.log(`🧠 WORKER: Processing business logic mapping for ${documentId}`)
      const businessLogicService = new BusinessLogicService()
      const mappingResult = await businessLogicService.processDocument(extractionResult as any, userId, documentId)
      await job.updateProgress(80)
      
      // Update document with extraction and mapping results
      console.log(`💾 WORKER: Saving extraction and mapping results for ${documentId}`)
      await updateDocumentWithResults(documentId, extractionResult, extractionRouter, mappingResult)
      await job.updateProgress(90)
      
      // Update final status to completed
      await updateDocumentStatus(documentId, 'completed')
      await job.updateProgress(100)
      
      const processingTime = Date.now() - startTime
      console.log(`✅ WORKER: Document ${documentId} processed successfully in ${processingTime}ms`)
      
      const result: DocumentJobResult = {
        success: true,
        extractedData: extractionResult,
        method: extractionResult.extraction_method,
        cost: extractionResult.total_cost,
        processingTime
      }
      
      return result
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error'
      
      console.error(`❌ WORKER: Document ${documentId} processing failed:`, errorMessage)
      
      // Update document status to failed with error details
      try {
        await updateDocumentWithError(documentId, errorMessage)
      } catch (updateError) {
        console.error(`❌ WORKER: Failed to update document ${documentId} with error:`, updateError)
      }
      
      const result: DocumentJobResult = {
        success: false,
        error: errorMessage,
        processingTime
      }
      
      // Re-throw error to mark job as failed
      throw new Error(`Document processing failed: ${errorMessage}`)
    }
  },
  {
    connection: redis,
    concurrency: 5, // Process up to 5 documents simultaneously
  }
)

// Helper function to update document status
async function updateDocumentStatus(documentId: string, status: string) {
  try {
    const supabase = supabaseAdmin
    
    const { error } = await supabase
      .from('documents')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
    
    if (error) {
      throw new Error(`Failed to update document status: ${error.message}`)
    }
    
    console.log(`📋 WORKER: Document ${documentId} status updated to: ${status}`)
  } catch (error) {
    console.error(`❌ WORKER: Failed to update document ${documentId} status:`, error)
    throw error
  }
}

// Helper function to update document with extraction and mapping results
async function updateDocumentWithResults(
  documentId: string, 
  extractionResult: any, 
  extractionRouter: ExtractionRouterService,
  mappingResult?: AccountingMappingResult
) {
  try {
    const supabase = supabaseAdmin
    
    // Prepare update object with extraction data
    const updateData: any = {
      status: 'completed',
      extracted_data: extractionResult,
      extraction_method: extractionResult.extraction_method,
      extraction_cost: extractionResult.total_cost,
      updated_at: new Date().toISOString()
    }
    
    // Add accounting fields if mapping result is available
    if (mappingResult) {
      console.log(`🧠 WORKER: Adding accounting mappings with overall confidence: ${mappingResult.overall_confidence}`)
      
      updateData.company_code = mappingResult.company_code.value
      updateData.supplier_invoice_transaction_type = mappingResult.supplier_invoice_transaction_type.value
      updateData.invoicing_party = mappingResult.invoicing_party.value
      updateData.supplier_invoice_id_by_invcg_party = mappingResult.supplier_invoice_id_by_invcg_party.value
      updateData.document_date = mappingResult.document_date.value
      updateData.posting_date = mappingResult.posting_date.value
      updateData.accounting_document_type = mappingResult.accounting_document_type.value
      updateData.accounting_document_header_text = mappingResult.accounting_document_header_text.value
      updateData.document_currency = mappingResult.document_currency.value
      updateData.invoice_gross_amount = mappingResult.invoice_gross_amount.value
      updateData.gl_account = mappingResult.gl_account.value
      updateData.supplier_invoice_item_text = mappingResult.supplier_invoice_item_text.value
      updateData.debit_credit_code = mappingResult.debit_credit_code.value
      updateData.supplier_invoice_item_amount = mappingResult.supplier_invoice_item_amount.value
      updateData.tax_code = mappingResult.tax_code.value
      updateData.tax_jurisdiction = mappingResult.tax_jurisdiction.value
      updateData.assignment_reference = mappingResult.assignment_reference.value
      updateData.cost_center = mappingResult.cost_center.value
      updateData.profit_center = mappingResult.profit_center.value
      updateData.internal_order = mappingResult.internal_order.value
      updateData.wbs_element = mappingResult.wbs_element.value
      
      // Set accounting workflow fields
      updateData.mapping_confidence = mappingResult.overall_confidence
      updateData.requires_review = mappingResult.requires_review
      
      // Determine accounting status based on completeness and confidence
      if (mappingResult.overall_confidence >= 0.8 && !mappingResult.requires_review) {
        updateData.accounting_status = 'ready_for_export'
      } else {
        updateData.accounting_status = 'needs_mapping'
      }
      
      console.log(`🧠 WORKER: Accounting status set to: ${updateData.accounting_status}`)
      console.log(`🧠 WORKER: Mapping notes: ${mappingResult.processing_notes.join('; ')}`)
    } else {
      console.log(`⚠️ WORKER: No mapping result available, setting accounting status to needs_mapping`)
      updateData.accounting_status = 'needs_mapping'
      updateData.requires_review = true
      updateData.mapping_confidence = 0
    }
    
    const { error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
    
    if (error) {
      throw new Error(`Failed to save extraction and mapping results: ${error.message}`)
    }
    
    console.log(`💾 WORKER: Document ${documentId} extraction and mapping results saved successfully`)
    
    if (mappingResult) {
      console.log(`📊 WORKER: Business logic summary:`)
      console.log(`  - Overall confidence: ${Math.round(mappingResult.overall_confidence * 100)}%`)
      console.log(`  - Requires review: ${mappingResult.requires_review}`)
      console.log(`  - Processing notes: ${mappingResult.processing_notes.length}`)
      console.log(`  - Audit trail entries: ${mappingResult.audit_trail.length}`)
    }
  } catch (error) {
    console.error(`❌ WORKER: Failed to save extraction and mapping results for ${documentId}:`, error)
    throw error
  }
}

// Helper function to update document with error details
async function updateDocumentWithError(documentId: string, errorMessage: string) {
  try {
    const supabase = supabaseAdmin
    
    const { error } = await supabase
      .from('documents')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
    
    if (error) {
      throw new Error(`Failed to update document with error: ${error.message}`)
    }
    
    console.log(`📋 WORKER: Document ${documentId} marked as failed with error: ${errorMessage}`)
  } catch (error) {
    console.error(`❌ WORKER: Failed to update document ${documentId} with error:`, error)
    throw error
  }
}

// Worker event listeners for monitoring
documentWorker.on('completed', (job, result) => {
  console.log(`✅ WORKER: Job ${job.id} completed successfully`)
  console.log(`📊 WORKER: Result:`, result)
})

documentWorker.on('failed', (job, err) => {
  console.error(`❌ WORKER: Job ${job?.id} failed:`, err.message)
})

documentWorker.on('progress', (job, progress) => {
  console.log(`🔄 WORKER: Job ${job.id} progress: ${progress}%`)
})

documentWorker.on('error', (err) => {
  console.error('❌ WORKER: Worker error:', err)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 WORKER: Received SIGTERM, shutting down gracefully...')
  await documentWorker.close()
  await redis.quit()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('🔄 WORKER: Received SIGINT, shutting down gracefully...')
  await documentWorker.close()
  await redis.quit()
  process.exit(0)
})

console.log('✨ Document worker ready and waiting for jobs...')

export default documentWorker