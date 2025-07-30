import { supabaseAdmin } from '@/src/lib/supabase/auth-server'
import { 
  MappingField, 
  BusinessRuleResult, 
  AccountingMappingResult,
  CompanyMapping,
  GLMapping,
  CostCenterRule,
  BusinessLogicConfig,
  AuditLogEntry,
  BusinessLogicAudit
} from '@/src/types/accounting.types'
import { ExtractedData } from '@/src/types/document.types'
import { VendorExtractionRulesService, VendorExtractionRule } from '@/src/services/vendors/vendor-extraction-rules.service'
import { VendorService } from '@/src/services/vendors/vendor.service'
import { PromptSanitizerService } from '@/src/services/security/prompt-sanitizer.service'

export class BusinessLogicService {
  private config: BusinessLogicConfig = {
    fuzzy_match_threshold: 0.7,
    default_currency: 'USD',
    default_tax_code: 'T1',
    confidence_threshold_for_auto_approve: 0.8,
    enable_audit_logging: true
  }
  private isSimpleMappingMode: boolean
  private vendorRulesService: VendorExtractionRulesService
  private vendorService: VendorService
  private promptSanitizer: PromptSanitizerService

  constructor(config?: Partial<BusinessLogicConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    // Check environment variable for simple mapping mode
    this.isSimpleMappingMode = process.env.SIMPLE_MAPPING_MODE === 'true'
    
    // Initialize vendor services
    this.vendorRulesService = new VendorExtractionRulesService()
    this.vendorService = new VendorService()
    this.promptSanitizer = new PromptSanitizerService()
    
    if (this.isSimpleMappingMode) {
      console.log('🔧 Business Logic Service: Simple mapping mode enabled')
    }
  }

  /**
   * Maps supplier names to internal company codes using fuzzy matching
   */
  async mapCompanyCode(supplierName: string, userId: string): Promise<MappingField<string>> {
    try {
      // Use the database function for fuzzy matching
      const { data, error } = await supabaseAdmin.rpc('find_company_mapping', {
        supplier_name_param: supplierName,
        user_id_param: userId
      })

      if (error) {
        console.error('Error in mapCompanyCode:', error)
        return {
          value: null,
          confidence: 0,
          reasoning: `Failed to map company code: ${error.message}`,
          source: 'default'
        }
      }

      if (data && data.length > 0) {
        const mapping = data[0]
        return {
          value: mapping.company_code,
          confidence: mapping.confidence,
          reasoning: `Fuzzy matched "${supplierName}" to "${mapping.matched_supplier}" with ${Math.round(mapping.confidence * 100)}% confidence`,
          source: mapping.confidence >= 0.9 ? 'exact_match' : 'fuzzy_match'
        }
      }

      // No mapping found, return null with explanation
      return {
        value: null,
        confidence: 0,
        reasoning: `No company mapping found for supplier "${supplierName}". Consider adding a mapping rule.`,
        source: 'default'
      }
    } catch (error) {
      console.error('Error in mapCompanyCode:', error)
      return {
        value: null,
        confidence: 0,
        reasoning: `Error mapping company code: ${error instanceof Error ? error.message : String(error)}`,
        source: 'default'
      }
    }
  }

  /**
   * Assigns GL accounts based on invoice descriptions and business rules
   */
  async assignGLAccount(description: string, amount: number, userId: string): Promise<MappingField<string>> {
    try {
      // Use the database function for keyword matching
      const { data, error } = await supabaseAdmin.rpc('find_gl_mapping', {
        description_param: description,
        user_id_param: userId
      })

      if (error) {
        console.error('Error in assignGLAccount:', error)
        return {
          value: null,
          confidence: 0,
          reasoning: `Failed to assign GL account: ${error.message}`,
          source: 'default'
        }
      }

      if (data && data.length > 0) {
        const mapping = data[0]
        return {
          value: mapping.gl_account,
          confidence: mapping.confidence,
          reasoning: `Matched keywords [${mapping.matched_keywords?.join(', ')}] in description "${description}" to GL account ${mapping.gl_account}`,
          source: 'rule_based'
        }
      }

      // Apply default GL account based on amount ranges
      let defaultGL = '6000' // Default expense account
      const confidence = 0.3
      let reasoning = 'Applied default GL account for unmatched expense'

      if (amount > 10000) {
        defaultGL = '7000' // Large expenses
        reasoning = 'Applied GL account for large expenses (>$10,000)'
      } else if (amount < 100) {
        defaultGL = '6100' // Small expenses
        reasoning = 'Applied GL account for small expenses (<$100)'
      }

      return {
        value: defaultGL,
        confidence,
        reasoning,
        source: 'default'
      }
    } catch (error) {
      console.error('Error in assignGLAccount:', error)
      return {
        value: '6000',
        confidence: 0.1,
        reasoning: `Error assigning GL account, used default: ${error instanceof Error ? error.message : String(error)}`,
        source: 'default'
      }
    }
  }

