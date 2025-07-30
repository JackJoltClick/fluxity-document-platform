import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAuditLogService } from '@/src/services/audit/audit-log.service'
import { BusinessLogicService } from '@/src/services/accounting/business-logic.service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with cookies for authentication
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch the document to verify ownership and ensure it's completed
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !document) {
      console.error('Document fetch error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Only allow reprocessing for completed documents
    if (document.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Only completed documents can be reprocessed' },
        { status: 400 }
      )
    }

    // Ensure extracted data exists
    if (!document.extracted_data) {
      return NextResponse.json(
        { success: false, error: 'Document has no extracted data to reprocess' },
        { status: 400 }
      )
    }

    try {
      // Call Stage 19 business logic mapping service
      console.log(`🔄 REPROCESS: Starting reprocessing for document ${documentId}`)
      
      // Use the actual Stage 19 business logic service
      const businessLogicService = new BusinessLogicService()
      const mappingResult = await businessLogicService.processDocument(
        document.extracted_data, 
        user.id, 
        documentId
      )

      // Extract field values from mapping result
      const accountingFields = {
        company_code: mappingResult.company_code.value,
        supplier_invoice_transaction_type: mappingResult.supplier_invoice_transaction_type.value,
        invoicing_party: mappingResult.invoicing_party.value,
        supplier_invoice_id_by_invcg_party: mappingResult.supplier_invoice_id_by_invcg_party.value,
        document_date: mappingResult.document_date.value,
        posting_date: mappingResult.posting_date.value,
        accounting_document_type: mappingResult.accounting_document_type.value,
        accounting_document_header_text: mappingResult.accounting_document_header_text.value,
        document_currency: mappingResult.document_currency.value,
        invoice_gross_amount: mappingResult.invoice_gross_amount.value,
        gl_account: mappingResult.gl_account.value,
        supplier_invoice_item_text: mappingResult.supplier_invoice_item_text.value,
        debit_credit_code: mappingResult.debit_credit_code.value,
        supplier_invoice_item_amount: mappingResult.supplier_invoice_item_amount.value,
        tax_code: mappingResult.tax_code.value,
        tax_jurisdiction: mappingResult.tax_jurisdiction.value,
        assignment_reference: mappingResult.assignment_reference.value,
        cost_center: mappingResult.cost_center.value,
        profit_center: mappingResult.profit_center.value,
        internal_order: mappingResult.internal_order.value,
        wbs_element: mappingResult.wbs_element.value
      }

      const updateFields = {
        // Reset accounting status to needs_mapping for review
        accounting_status: 'needs_mapping',
        // Update all 21 accounting fields
        ...accountingFields,
        // Update mapping confidence
        mapping_confidence: mappingResult.overall_confidence,
        // Mark as requiring review if confidence is low
        requires_review: mappingResult.requires_review,
        updated_at: new Date().toISOString()
      }

      // Update the document with new accounting field mappings
      const { data: updatedDocument, error: updateError } = await supabase
        .from('documents')
        .update(updateFields)
        .eq('id', documentId)
        .select()
        .single()

      if (updateError) {
        console.error('Document update error:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update document with reprocessed data' },
          { status: 500 }
        )
      }

      // Audit log all field changes in batch - use the audit trail from Stage 19
      const auditService = getAuditLogService()
      const fieldChanges = mappingResult.audit_trail.map(entry => ({
        field_name: entry.field_name,
        input_value: entry.input_value,
        output_value: entry.output_value,
        confidence_score: entry.confidence_score,
        reasoning: `Full reprocess: ${entry.reasoning}`,
        mapping_source: 'full_reprocess' as const
      }))

      try {
        await auditService.logBatchFieldChanges(documentId, fieldChanges)
      } catch (auditError) {
        console.error('Audit logging failed:', auditError)
        // Continue - don't fail the main operation
      }

      console.log(`✅ REPROCESS: Document ${documentId} reprocessed successfully with ${Object.keys(accountingFields).length} fields updated`)

      return NextResponse.json({
        success: true,
        message: 'Document reprocessed successfully',
        document: updatedDocument,
        mapping: {
          confidence: mappingResult.overall_confidence,
          fieldsUpdated: Object.keys(accountingFields).length,
          changesLogged: fieldChanges.length,
          requiresReview: mappingResult.requires_review,
          processingNotes: mappingResult.processing_notes
        }
      })

    } catch (mappingError) {
      console.error('Stage 19 mapping error:', mappingError)
      return NextResponse.json(
        { success: false, error: 'Failed to reprocess accounting fields' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Reprocess endpoint error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

