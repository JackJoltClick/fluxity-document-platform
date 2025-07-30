import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { fieldReprocessSchema, sanitizeAccountingValue } from '@/src/lib/validation/accounting.schemas'
import { getAuditLogService } from '@/src/services/audit/audit-log.service'
import { BusinessLogicService } from '@/src/services/accounting/business-logic.service'
import { ZodError } from 'zod'

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

    // Parse and validate request body
    const rawRequestData = await request.json()
    
    let validatedRequest
    try {
      validatedRequest = fieldReprocessSchema.parse(rawRequestData)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation failed',
            details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        )
      }
      throw error
    }

    const { field } = validatedRequest

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

    // Store current value for audit logging
    const currentValue = document[field as keyof typeof document]

    try {
      // Call Stage 19 business logic for specific field
      console.log(`🔄 REPROCESS FIELD: Starting reprocessing for field ${field} in document ${documentId}`)
      
      const fieldMapping = await reprocessSingleField(field, document, user.id)

      // Sanitize the new value
      const sanitizedValue = sanitizeAccountingValue(field, fieldMapping.value)

      // Update only the specific field
      const updateData = {
        [field]: sanitizedValue,
        updated_at: new Date().toISOString()
      }

      const { data: updatedDocument, error: updateError } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId)
        .select()
        .single()

      if (updateError) {
        console.error('Document update error:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update document field' },
          { status: 500 }
        )
      }

      // Audit log the field reprocessing
      const auditService = getAuditLogService()
      try {
        await auditService.logFieldChange({
          document_id: documentId,
          field_name: field,
          input_value: currentValue,
          output_value: sanitizedValue,
          confidence_score: fieldMapping.confidence,
          reasoning: `Field reprocessed: ${fieldMapping.reasoning || 'Stage 19 business logic'}`,
          mapping_source: 'field_reprocess'
        })
      } catch (auditError) {
        console.error('Audit logging failed:', auditError)
        // Continue - don't fail the main operation
      }

      console.log(`✅ REPROCESS FIELD: Field ${field} reprocessed successfully for document ${documentId}`)

      return NextResponse.json({
        success: true,
        message: 'Field reprocessed successfully',
        document: updatedDocument,
        field: {
          name: field,
          value: sanitizedValue,
          confidence: fieldMapping.confidence,
          method: fieldMapping.method,
          reasoning: fieldMapping.reasoning
        }
      })

    } catch (mappingError) {
      console.error('Field reprocessing error:', mappingError)
      return NextResponse.json(
        { success: false, error: 'Failed to reprocess field' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Reprocess field endpoint error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Reprocess a single field using Stage 19 business logic
async function reprocessSingleField(fieldName: string, document: any, userId: string) {
  const businessLogicService = new BusinessLogicService()
  const extractedData = document.extracted_data

  if (!extractedData) {
    return {
      value: null,
      confidence: 0,
      method: 'no_data',
      reasoning: 'No extracted data available for reprocessing'
    }
  }

  try {
    // Use specific Stage 19 methods based on field type
    switch (fieldName) {
      case 'company_code':
        const supplierName = extractedData.supplier_name?.value || ''
        const companyMapping = await businessLogicService.mapCompanyCode(supplierName, userId)
        return {
          value: companyMapping.value,
          confidence: companyMapping.confidence,
          method: companyMapping.source,
          reasoning: companyMapping.reasoning
        }

      case 'gl_account':
        const description = extractedData.line_items?.map((item: any) => item.value).join('; ') || ''
        const amount = typeof extractedData.total_amount?.value === 'number' 
          ? extractedData.total_amount.value 
          : parseFloat(String(extractedData.total_amount?.value || 0))
        const glMapping = await businessLogicService.assignGLAccount(description, amount, userId)
        return {
          value: glMapping.value,
          confidence: glMapping.confidence,
          method: glMapping.source,
          reasoning: glMapping.reasoning
        }

      case 'cost_center':
        const supplierNameForCC = extractedData.supplier_name?.value || ''
        const descriptionForCC = extractedData.line_items?.map((item: any) => item.value).join('; ') || ''
        const costCenterMapping = await businessLogicService.determineCostCenter(supplierNameForCC, descriptionForCC, userId)
        return {
          value: costCenterMapping.value,
          confidence: costCenterMapping.confidence,
          method: costCenterMapping.source,
          reasoning: costCenterMapping.reasoning
        }

      case 'supplier_invoice_transaction_type':
        const transactionType = businessLogicService.setTransactionType('invoice')
        return {
          value: transactionType.value,
          confidence: transactionType.confidence,
          method: transactionType.source,
          reasoning: transactionType.reasoning
        }

      // Direct extraction mappings
      case 'invoicing_party':
        const supplier = extractedData.supplier_name?.value
        return {
          value: supplier || null,
          confidence: supplier ? extractedData.supplier_name.confidence || 0.8 : 0,
          method: 'extraction_mapping',
          reasoning: supplier ? 'Extracted supplier name from document' : 'No supplier name found'
        }

      case 'supplier_invoice_id_by_invcg_party':
        const invoiceNumber = extractedData.invoice_number?.value
        return {
          value: invoiceNumber || null,
          confidence: invoiceNumber ? extractedData.invoice_number.confidence || 0.9 : 0,
          method: 'extraction_mapping',
          reasoning: invoiceNumber ? 'Extracted invoice number from document' : 'No invoice number found'
        }

      case 'document_date':
        const invoiceDate = extractedData.invoice_date?.value
        return {
          value: invoiceDate || new Date().toISOString().split('T')[0],
          confidence: invoiceDate ? extractedData.invoice_date.confidence || 0.9 : 0.3,
          method: invoiceDate ? 'extraction_mapping' : 'default',
          reasoning: invoiceDate ? 'Extracted invoice date from document' : 'Used current date as fallback'
        }

      case 'invoice_gross_amount':
      case 'supplier_invoice_item_amount':
        const totalAmount = extractedData.total_amount?.value
        return {
          value: totalAmount || null,
          confidence: totalAmount ? extractedData.total_amount.confidence || 0.9 : 0,
          method: 'extraction_mapping',
          reasoning: totalAmount ? 'Extracted total amount from document' : 'No amount found'
        }

      case 'document_currency':
        const currency = extractedData.currency?.value || 'USD'
        return {
          value: currency.toUpperCase(),
          confidence: extractedData.currency?.value ? extractedData.currency.confidence || 0.8 : 0.7,
          method: extractedData.currency?.value ? 'extraction_mapping' : 'default',
          reasoning: extractedData.currency?.value ? 'Extracted currency from document' : 'Applied default USD currency'
        }

      // Business rule defaults
      case 'accounting_document_type':
        return {
          value: 'RE',
          confidence: 0.9,
          method: 'business_rule',
          reasoning: 'Standard vendor invoice document type'
        }

      case 'debit_credit_code':
        return {
          value: 'H',
          confidence: 1.0,
          method: 'business_rule',
          reasoning: 'Vendor invoices are always credit entries (H)'
        }

      case 'posting_date':
        return {
          value: new Date().toISOString().split('T')[0],
          confidence: 1.0,
          method: 'business_rule',
          reasoning: 'Set posting date to current date'
        }

      default:
        return {
          value: null,
          confidence: 0.3,
          method: 'no_mapping',
          reasoning: `No specific reprocessing logic available for field ${fieldName}`
        }
    }
  } catch (error) {
    console.error(`Error reprocessing field ${fieldName}:`, error)
    return {
      value: null,
      confidence: 0,
      method: 'error',
      reasoning: `Error during reprocessing: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}