  /**
   * Determines cost center based on supplier and expense type
   */
  async determineCostCenter(supplierName: string, description: string, userId: string): Promise<MappingField<string>> {
    try {
      // Query cost center rules
      const { data: rules, error } = await supabaseAdmin
        .from('cost_center_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (error) {
        console.error('Error querying cost center rules:', error)
        return {
          value: null,
          confidence: 0,
          reasoning: `Failed to determine cost center: ${error.message}`,
          source: 'default'
        }
      }

      // Apply rules in priority order
      for (const rule of rules || []) {
        let matches = true
        const matchReasons: string[] = []

        // Check supplier pattern
        if (rule.supplier_pattern) {
          const supplierRegex = new RegExp(rule.supplier_pattern, 'i')
          if (supplierRegex.test(supplierName)) {
            matchReasons.push(`supplier pattern "${rule.supplier_pattern}"`)
          } else {
            matches = false
          }
        }

        // Check description pattern
        if (rule.description_pattern && matches) {
          const descriptionRegex = new RegExp(rule.description_pattern, 'i')
          if (descriptionRegex.test(description)) {
            matchReasons.push(`description pattern "${rule.description_pattern}"`)
          } else {
            matches = false
          }
        }

        if (matches && matchReasons.length > 0) {
          return {
            value: rule.cost_center,
            confidence: 0.9,
            reasoning: `Matched rule "${rule.rule_name}" based on ${matchReasons.join(' and ')}`,
            source: 'rule_based'
          }
        }
      }

      // Default cost center logic
      let defaultCostCenter = 'CC-1000' // General/Admin
      let reasoning = 'Applied default cost center (General/Admin)'

      // Simple heuristics for cost center assignment
      if (supplierName.toLowerCase().includes('office') || description.toLowerCase().includes('office')) {
        defaultCostCenter = 'CC-1100'
        reasoning = 'Applied Office cost center based on supplier/description keywords'
      } else if (description.toLowerCase().includes('travel') || description.toLowerCase().includes('hotel')) {
        defaultCostCenter = 'CC-1200'
        reasoning = 'Applied Travel cost center based on description keywords'
      } else if (description.toLowerCase().includes('software') || description.toLowerCase().includes('subscription')) {
        defaultCostCenter = 'CC-1300'
        reasoning = 'Applied IT cost center based on description keywords'
      }

      return {
        value: defaultCostCenter,
        confidence: 0.4,
        reasoning,
        source: 'default'
      }
    } catch (error) {
      console.error('Error in determineCostCenter:', error)
      return {
        value: 'CC-1000',
        confidence: 0.1,
        reasoning: `Error determining cost center, used default: ${error instanceof Error ? error.message : String(error)}`,
        source: 'default'
      }
    }
  }

  /**
   * Maps document types to accounting transaction types
   */
  setTransactionType(documentType: string): MappingField<string> {
    const documentTypeLower = documentType.toLowerCase()
    
    // Define mapping rules
    const transactionMappings: Record<string, { type: string; confidence: number; reasoning: string }> = {
      'invoice': { 
        type: 'RE', 
        confidence: 0.95, 
        reasoning: 'Standard vendor invoice transaction type' 
      },
      'receipt': { 
        type: 'RE', 
        confidence: 0.9, 
        reasoning: 'Receipt mapped to vendor invoice transaction type' 
      },
      'bill': { 
        type: 'RE', 
        confidence: 0.9, 
        reasoning: 'Bill mapped to vendor invoice transaction type' 
      },
      'credit': { 
        type: 'KR', 
        confidence: 0.95, 
        reasoning: 'Credit note transaction type' 
      },
      'debit': { 
        type: 'DR', 
        confidence: 0.95, 
        reasoning: 'Debit note transaction type' 
      }
    }

    // Find best match
    for (const [key, mapping] of Object.entries(transactionMappings)) {
      if (documentTypeLower.includes(key)) {
        return {
          value: mapping.type,
          confidence: mapping.confidence,
          reasoning: mapping.reasoning,
          source: 'rule_based'
        }
      }
    }

    // Default to standard invoice
    return {
      value: 'RE',
      confidence: 0.6,
      reasoning: 'Default vendor invoice transaction type applied',
      source: 'default'
    }
  }

  /**
   * Simple direct mapping mode - uses AI-extracted accounting fields directly
   */
  private async processDocumentSimple(extractedData: ExtractedData, userId: string): Promise<AccountingMappingResult> {
    // Check if we have direct accounting fields from AI extraction
    if (extractedData.accounting_fields) {
      return await this.processDirectAccountingFields(extractedData.accounting_fields, userId, extractedData)
    }
    
    // Fallback to legacy simple mapping for backwards compatibility
    return this.processDocumentSimpleLegacy(extractedData, userId)
  }

