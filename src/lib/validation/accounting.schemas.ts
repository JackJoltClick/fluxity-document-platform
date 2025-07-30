import { z } from 'zod'

// Allowed accounting fields for updates
export const ACCOUNTING_FIELDS = [
  'accounting_status',
  'mapping_confidence',
  'requires_review',
  'company_code',
  'supplier_invoice_transaction_type',
  'invoicing_party',
  'supplier_invoice_id_by_invcg_party',
  'document_date',
  'posting_date',
  'accounting_document_type',
  'accounting_document_header_text',
  'document_currency',
  'invoice_gross_amount',
  'gl_account',
  'supplier_invoice_item_text',
  'debit_credit_code',
  'supplier_invoice_item_amount',
  'tax_code',
  'tax_jurisdiction',
  'assignment_reference',
  'cost_center',
  'profit_center',
  'internal_order',
  'wbs_element'
] as const

export type AccountingField = typeof ACCOUNTING_FIELDS[number]

// Document PATCH request validation
export const documentPatchSchema = z.object({
  // Workflow fields
  accounting_status: z.enum(['needs_mapping', 'ready_for_export', 'exported']).optional(),
  mapping_confidence: z.number().min(0).max(1).optional(),
  requires_review: z.boolean().optional(),
  
  // Company and invoice identification
  company_code: z.string().max(10).optional().nullable(),
  supplier_invoice_transaction_type: z.enum(['INVOICE', 'CREDIT', 'FREIGHT', 'MISC']).optional().nullable(),
  invoicing_party: z.string().max(255).optional().nullable(),
  supplier_invoice_id_by_invcg_party: z.string().max(50).optional().nullable(),
  
  // Date fields (ISO date strings)
  document_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be valid date in YYYY-MM-DD format').optional().nullable(),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be valid date in YYYY-MM-DD format').optional().nullable(),
  
  // Document metadata
  accounting_document_type: z.enum(['RE', 'KR', 'KG']).optional().nullable(),
  accounting_document_header_text: z.string().max(255).optional().nullable(),
  document_currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']).optional().nullable(),
  invoice_gross_amount: z.number().positive('Amount must be positive').optional().nullable(),
  
  // GL accounting fields
  gl_account: z.string().regex(/^\d{6}$/, 'GL account must be 6 digits').optional().nullable(),
  supplier_invoice_item_text: z.string().max(500).optional().nullable(),
  debit_credit_code: z.enum(['D', 'C']).optional().nullable(),
  supplier_invoice_item_amount: z.number().optional().nullable(),
  
  // Tax information
  tax_code: z.enum(['V0', 'V1', 'V2', 'V3']).optional().nullable(),
  tax_jurisdiction: z.string().max(50).optional().nullable(),
  
  // Reference and cost allocation
  assignment_reference: z.string().max(50).optional().nullable(),
  cost_center: z.string().max(20).optional().nullable(),
  profit_center: z.string().max(20).optional().nullable(),
  internal_order: z.string().max(20).optional().nullable(),
  wbs_element: z.string().max(30).optional().nullable()
}).refine(
  (data) => {
    // Ensure at least one field is being updated
    const hasValidField = Object.keys(data).some(key => 
      ACCOUNTING_FIELDS.includes(key as AccountingField) && data[key as keyof typeof data] !== undefined
    )
    return hasValidField
  },
  { message: 'At least one valid accounting field must be provided' }
).refine(
  (data) => {
    // Business rule: Invoice gross amount should match item amount for single-line invoices
    if (data.invoice_gross_amount && data.supplier_invoice_item_amount) {
      return Math.abs(data.invoice_gross_amount - data.supplier_invoice_item_amount) < 0.01
    }
    return true
  },
  { message: 'Invoice gross amount should match item amount for single-line invoices' }
)

// Field reprocessing request validation
export const fieldReprocessSchema = z.object({
  field: z.string().refine(val => ACCOUNTING_FIELDS.includes(val as any), {
    message: 'Invalid field name for reprocessing'
  })
})

// Audit log entry schema
export const auditLogEntrySchema = z.object({
  document_id: z.string().uuid(),
  field_name: z.string().max(100),
  input_value: z.string().max(1000).nullable(),
  output_value: z.string().max(1000).nullable(),
  confidence_score: z.number().min(0).max(1),
  reasoning: z.string().max(500),
  mapping_source: z.enum(['manual_edit', 'field_reprocess', 'full_reprocess', 'initial_mapping'])
})

export type DocumentPatchRequest = z.infer<typeof documentPatchSchema>
export type FieldReprocessRequest = z.infer<typeof fieldReprocessSchema>
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>

// Validation helper functions
export function validateAccountingField(fieldName: string, value: any): boolean {
  if (!ACCOUNTING_FIELDS.includes(fieldName as AccountingField)) {
    return false
  }

  // Additional business rule validations
  switch (fieldName) {
    case 'invoice_gross_amount':
    case 'supplier_invoice_item_amount':
      return typeof value === 'number' && value > 0
    
    case 'document_date':
    case 'posting_date':
      return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    
    case 'gl_account':
      return typeof value === 'string' && /^\d{6}$/.test(value)
    
    case 'mapping_confidence':
      return typeof value === 'number' && value >= 0 && value <= 1
    
    default:
      return true
  }
}

export function sanitizeAccountingValue(fieldName: string, value: any): any {
  if (value === null || value === undefined) return null

  switch (fieldName) {
    case 'company_code':
    case 'gl_account':
    case 'document_currency':
    case 'tax_code':
      return String(value).toUpperCase().trim()
    
    case 'invoicing_party':
    case 'supplier_invoice_id_by_invcg_party':
    case 'accounting_document_header_text':
    case 'supplier_invoice_item_text':
      return String(value).trim()
    
    case 'invoice_gross_amount':
    case 'supplier_invoice_item_amount':
      return Number(value)
    
    case 'mapping_confidence':
      return Math.round(Number(value) * 100) / 100 // Round to 2 decimal places
    
    default:
      return value
  }
}