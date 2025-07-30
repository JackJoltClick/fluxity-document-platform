// Accounting-specific types for Stage 18+
export type AccountingStatus = 'needs_mapping' | 'ready_for_export' | 'exported'

export interface AccountingDocument extends Document {
  // Company and invoice identification
  company_code: string | null
  supplier_invoice_transaction_type: string | null
  invoicing_party: string | null
  supplier_invoice_id_by_invcg_party: string | null
  
  // Date fields
  document_date: string | null // ISO date string
  posting_date: string | null // ISO date string
  
  // Document metadata
  accounting_document_type: string | null
  accounting_document_header_text: string | null
  document_currency: string | null
  invoice_gross_amount: number | null
  
  // GL accounting fields
  gl_account: string | null
  supplier_invoice_item_text: string | null
  debit_credit_code: string | null
  supplier_invoice_item_amount: number | null
  
  // Tax information
  tax_code: string | null
  tax_jurisdiction: string | null
  
  // Reference and cost allocation
  assignment_reference: string | null
  cost_center: string | null
  profit_center: string | null
  internal_order: string | null
  wbs_element: string | null
  
  // Accounting workflow
  accounting_status: AccountingStatus
  mapping_confidence: number | null
  requires_review: boolean
}

// Excel export column mapping
export interface AccountingExportColumns {
  COMPANYCODE: string
  SupplierInvoiceTransactionType: string
  InvoicingParty: string
  SupplierInvoiceIdByInvcgParty: string
  DocumentDate: string
  PostingDate: string
  AccountingDocumentType: string
  AccountingDocumentHeaderText: string
  DocumentCurrency: string
  InvoiceGrossAmount: number
  GLACCOUNT: string
  SupplierInvoiceItemText: string
  DebitCreditCode: string
  SupplierInvoiceItemAmount: number
  TaxCode: string
  TaxJurisdiction: string
  AssignmentReference: string
  COSTCENTER: string
  ProfitCenter: string
  InternalOrder: string
  WBSElement: string
}

// Mapping configurations
export interface CompanyCodeMapping {
  supplier_pattern: string
  company_code: string
  confidence: number
}

export interface GLAccountMapping {
  description_pattern: string
  gl_account: string
  confidence: number
}

export interface AccountingMappingRules {
  company_codes: CompanyCodeMapping[]
  gl_accounts: GLAccountMapping[]
  default_tax_code: string
  default_currency: string
}

// Batch export interface
export interface AccountingBatchExport {
  id: string
  user_id: string
  export_date: string
  document_count: number
  status: 'pending' | 'completed' | 'failed'
  file_url: string | null
  filters: {
    start_date: string
    end_date: string
    accounting_status?: AccountingStatus
    company_code?: string
  }
  created_at: string
}

// Validation result
export interface AccountingValidationResult {
  isValid: boolean
  missingFields: string[]
  warnings: string[]
  confidence: number
}

// Business Logic Mapping Interfaces (Stage 19)
export interface MappingField<T = string> {
  value: T | null
  confidence: number
  reasoning: string
  source: 'exact_match' | 'fuzzy_match' | 'rule_based' | 'default' | 'manual'
}

export interface BusinessRuleResult {
  success: boolean
  confidence: number
  reasoning: string
  source: string
  metadata?: Record<string, any>
}

export interface AccountingMappingResult {
  // Company and invoice identification
  company_code: MappingField<string>
  supplier_invoice_transaction_type: MappingField<string>
  invoicing_party: MappingField<string>
  supplier_invoice_id_by_invcg_party: MappingField<string>
  
  // Date fields
  document_date: MappingField<string>
  posting_date: MappingField<string>
  
  // Document metadata
  accounting_document_type: MappingField<string>
  accounting_document_header_text: MappingField<string>
  document_currency: MappingField<string>
  invoice_gross_amount: MappingField<number>
  
  // GL accounting fields
  gl_account: MappingField<string>
  supplier_invoice_item_text: MappingField<string>
  debit_credit_code: MappingField<string>
  supplier_invoice_item_amount: MappingField<number>
  
  // Tax information
  tax_code: MappingField<string>
  tax_jurisdiction: MappingField<string>
  
  // Reference and cost allocation
  assignment_reference: MappingField<string>
  cost_center: MappingField<string>
  profit_center: MappingField<string>
  internal_order: MappingField<string>
  wbs_element: MappingField<string>
  
  // Overall mapping metadata
  overall_confidence: number
  requires_review: boolean
  processing_notes: string[]
  audit_trail: AuditLogEntry[]
}

export interface AuditLogEntry {
  field_name: string
  input_value: string | null
  output_value: string | null
  confidence_score: number
  reasoning: string
  mapping_source: string
  timestamp: string
}

// Database mapping table interfaces
export interface CompanyMapping {
  id: string
  user_id: string
  supplier_name: string
  company_code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GLMapping {
  id: string
  user_id: string
  keywords: string[]
  gl_account: string
  description: string | null
  department: string | null
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CostCenterRule {
  id: string
  user_id: string
  rule_name: string
  supplier_pattern: string | null
  description_pattern: string | null
  cost_center: string
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BusinessLogicAudit {
  id: string
  document_id: string
  field_name: string
  input_value: string | null
  output_value: string | null
  confidence_score: number
  reasoning: string
  mapping_source: string
  created_at: string
}

// Service configuration
export interface BusinessLogicConfig {
  fuzzy_match_threshold: number
  default_currency: string
  default_tax_code: string
  confidence_threshold_for_auto_approve: number
  enable_audit_logging: boolean
}