  /**
   * Process direct accounting fields from AI extraction (no mapping needed)
   */
  private async processDirectAccountingFields(accountingFields: any, userId: string, extractedData: ExtractedData): Promise<AccountingMappingResult> {
    const auditTrail: AuditLogEntry[] = []
    const processingNotes: string[] = ['Using direct AI-extracted accounting fields']

    // Helper function to create audit entry
    const createAuditEntry = (fieldName: string, input: any, result: MappingField<any>): AuditLogEntry => ({
      field_name: fieldName,
      input_value: input ? String(input) : null,
      output_value: result.value ? String(result.value) : null,
      confidence_score: result.confidence,
      reasoning: result.reasoning,
      mapping_source: result.source,
      timestamp: new Date().toISOString()
    })

    // Convert direct fields to MappingField format with audit trail
    const mappedFields: MappingField<any>[] = []

    const fields = [
      'company_code', 'supplier_invoice_transaction_type', 'invoicing_party',
      'supplier_invoice_id_by_invcg_party', 'document_date', 'posting_date',
      'accounting_document_type', 'accounting_document_header_text', 'document_currency',
      'invoice_gross_amount', 'gl_account', 'supplier_invoice_item_text',
      'debit_credit_code', 'supplier_invoice_item_amount', 'tax_code',
      'tax_jurisdiction', 'assignment_reference', 'cost_center',
      'profit_center', 'internal_order', 'wbs_element'
    ]

    const result: any = {}

    fields.forEach(fieldName => {
      const aiField = accountingFields[fieldName]
      if (aiField) {
        const mappingField: MappingField<any> = {
          value: aiField.value,
          confidence: aiField.confidence,
          reasoning: `Direct AI extraction with ${Math.round(aiField.confidence * 100)}% confidence`,
          source: 'exact_match'
        }
        result[fieldName] = mappingField
        mappedFields.push(mappingField)
        auditTrail.push(createAuditEntry(fieldName, aiField.value, mappingField))
      }
    })

    // Use AI's overall confidence if available, otherwise calculate from fields
    const aiOverallConfidence = (extractedData as any).document_metadata?.overall_confidence
    const calculatedConfidence = mappedFields.reduce((sum, field) => sum + field.confidence, 0) / mappedFields.length
    const overallConfidence = aiOverallConfidence || calculatedConfidence
    
    console.log(`🎯 Confidence Debug: AI=${aiOverallConfidence}, Calculated=${calculatedConfidence.toFixed(3)}, Using=${overallConfidence.toFixed(3)}`)

    // Apply vendor-specific rules if supplier name is available
    const supplierName = extractedData.supplier_name?.value || (extractedData as any).invoicing_party?.value
    if (supplierName && typeof supplierName === 'string') {
      await this.applyVendorRules(result, supplierName, userId, auditTrail)
      processingNotes.push('Applied vendor-specific rules for enhanced field mapping')
    }

    // Determine if review is required
    const requiresReview = overallConfidence < this.config.confidence_threshold_for_auto_approve

    if (!requiresReview) {
      processingNotes.push('Document ready for export - high confidence from direct AI extraction')
    }

    return {
      ...result,
      overall_confidence: overallConfidence,
      requires_review: requiresReview,
      processing_notes: processingNotes,
      audit_trail: auditTrail
    }
  }

