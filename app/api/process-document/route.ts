import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase/auth-server'
import { ExtractionRouterService } from '@/src/services/extraction/extraction-router.service'
import { BusinessLogicService } from '@/src/services/accounting/business-logic.service'
import { AccountingMappingResult } from '@/src/types/accounting.types'
import { SQSService } from '@/src/services/queue/sqs.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 API: Processing document ${documentId}`)

    // Get document details
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      console.error('Document fetch error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    if (document.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Document already processed',
        document
      })
    }

    // Check if SQS is enabled
    const sqsService = new SQSService()
    const useSQS = await sqsService.isEnabled()

    if (useSQS) {
      try {
        console.log(`📤 API: Using SQS - Queuing document ${documentId} for processing`)
        
        // Update status to queued
        await updateDocumentStatus(documentId, 'queued')
        
        // Send to SQS queue
        await sqsService.sendDocumentForProcessing(documentId, document.user_id)
        
        return NextResponse.json({
          success: true,
          message: 'Document queued for processing',
          document: { ...document, status: 'queued' },
          method: 'sqs'
        })
        
      } catch (sqsError) {
        console.error(`❌ API: SQS queueing failed for ${documentId}:`, sqsError)
        // Fall back to direct processing
        console.log(`🔄 API: Falling back to direct processing for ${documentId}`)
      }
    }

    // Direct processing (original code)
    console.log(`🔄 API: Using direct processing for document ${documentId}`)
    const startTime = Date.now()

    try {
      // Update status to processing
      await updateDocumentStatus(documentId, 'processing')

      // Initialize extraction router
      console.log(`🤖 API: Initializing extraction router for ${documentId}`)
      const extractionRouter = new ExtractionRouterService()

      // Perform extraction
      console.log(`📄 API: Starting extraction for ${document.file_url}`)
      const extractionResult = await extractionRouter.extract(document.file_url)

      // Process business logic mapping
      console.log(`🧠 API: Processing business logic mapping for ${documentId}`)
      const businessLogicService = new BusinessLogicService()
      const mappingResult = await businessLogicService.processDocument(
        extractionResult as any,
        document.user_id,
        documentId
      )

      // Update document with results
      console.log(`💾 API: Saving extraction and mapping results for ${documentId}`)
      await updateDocumentWithResults(documentId, extractionResult, extractionRouter, mappingResult)

      // Update final status
      await updateDocumentStatus(documentId, 'completed')

      const processingTime = Date.now() - startTime
      console.log(`✅ API: Document ${documentId} processed successfully in ${processingTime}ms`)

      // Get updated document
      const { data: updatedDocument } = await supabaseAdmin
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      return NextResponse.json({
        success: true,
        message: 'Document processed successfully',
        document: updatedDocument,
        processingTime,
        method: 'direct'
      })

    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error'

      console.error(`❌ API: Document ${documentId} processing failed:`, errorMessage)

      // Update document status to failed
      try {
        await updateDocumentWithError(documentId, errorMessage)
      } catch (updateError) {
        console.error(`❌ API: Failed to update document ${documentId} with error:`, updateError)
      }

      return NextResponse.json(
        { 
          success: false, 
          error: `Processing failed: ${errorMessage}`,
          processingTime
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions (same as worker)
async function updateDocumentStatus(documentId: string, status: string) {
  const { error } = await supabaseAdmin
    .from('documents')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)

  if (error) {
    throw new Error(`Failed to update document status: ${error.message}`)
  }

  console.log(`📋 API: Document ${documentId} status updated to: ${status}`)
}

async function updateDocumentWithResults(
  documentId: string, 
  extractionResult: any, 
  extractionRouter: ExtractionRouterService,
  mappingResult?: AccountingMappingResult
) {
  const updateData: any = {
    status: 'completed',
    extracted_data: extractionResult,
    extraction_method: extractionResult.extraction_method,
    extraction_cost: extractionResult.total_cost,
    updated_at: new Date().toISOString()
  }

  // Add accounting fields if mapping result is available
  if (mappingResult) {
    console.log(`🧠 API: Adding accounting mappings with overall confidence: ${mappingResult.overall_confidence}`)
    
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
    
    updateData.mapping_confidence = mappingResult.overall_confidence
    updateData.requires_review = mappingResult.requires_review
    
    if (mappingResult.overall_confidence >= 0.8 && !mappingResult.requires_review) {
      updateData.accounting_status = 'ready_for_export'
    } else {
      updateData.accounting_status = 'needs_mapping'
    }
  } else {
    updateData.accounting_status = 'needs_mapping'
    updateData.requires_review = true
    updateData.mapping_confidence = 0
  }

  const { error } = await supabaseAdmin
    .from('documents')
    .update(updateData)
    .eq('id', documentId)

  if (error) {
    throw new Error(`Failed to save extraction and mapping results: ${error.message}`)
  }

  console.log(`💾 API: Document ${documentId} extraction and mapping results saved successfully`)
}

async function updateDocumentWithError(documentId: string, errorMessage: string) {
  const { error } = await supabaseAdmin
    .from('documents')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)

  if (error) {
    throw new Error(`Failed to update document with error: ${error.message}`)
  }

  console.log(`📋 API: Document ${documentId} marked as failed with error: ${errorMessage}`)
}