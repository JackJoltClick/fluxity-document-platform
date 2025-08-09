import * as XLSX from 'xlsx'

interface ClientSchema {
  id: string
  name: string
  description: string | null
  columns: { name: string; description: string }[]
}

interface DocumentWithAccounting {
  id: string
  filename: string
  created_at: string
  updated_at?: string
  client_schema_id?: string | null
  extracted_data?: any
  accounting_status?: 'needs_mapping' | 'ready_for_export' | 'exported'
  
  // Legacy accounting fields
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
}

// Legacy accounting field definitions
const LEGACY_ACCOUNTING_FIELDS = [
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
]

export interface ExcelExportOptions {
  includeMetadata?: boolean
  includeConfidenceScores?: boolean
  dateFormat?: 'iso' | 'locale' | 'short'
  filename?: string
}

export class ExcelExportService {
  static async exportDocuments(
    documents: DocumentWithAccounting[], 
    clientSchemas: ClientSchema[] = [],
    options: ExcelExportOptions = {}
  ): Promise<void> {
    const {
      includeMetadata = true,
      includeConfidenceScores = false,
      dateFormat = 'locale',
      filename
    } = options

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Group documents by schema
    const documentsBySchema = this.groupDocumentsBySchema(documents)

    // Create summary worksheet
    if (includeMetadata) {
      this.createSummaryWorksheet(workbook, documents, clientSchemas)
    }

    // Create worksheets for each schema type
    Array.from(documentsBySchema.entries()).forEach(([schemaType, docs]) => {
      const schema = clientSchemas.find(s => s.id === schemaType) || null
      this.createSchemaWorksheet(
        workbook, 
        docs, 
        schema, 
        schemaType, 
        includeConfidenceScores,
        dateFormat
      )
    })

    // Generate filename
    const exportFilename = filename || this.generateFilename(documents.length)

    // Download file
    this.downloadWorkbook(workbook, exportFilename)
  }

  static async exportSingleDocument(
    document: DocumentWithAccounting,
    clientSchema?: ClientSchema | null,
    options: ExcelExportOptions = {}
  ): Promise<void> {
    await this.exportDocuments([document], clientSchema ? [clientSchema] : [], {
      ...options,
      filename: options.filename || `${document.filename}_export.xlsx`
    })
  }

  private static groupDocumentsBySchema(documents: DocumentWithAccounting[]): Map<string, DocumentWithAccounting[]> {
    const grouped = new Map<string, DocumentWithAccounting[]>()
    
    for (const doc of documents) {
      const schemaId = doc.client_schema_id || 'legacy'
      
      if (!grouped.has(schemaId)) {
        grouped.set(schemaId, [])
      }
      
      grouped.get(schemaId)!.push(doc)
    }
    
    return grouped
  }

  private static createSummaryWorksheet(
    workbook: XLSX.WorkBook, 
    documents: DocumentWithAccounting[], 
    clientSchemas: ClientSchema[]
  ): void {
    const summaryData = [
      ['Export Summary'],
      [''],
      ['Generated:', new Date().toLocaleString()],
      ['Total Documents:', documents.length],
      [''],
      ['Documents by Schema:']
    ]

    const schemaStats = new Map<string, number>()
    documents.forEach(doc => {
      const schemaId = doc.client_schema_id || 'legacy'
      schemaStats.set(schemaId, (schemaStats.get(schemaId) || 0) + 1)
    })

    Array.from(schemaStats.entries()).forEach(([schemaId, count]) => {
      const schema = clientSchemas.find(s => s.id === schemaId)
      const schemaName = schema ? schema.name : 'Legacy Accounting Fields (21 columns)'
      summaryData.push([`- ${schemaName}:`, count])
    })

    summaryData.push([''], ['Documents by Status:'])
    
    const statusStats = new Map<string, number>()
    documents.forEach(doc => {
      const status = doc.accounting_status || 'unknown'
      statusStats.set(status, (statusStats.get(status) || 0) + 1)
    })

    Array.from(statusStats.entries()).forEach(([status, count]) => {
      summaryData.push([`- ${status}:`, count])
    })

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary')
  }

  private static createSchemaWorksheet(
    workbook: XLSX.WorkBook,
    documents: DocumentWithAccounting[],
    schema: ClientSchema | null,
    schemaId: string,
    includeConfidenceScores: boolean,
    dateFormat: 'iso' | 'locale' | 'short'
  ): void {
    const isLegacy = schemaId === 'legacy' || !schema
    const sheetName = isLegacy ? 'Legacy Fields' : schema.name.substring(0, 31)

    // Determine columns based on schema type
    const dataColumns = isLegacy 
      ? LEGACY_ACCOUNTING_FIELDS 
      : schema.columns.map(col => col.name)

    // Create headers
    const headers = [
      'Document ID',
      'Filename',
      'Created Date',
      'Status',
      ...dataColumns
    ]

    if (includeConfidenceScores) {
      headers.push(...dataColumns.map(col => `${col}_confidence`))
    }

    // Create data rows
    const rows = documents.map(doc => {
      const baseRow = [
        doc.id,
        doc.filename,
        this.formatDate(doc.created_at, dateFormat),
        doc.accounting_status || 'unknown'
      ]

      // Add field values
      const fieldValues = dataColumns.map(fieldName => {
        if (isLegacy) {
          // Legacy fields are stored directly on document
          return this.formatCellValue(doc[fieldName as keyof DocumentWithAccounting])
        } else {
          // Dynamic schema fields are in extracted_data.client_fields
          const clientFields = doc.extracted_data?.client_fields || {}
          const fieldData = clientFields[fieldName]
          return this.formatCellValue(fieldData?.value)
        }
      })

      const row = [...baseRow, ...fieldValues]

      // Add confidence scores if requested
      if (includeConfidenceScores) {
        const confidenceValues = dataColumns.map(fieldName => {
          if (isLegacy) {
            const accountingFields = doc.extracted_data?.accounting_fields || {}
            const fieldData = accountingFields[fieldName]
            return fieldData?.confidence || ''
          } else {
            const clientFields = doc.extracted_data?.client_fields || {}
            const fieldData = clientFields[fieldName]
            return fieldData?.confidence || ''
          }
        })
        row.push(...confidenceValues)
      }

      return row
    })

    // Create worksheet
    const worksheetData = [headers, ...rows]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Auto-size columns
    const colWidths = headers.map((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...rows.map(row => String(row[index] || '').length)
      )
      return { wch: Math.min(maxLength + 2, 50) }
    })
    worksheet['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  }

  private static formatDate(dateString: string, format: 'iso' | 'locale' | 'short'): string {
    const date = new Date(dateString)
    
    switch (format) {
      case 'iso':
        return date.toISOString()
      case 'short':
        return date.toLocaleDateString()
      case 'locale':
      default:
        return date.toLocaleString()
    }
  }

  private static formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    
    return String(value)
  }

  private static generateFilename(documentCount: number): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '')
    return `fluxity_export_${documentCount}_docs_${timestamp}.xlsx`
  }

  private static downloadWorkbook(workbook: XLSX.WorkBook, filename: string): void {
    // Write workbook to buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    
    // Create blob and download
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    
    // Cleanup
    window.URL.revokeObjectURL(url)
  }
}