  /**
   * Apply vendor-specific rules to enhance field mappings
   */
  private async applyVendorRules(
    result: Partial<AccountingMappingResult>, 
    supplierName: string, 
    _userId: string,
    auditTrail: AuditLogEntry[]
  ): Promise<void> {
    try {
      // Find vendor by name or alias
      const vendors = await this.vendorService.getAllVendors()
      const matchedVendor = vendors.find(vendor => 
        vendor.name.toLowerCase().includes(supplierName.toLowerCase()) ||
        vendor.aliases?.some(alias => 
          alias.alias.toLowerCase().includes(supplierName.toLowerCase())
        )
      )

      if (!matchedVendor) {
        console.log(`📋 Business Logic: No vendor match found for "${supplierName}"`)
        return
      }

      console.log(`📋 Business Logic: Found vendor match: ${matchedVendor.name}`)

      // Get vendor extraction rules
      const vendorRules = await this.vendorRulesService.getVendorExtractionRules(matchedVendor.id)
      
      if (vendorRules.length === 0) {
        console.log(`📋 Business Logic: No rules configured for vendor ${matchedVendor.name}`)
        return
      }

      console.log(`📋 Business Logic: Applying ${vendorRules.length} vendor-specific rules`)

      // Note: GL account assignment is handled by existing business logic
      // (assignGLAccount method with keyword matching and database rules)

      // Apply cost center hints with security validation
      const costCenterHints = vendorRules.filter(rule => rule.rule_type === 'cost_center_hint')
      for (const hint of costCenterHints) {
        if (result.cost_center && result.cost_center.value === 'NEEDS_ASSIGNMENT') {
          // Simple pattern matching for cost center hints like "NYC invoices → Cost Center NYC"
          const ccMatch = hint.instruction.match(/Cost Center\s*(\w+)/i)
          if (ccMatch) {
            // Validate extracted cost center for security
            const validation = this.promptSanitizer.validateExtractedValue(ccMatch[1], 'cost_center')
            if (validation.valid && validation.sanitized) {
              result.cost_center = {
                value: validation.sanitized,
                confidence: 0.85,
                reasoning: `Applied vendor cost center hint: ${hint.instruction}`,
                source: 'rule_based'
              }
              auditTrail.push({
                field_name: 'cost_center',
                input_value: 'NEEDS_ASSIGNMENT',
                output_value: validation.sanitized,
                confidence_score: 0.85,
                reasoning: `Applied vendor cost center hint: ${hint.instruction}`,
                mapping_source: 'vendor_rule',
                timestamp: new Date().toISOString()
              })
            } else {
              console.warn(`🚨 Business Logic: Invalid cost center from vendor rule: ${ccMatch[1]}`)
              auditTrail.push({
                field_name: 'cost_center',
                input_value: 'NEEDS_ASSIGNMENT',
                output_value: null,
                confidence_score: 0,
                reasoning: `Vendor cost center hint rejected for security: ${hint.instruction}`,
                mapping_source: 'security_blocked',
                timestamp: new Date().toISOString()
              })
            }
          }
        }
      }

    } catch (error) {
      console.warn('⚠️ Business Logic: Failed to apply vendor rules:', error)
      // Don't fail the entire process if vendor rules fail
    }
  }

