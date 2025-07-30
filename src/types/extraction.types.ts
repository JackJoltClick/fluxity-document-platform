export interface ExtractedField {
  value: string | number | null
  confidence: number // 0-1 score
}

export interface ExtractionResult {
  supplier_name: ExtractedField
  invoice_number: ExtractedField
  invoice_date: ExtractedField
  total_amount: ExtractedField
  line_items: ExtractedField[]
  // Direct accounting fields (when using accounting extraction)
  accounting_fields?: any
  // AI justification report and metadata
  justification_report?: string
  document_metadata?: any
  validation_flags?: any
}

export enum ExtractionErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export class ExtractionError extends Error {
  constructor(
    public type: ExtractionErrorType,
    message: string,
    public originalError?: unknown
  ) {
    super(message)
  }
}