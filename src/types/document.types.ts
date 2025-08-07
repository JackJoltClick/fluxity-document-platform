export interface DocumentStatus {
  PENDING: 'pending'
  PROCESSING: 'processing' 
  COMPLETED: 'completed'
  FAILED: 'failed'
  UPLOADED: 'uploaded' // Legacy status
  QUEUED: 'queued'
}

export type DocumentStatusType = 'pending' | 'processing' | 'completed' | 'failed' | 'uploaded' | 'queued'

export interface ExtractedData {
  supplier_name?: {
    value: string | null
    confidence: number
  }
  invoice_number?: {
    value: string | null
    confidence: number
  }
  invoice_date?: {
    value: string | null
    confidence: number
  }
  total_amount?: {
    value: string | number | null
    confidence: number
  }
  line_items?: Array<{
    value: string
    confidence: number
  }>
  extraction_method?: string
  total_cost?: number
  services_used?: string[]
  fallback_occurred?: boolean
  decision_log?: string[]
  // Direct accounting fields (when using accounting extraction)
  accounting_fields?: DirectAccountingFields
}

// Direct accounting extraction result - matches final field names
export interface DirectAccountingFields {
  // Company and invoice identification
  invoicing_party: { value: string | null; confidence: number }
  supplier_invoice_id_by_invcg_party: { value: string | null; confidence: number }
  company_code: { value: string | null; confidence: number }
  supplier_invoice_transaction_type: { value: string | null; confidence: number }
  
  // Date fields
  document_date: { value: string | null; confidence: number }
  posting_date: { value: string | null; confidence: number }
  
  // Document metadata
  accounting_document_type: { value: string | null; confidence: number }
  accounting_document_header_text: { value: string | null; confidence: number }
  document_currency: { value: string | null; confidence: number }
  invoice_gross_amount: { value: number | null; confidence: number }
  
  // GL accounting fields
  gl_account: { value: string | null; confidence: number }
  supplier_invoice_item_text: { value: string | null; confidence: number }
  debit_credit_code: { value: string | null; confidence: number }
  supplier_invoice_item_amount: { value: number | null; confidence: number }
  
  // Tax information
  tax_code: { value: string | null; confidence: number }
  tax_jurisdiction: { value: string | null; confidence: number }
  
  // Reference and cost allocation
  assignment_reference: { value: string | null; confidence: number }
  cost_center: { value: string | null; confidence: number }
  profit_center: { value: string | null; confidence: number }
  internal_order: { value: string | null; confidence: number }
  wbs_element: { value: string | null; confidence: number }
}

export type DocumentSource = 'upload' | 'email'

export interface EmailMetadata {
  sender: string
  subject: string
  message_id?: string
  received_at?: string
  original_filename?: string
}

// Hybrid extraction interfaces
export interface TextractData {
  keyValuePairs: Record<string, string>
  tables: Array<{
    rows: string[][]
    confidence: number
  }>
  lineItems: Array<{
    description: string
    quantity?: string
    unitPrice?: string
    amount?: string
    confidence: number
  }>
}

export interface CrossValidationData {
  agreementScore: number
  conflictingFields: string[]
  validatedFields: Record<string, {
    textractValue: any
    openaiValue: any
    finalValue: any
    confidence: number
    source: 'textract' | 'openai' | 'consensus'
  }>
}

export interface ExtractionCosts {
  textract?: number
  openai?: number
  total?: number
}

export interface Document {
  id: string
  user_id: string
  filename: string
  file_url: string
  status: DocumentStatusType
  extracted_data: ExtractedData | null
  extraction_method: string | null
  extraction_cost: number | null
  source: DocumentSource
  email_metadata: EmailMetadata | null
  created_at: string
  updated_at: string
  error_message?: string | null
  
  // Hybrid extraction fields
  extraction_confidence?: number | null
  textract_confidence?: number | null
  openai_confidence?: number | null
  cross_validation_score?: number | null
  textract_data?: TextractData | null
  cross_validation_data?: CrossValidationData | null
  extraction_costs?: ExtractionCosts | null
  
  // Accounting fields (optional for backward compatibility)
  company_code?: string | null
  supplier_invoice_transaction_type?: string | null
  invoicing_party?: string | null
  supplier_invoice_id_by_invcg_party?: string | null
  document_date?: string | null
  posting_date?: string | null
  accounting_document_type?: string | null
  accounting_document_header_text?: string | null
  document_currency?: string | null
  invoice_gross_amount?: number | null
  gl_account?: string | null
  supplier_invoice_item_text?: string | null
  debit_credit_code?: string | null
  supplier_invoice_item_amount?: number | null
  tax_code?: string | null
  tax_jurisdiction?: string | null
  assignment_reference?: string | null
  cost_center?: string | null
  profit_center?: string | null
  internal_order?: string | null
  wbs_element?: string | null
  accounting_status?: 'needs_mapping' | 'ready_for_export' | 'exported'
  mapping_confidence?: number | null
  requires_review?: boolean
}

export interface DocumentsResponse {
  success: boolean
  documents: Document[]
  total: number
  message?: string
}

export interface DocumentUploadResponse {
  success: boolean
  message: string
  file: {
    id: string
    filename: string
    originalName: string
    size: number
    type: string
    bucket: string
    path: string
    url: string
    uploadedAt: string
    dbId: string
    jobId?: string
    status: DocumentStatusType
  }
  queueError?: string
  dbError?: string
  error?: string
}

export interface StatusBadgeProps {
  status: DocumentStatusType
  className?: string
}

export interface DocumentRetryAction {
  documentId: string
  onRetry: (documentId: string) => Promise<void>
  isLoading?: boolean
}