  /**
   * Legacy simple mapping mode - bypasses complex business logic (backwards compatibility)
   */
  private processDocumentSimpleLegacy(extractedData: ExtractedData, _userId: string): AccountingMappingResult {
    const auditTrail: AuditLogEntry[] = []
    const processingNotes: string[] = ['Using simple direct mapping mode']

    // Extract basic values
    const supplierName = extractedData.supplier_name?.value || ''
    const invoiceNumber = extractedData.invoice_number?.value || ''
    const invoiceDate = extractedData.invoice_date?.value || new Date().toISOString().split('T')[0]
    const totalAmount = typeof extractedData.total_amount?.value === 'number' 
      ? extractedData.total_amount.value 
      : parseFloat(String(extractedData.total_amount?.value || 0))
    const lineItems = extractedData.line_items || []
    const description = lineItems.map(item => item.value).join('; ') || 'No description available'
    const currency = (extractedData as any).currency?.value || 'USD'

    // Helper function to create audit entry
    const createAuditEntry = (fieldName: string, input: any, result: MappingField<any>): AuditLogEntry => ({
      field_name: fieldName,
      input_value: input ? String(input) : null,
      output_value: result.value ? String(result.value) : null,
      confidence_score: result.confidence,
      reasoning: result.reasoning,
      mapping_source: result.source,
      timestamp: new Date().toISOString()
    })

    // High Confidence Direct Mappings (90%+)
    const mappedFields: MappingField<any>[] = []

    // 1. invoicing_party ← supplier_name
    const invoicingParty: MappingField<string> = {
      value: supplierName,
      confidence: 0.95,
      reasoning: 'Direct mapping from extracted supplier name',
      source: 'exact_match'
    }
    mappedFields.push(invoicingParty)
    auditTrail.push(createAuditEntry('invoicing_party', supplierName, invoicingParty))

    // 2. supplier_invoice_id_by_invcg_party ← invoice_number  
    const supplierInvoiceId: MappingField<string> = {
      value: invoiceNumber,
      confidence: 0.95,
      reasoning: 'Direct mapping from extracted invoice number',
      source: 'exact_match'
    }
    mappedFields.push(supplierInvoiceId)
    auditTrail.push(createAuditEntry('supplier_invoice_id_by_invcg_party', invoiceNumber, supplierInvoiceId))

    // 3. invoice_gross_amount ← total_amount
    const invoiceGrossAmount: MappingField<number> = {
      value: totalAmount,
      confidence: 0.95,
      reasoning: 'Direct mapping from extracted total amount',
      source: 'exact_match'
    }
    mappedFields.push(invoiceGrossAmount)
    auditTrail.push(createAuditEntry('invoice_gross_amount', totalAmount, invoiceGrossAmount))

    // 4. supplier_invoice_item_amount ← total_amount (same value)
    const supplierInvoiceItemAmount: MappingField<number> = {
      value: totalAmount,
      confidence: 0.95,
      reasoning: 'Direct mapping from extracted total amount',
      source: 'exact_match'
    }
    mappedFields.push(supplierInvoiceItemAmount)
    auditTrail.push(createAuditEntry('supplier_invoice_item_amount', totalAmount, supplierInvoiceItemAmount))

    // 5. document_date ← invoice_date
    const documentDate: MappingField<string> = {
      value: invoiceDate,
      confidence: 0.95,
      reasoning: 'Direct mapping from extracted invoice date',
      source: 'exact_match'
    }
    mappedFields.push(documentDate)
    auditTrail.push(createAuditEntry('document_date', invoiceDate, documentDate))

    // 6. document_currency ← currency or USD
    const documentCurrency: MappingField<string> = {
      value: currency.toUpperCase(),
      confidence: 0.90,
      reasoning: (extractedData as any).currency?.value ? 'Direct mapping from extracted currency' : 'Default USD currency applied',
      source: 'exact_match'
    }
    mappedFields.push(documentCurrency)
    auditTrail.push(createAuditEntry('document_currency', currency, documentCurrency))

    // 7. supplier_invoice_item_text ← line items joined
    const supplierInvoiceItemText: MappingField<string> = {
      value: description,
      confidence: 0.90,
      reasoning: 'Direct mapping from extracted line items',
      source: 'exact_match'
    }
    mappedFields.push(supplierInvoiceItemText)
    auditTrail.push(createAuditEntry('supplier_invoice_item_text', description, supplierInvoiceItemText))

    // Medium Confidence Defaults (80%)
    // 8. supplier_invoice_transaction_type ← "INVOICE"
    const transactionType: MappingField<string> = {
      value: 'INVOICE',
      confidence: 0.85,
      reasoning: 'Standard invoice transaction type applied',
      source: 'default'
    }
    mappedFields.push(transactionType)
    auditTrail.push(createAuditEntry('supplier_invoice_transaction_type', 'invoice', transactionType))

    // 9. accounting_document_type ← "RE"
    const accountingDocType: MappingField<string> = {
      value: 'RE',
      confidence: 0.85,
      reasoning: 'Standard vendor invoice document type applied',
      source: 'default'
    }
    mappedFields.push(accountingDocType)
    auditTrail.push(createAuditEntry('accounting_document_type', 'vendor_invoice', accountingDocType))

    // 10. debit_credit_code ← "H"
    const debitCreditCode: MappingField<string> = {
      value: 'H',
      confidence: 0.85,
      reasoning: 'Standard credit code for vendor invoices',
      source: 'default'
    }
    mappedFields.push(debitCreditCode)
    auditTrail.push(createAuditEntry('debit_credit_code', 'credit', debitCreditCode))

    // 11. posting_date ← current date
    const postingDate: MappingField<string> = {
      value: new Date().toISOString().split('T')[0],
      confidence: 0.85,
      reasoning: 'Current date applied as posting date',
      source: 'default'
    }
    mappedFields.push(postingDate)
    auditTrail.push(createAuditEntry('posting_date', 'current_date', postingDate))

    // 12. accounting_document_header_text ← "Invoice from {supplier} - {invoice}"
    const headerText: MappingField<string> = {
      value: `Invoice from ${supplierName} - ${invoiceNumber}`,
      confidence: 0.80,
      reasoning: 'Generated header text from supplier and invoice number',
      source: 'default'
    }
    mappedFields.push(headerText)
    auditTrail.push(createAuditEntry('accounting_document_header_text', `${supplierName}-${invoiceNumber}`, headerText))

    // 13. company_code ← First word of supplier + "001"
    const companyCode: MappingField<string> = {
      value: supplierName.split(' ')[0].toUpperCase().substring(0, 6) + '001',
      confidence: 0.80,
      reasoning: 'Generated company code from supplier name',
      source: 'default'
    }
    mappedFields.push(companyCode)
    auditTrail.push(createAuditEntry('company_code', supplierName, companyCode))

    // 14. gl_account ← "6000"
    const glAccount: MappingField<string> = {
      value: '6000',
      confidence: 0.80,
      reasoning: 'Default general expense account applied',
      source: 'default'
    }
    mappedFields.push(glAccount)
    auditTrail.push(createAuditEntry('gl_account', 'default', glAccount))

    // 15. tax_code ← "T1"
    const taxCode: MappingField<string> = {
      value: 'T1',
      confidence: 0.80,
      reasoning: 'Standard tax code applied',
      source: 'default'
    }
    mappedFields.push(taxCode)
    auditTrail.push(createAuditEntry('tax_code', 'standard', taxCode))

    // 16. tax_jurisdiction ← "US"
    const taxJurisdiction: MappingField<string> = {
      value: 'US',
      confidence: 0.80,
      reasoning: 'Default US tax jurisdiction applied',
      source: 'default'
    }
    mappedFields.push(taxJurisdiction)
    auditTrail.push(createAuditEntry('tax_jurisdiction', 'default', taxJurisdiction))

    // 17. assignment_reference ← invoice_number
    const assignmentReference: MappingField<string> = {
      value: invoiceNumber,
      confidence: 0.80,
      reasoning: 'Invoice number used as assignment reference',
      source: 'default'
    }
    mappedFields.push(assignmentReference)
    auditTrail.push(createAuditEntry('assignment_reference', invoiceNumber, assignmentReference))

    // Lower Confidence (60-70%)
    // 18. cost_center ← "ADMIN"
    const costCenter: MappingField<string> = {
      value: 'ADMIN',
      confidence: 0.70,
      reasoning: 'Default administrative cost center applied',
      source: 'default'
    }
    mappedFields.push(costCenter)
    auditTrail.push(createAuditEntry('cost_center', 'default', costCenter))

    // 19-21. Optional fields set to empty strings (not null for type compatibility)
    const profitCenter: MappingField<string> = {
      value: '',
      confidence: 0.60,
      reasoning: 'Optional field - not specified',
      source: 'default'
    }
    mappedFields.push(profitCenter)

    const internalOrder: MappingField<string> = {
      value: '',
      confidence: 0.60,
      reasoning: 'Optional field - not specified',
      source: 'default'
    }
    mappedFields.push(internalOrder)

    const wbsElement: MappingField<string> = {
      value: '',
      confidence: 0.60,
      reasoning: 'Optional field - not specified',
      source: 'default'
    }
    mappedFields.push(wbsElement)

    // Calculate overall confidence
    const overallConfidence = mappedFields.reduce((sum, field) => sum + field.confidence, 0) / mappedFields.length

    // Determine if review is required (should be false with 80%+ confidence)
    const requiresReview = overallConfidence < this.config.confidence_threshold_for_auto_approve

    if (!requiresReview) {
      processingNotes.push('Document ready for export - high confidence in simple mapping')
    }

    return {
      // Direct field mappings - return full MappingField objects
      company_code: companyCode,
      supplier_invoice_transaction_type: transactionType,
      invoicing_party: invoicingParty,
      supplier_invoice_id_by_invcg_party: supplierInvoiceId,
      document_date: documentDate,
      posting_date: postingDate,
      accounting_document_type: accountingDocType,
      accounting_document_header_text: headerText,
      document_currency: documentCurrency,
      invoice_gross_amount: invoiceGrossAmount,
      gl_account: glAccount,
      supplier_invoice_item_text: supplierInvoiceItemText,
      debit_credit_code: debitCreditCode,
      supplier_invoice_item_amount: supplierInvoiceItemAmount,
      tax_code: taxCode,
      tax_jurisdiction: taxJurisdiction,
      assignment_reference: assignmentReference,
      cost_center: costCenter,
      profit_center: profitCenter,
      internal_order: internalOrder,
      wbs_element: wbsElement,

      // Metadata
      overall_confidence: overallConfidence,
      requires_review: requiresReview,
      processing_notes: processingNotes,
      audit_trail: auditTrail
    }
  }

  /**
   * Main method that processes all fields from extracted data
   */
  async processDocument(extractedData: ExtractedData, userId: string, documentId?: string): Promise<AccountingMappingResult> {
    // Check if simple mapping mode is enabled
    if (this.isSimpleMappingMode) {
      console.log('🔧 Business Logic: Using simple mapping mode')
      return await this.processDocumentSimple(extractedData, userId)
    }

    // Original complex business logic (unchanged)
    const auditTrail: AuditLogEntry[] = []
    const processingNotes: string[] = []

    // Helper function to create audit entry
    const createAuditEntry = (fieldName: string, input: any, result: MappingField<any>): AuditLogEntry => ({
      field_name: fieldName,
      input_value: input ? String(input) : null,
      output_value: result.value ? String(result.value) : null,
      confidence_score: result.confidence,
      reasoning: result.reasoning,
      mapping_source: result.source,
      timestamp: new Date().toISOString()
    })

    try {
      // Extract basic values from extracted data
      const supplierName = extractedData.supplier_name?.value || ''
      const invoiceNumber = extractedData.invoice_number?.value || ''
      const invoiceDate = extractedData.invoice_date?.value || ''
      const totalAmount = typeof extractedData.total_amount?.value === 'number' 
        ? extractedData.total_amount.value 
        : parseFloat(String(extractedData.total_amount?.value || 0))
      const lineItems = extractedData.line_items || []
      const description = lineItems.map(item => item.value).join('; ') || 'No description available'

      // Map company code
      const companyCode = await this.mapCompanyCode(supplierName, userId)
      auditTrail.push(createAuditEntry('company_code', supplierName, companyCode))

      // Set transaction type (simplified - using "invoice" as default)
      const transactionType = this.setTransactionType('invoice')
      auditTrail.push(createAuditEntry('supplier_invoice_transaction_type', 'invoice', transactionType))

      // Map GL account
      const glAccount = await this.assignGLAccount(description, totalAmount, userId)
      auditTrail.push(createAuditEntry('gl_account', description, glAccount))

      // Determine cost center
      const costCenter = await this.determineCostCenter(supplierName, description, userId)
      auditTrail.push(createAuditEntry('cost_center', `${supplierName}|${description}`, costCenter))

      // Process dates
      const documentDate: MappingField<string> = {
        value: invoiceDate || new Date().toISOString().split('T')[0],
        confidence: invoiceDate ? 0.9 : 0.3,
        reasoning: invoiceDate ? 'Extracted from document' : 'Used current date as fallback',
        source: invoiceDate ? 'exact_match' : 'default'
      }

      const postingDate: MappingField<string> = {
        value: new Date().toISOString().split('T')[0],
        confidence: 1.0,
        reasoning: 'Set to current date for posting',
        source: 'default'
      }

      // Currency handling
      const currency: MappingField<string> = {
        value: this.config.default_currency,
        confidence: 0.7,
        reasoning: `Applied default currency: ${this.config.default_currency}`,
        source: 'default'
      }

      // Tax code
      const taxCode: MappingField<string> = {
        value: this.config.default_tax_code,
        confidence: 0.7,
        reasoning: `Applied default tax code: ${this.config.default_tax_code}`,
        source: 'default'
      }

      // Calculate overall confidence
      const mappedFields = [companyCode, transactionType, glAccount, costCenter, documentDate, currency, taxCode]
      const overallConfidence = mappedFields.reduce((sum, field) => sum + field.confidence, 0) / mappedFields.length

      // Determine if review is required
      const requiresReview = overallConfidence < this.config.confidence_threshold_for_auto_approve ||
                            companyCode.value === null ||
                            glAccount.value === null

      if (requiresReview) {
        processingNotes.push('Document requires manual review due to low confidence scores or missing mappings')
      }

      // Create the complete mapping result
      const result: AccountingMappingResult = {
        // Company and invoice identification
        company_code: companyCode,
        supplier_invoice_transaction_type: transactionType,
        invoicing_party: {
          value: supplierName || null,
          confidence: supplierName ? 0.9 : 0,
          reasoning: supplierName ? 'Extracted from document' : 'No supplier name found',
          source: 'exact_match'
        },
        supplier_invoice_id_by_invcg_party: {
          value: invoiceNumber || null,
          confidence: invoiceNumber ? 0.9 : 0,
          reasoning: invoiceNumber ? 'Extracted from document' : 'No invoice number found',
          source: 'exact_match'
        },

        // Date fields
        document_date: documentDate,
        posting_date: postingDate,

        // Document metadata
        accounting_document_type: {
          value: 'RE',
          confidence: 0.8,
          reasoning: 'Standard invoice document type',
          source: 'default'
        },
        accounting_document_header_text: {
          value: `Invoice from ${supplierName} - ${invoiceNumber}`,
          confidence: 0.8,
          reasoning: 'Generated header text from supplier and invoice number',
          source: 'rule_based'
        },
        document_currency: currency,
        invoice_gross_amount: {
          value: totalAmount || null,
          confidence: totalAmount ? 0.9 : 0,
          reasoning: totalAmount ? 'Extracted from document' : 'No amount found',
          source: 'exact_match'
        },

        // GL accounting fields
        gl_account: glAccount,
        supplier_invoice_item_text: {
          value: description || null,
          confidence: description ? 0.8 : 0,
          reasoning: description ? 'Extracted line items description' : 'No description available',
          source: 'exact_match'
        },
        debit_credit_code: {
          value: 'H', // Credit (vendor invoice increases payables)
          confidence: 1.0,
          reasoning: 'Vendor invoices are always credit entries',
          source: 'rule_based'
        },
        supplier_invoice_item_amount: {
          value: totalAmount || null,
          confidence: totalAmount ? 0.9 : 0,
          reasoning: totalAmount ? 'Same as gross amount for single line item' : 'No amount found',
          source: 'exact_match'
        },

        // Tax information
        tax_code: taxCode,
        tax_jurisdiction: {
          value: 'US',
          confidence: 0.6,
          reasoning: 'Default tax jurisdiction',
          source: 'default'
        },

        // Reference and cost allocation
        assignment_reference: {
          value: invoiceNumber || null,
          confidence: invoiceNumber ? 0.8 : 0,
          reasoning: invoiceNumber ? 'Using invoice number as reference' : 'No reference available',
          source: 'rule_based'
        },
        cost_center: costCenter,
        profit_center: {
          value: null,
          confidence: 0,
          reasoning: 'Profit center not determined - requires business rule configuration',
          source: 'default'
        },
        internal_order: {
          value: null,
          confidence: 0,
          reasoning: 'Internal order not determined - requires business rule configuration',
          source: 'default'
        },
        wbs_element: {
          value: null,
          confidence: 0,
          reasoning: 'WBS element not determined - requires business rule configuration',
          source: 'default'
        },

        // Overall metadata
        overall_confidence: overallConfidence,
        requires_review: requiresReview,
        processing_notes: processingNotes,
        audit_trail: auditTrail
      }

      // Save audit trail to database if enabled and document ID provided
      if (this.config.enable_audit_logging && documentId) {
        await this.saveAuditTrail(documentId, auditTrail)
      }

      return result

    } catch (error) {
      console.error('Error in processDocument:', error)
      
      // Return error result
      const errorResult: AccountingMappingResult = this.createErrorResult(error instanceof Error ? error.message : String(error))
      return errorResult
    }
  }

  /**
   * Save audit trail to database
   */
  private async saveAuditTrail(documentId: string, auditTrail: AuditLogEntry[]): Promise<void> {
    try {
      const auditRecords: Omit<BusinessLogicAudit, 'id' | 'created_at'>[] = auditTrail.map(entry => ({
        document_id: documentId,
        field_name: entry.field_name,
        input_value: entry.input_value,
        output_value: entry.output_value,
        confidence_score: entry.confidence_score,
        reasoning: entry.reasoning,
        mapping_source: entry.mapping_source
      }))

      const { error } = await supabaseAdmin
        .from('business_logic_audit')
        .insert(auditRecords)

      if (error) {
        console.error('Error saving audit trail:', error)
      }
    } catch (error) {
      console.error('Error in saveAuditTrail:', error)
    }
  }

  /**
   * Create error result when processing fails
   */
  private createErrorResult(errorMessage: string): AccountingMappingResult {
    const errorField = <T>(_fieldName: string): MappingField<T> => ({
      value: null as T,
      confidence: 0,
      reasoning: `Processing error: ${errorMessage}`,
      source: 'default'
    })

    return {
      company_code: errorField<string>('company_code'),
      supplier_invoice_transaction_type: errorField<string>('supplier_invoice_transaction_type'),
      invoicing_party: errorField<string>('invoicing_party'),
      supplier_invoice_id_by_invcg_party: errorField<string>('supplier_invoice_id_by_invcg_party'),
      document_date: errorField<string>('document_date'),
      posting_date: errorField<string>('posting_date'),
      accounting_document_type: errorField<string>('accounting_document_type'),
      accounting_document_header_text: errorField<string>('accounting_document_header_text'),
      document_currency: errorField<string>('document_currency'),
      invoice_gross_amount: errorField<number>('invoice_gross_amount'),
      gl_account: errorField<string>('gl_account'),
      supplier_invoice_item_text: errorField<string>('supplier_invoice_item_text'),
      debit_credit_code: errorField<string>('debit_credit_code'),
      supplier_invoice_item_amount: errorField<number>('supplier_invoice_item_amount'),
      tax_code: errorField<string>('tax_code'),
      tax_jurisdiction: errorField<string>('tax_jurisdiction'),
      assignment_reference: errorField<string>('assignment_reference'),
      cost_center: errorField<string>('cost_center'),
      profit_center: errorField<string>('profit_center'),
      internal_order: errorField<string>('internal_order'),
      wbs_element: errorField<string>('wbs_element'),
      overall_confidence: 0,
      requires_review: true,
      processing_notes: [`Fatal error during processing: ${errorMessage}`],
      audit_trail: []
    }
  }

  /**
   * Test connection and service health
   */
  async testConnection(): Promise<{ service: string; mappings: string; confidence: string }> {
    try {
      // Test database connectivity
      const { error } = await supabaseAdmin
        .from('company_mappings')
        .select('id')
        .limit(1)

      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        return {
          service: 'error',
          mappings: 'database_error',
          confidence: 'disabled'
        }
      }

      return {
        service: 'active',
        mappings: 'configured',
        confidence: 'enabled'
      }
    } catch (error) {
      console.error('Business logic service health check failed:', error)
      return {
        service: 'inactive',
        mappings: 'not_configured',
        confidence: 'disabled'
      }
    }
  }
}