import { ExtractionService } from './extraction.interface'
import { BaseExtractionService } from './base.service'
import { ExtractionResult, ExtractionError, ExtractionErrorType } from '@/src/types/extraction.types'
import { DirectAccountingFields } from '@/src/types/document.types'
import { VendorExtractionRulesService } from '@/src/services/vendors/vendor-extraction-rules.service'
import { PromptSanitizerService } from '@/src/services/security/prompt-sanitizer.service'

interface OpenAIAccountingResponse {
  choices: {
    message: {
      content: string
    }
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface FileUploadResponse {
  id: string
  object: string
  bytes: number
  created_at: number
  filename: string
  purpose: string
}

// Use the interface from types
type DirectAccountingExtraction = DirectAccountingFields

export class OpenAIAccountingExtractionService extends BaseExtractionService implements ExtractionService {
  private model = 'gpt-4o'
  private lastTokenUsage: { total: number; cost: number } = { total: 0, cost: 0 }
  private vendorRulesService: VendorExtractionRulesService
  private promptSanitizer: PromptSanitizerService

  constructor() {
    super({
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: 'https://api.openai.com/v1',
      timeout: 60000 // Extended timeout for file processing
    })
    this.vendorRulesService = new VendorExtractionRulesService()
    this.promptSanitizer = new PromptSanitizerService()
  }

  async extract(fileUrl: string, options?: { vendorId?: string; userId?: string }): Promise<ExtractionResult> {
    this.validateUrl(fileUrl)

    try {
      // Step 1: Download and upload file to OpenAI Files API
      console.log('📄 OpenAI Accounting: Downloading PDF for direct accounting extraction...')
      const uploadedFile = await this.uploadFileToOpenAI(fileUrl)
      
      // Step 2: Get vendor-specific rules if provided
      let vendorRules: any[] = []
      if (options?.vendorId && options?.userId) {
        try {
          const rawRules = await this.vendorRulesService.getVendorExtractionRules(options.vendorId)
          // Sanitize all vendor rules before using in prompts
          vendorRules = this.promptSanitizer.sanitizeVendorRules(rawRules)
          console.log(`📋 OpenAI Accounting: Found ${rawRules.length} vendor rules, ${vendorRules.length} passed security validation`)
          
          if (rawRules.length !== vendorRules.length) {
            console.warn(`🚨 OpenAI Accounting: ${rawRules.length - vendorRules.length} vendor rules were filtered for security`)
            // Log security violation if rules were filtered
            if (options.userId) {
              await this.promptSanitizer.logSecurityViolation(
                options.userId,
                'vendor_rules_filtered',
                `${rawRules.length - vendorRules.length} rules contained dangerous content`
              )
            }
          }
        } catch (error) {
          console.warn('⚠️ OpenAI Accounting: Failed to fetch vendor rules:', error)
          // Continue without vendor rules
        }
      }
      
      // Step 3: Use Chat Completions with direct accounting extraction
      console.log('🧠 OpenAI Accounting: Processing PDF with direct accounting field extraction...')
      const extractionResult = await this.extractAccountingFieldsDirectly(uploadedFile.id, vendorRules)
      
      // Step 4: Clean up - delete the uploaded file
      await this.deleteUploadedFile(uploadedFile.id)
      
      return extractionResult

    } catch (error) {
      console.error('❌ OpenAI Accounting Extraction: Error during extraction:', error)
      
      if (error instanceof ExtractionError) {
        throw error
      }

      throw new ExtractionError(
        ExtractionErrorType.NETWORK_ERROR,
        'Network error during OpenAI Accounting API request',
        error
      )
    }
  }

  private async uploadFileToOpenAI(fileUrl: string): Promise<FileUploadResponse> {
    try {
      // Download the file
      const response = await this.makeRequest(fileUrl, { method: 'GET' })
      
      if (!response.ok) {
        throw new ExtractionError(
          ExtractionErrorType.INVALID_RESPONSE,
          `File URL is not accessible (${response.status})`
        )
      }

      // Get file as blob
      const fileBlob = await response.blob()
      const fileName = fileUrl.split('/').pop() || 'document.pdf'
      
      // Create form data for file upload
      const formData = new FormData()
      formData.append('file', fileBlob, fileName)
      formData.append('purpose', 'assistants')

      // Upload to OpenAI Files API
      const uploadResponse = await this.makeRequest(`${this.config.baseUrl}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        throw new ExtractionError(
          ExtractionErrorType.API_ERROR,
          `File upload failed: ${errorText}`
        )
      }

      const uploadResult: FileUploadResponse = await uploadResponse.json()
      console.log(`📤 OpenAI Accounting: Uploaded ${fileName} (${uploadResult.bytes} bytes)`)
      
      return uploadResult

    } catch (error) {
      if (error instanceof ExtractionError) {
        throw error
      }
      
      throw new ExtractionError(
        ExtractionErrorType.NETWORK_ERROR,
        'Failed to upload file to OpenAI',
        error
      )
    }
  }

  private async extractAccountingFieldsDirectly(fileId: string, vendorRules: any[] = []): Promise<ExtractionResult> {
    try {
      const payload = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a specialized SAP invoice data extraction assistant. You must extract data from this document using CONSISTENT evaluation criteria for both confidence scoring and justification reasoning.

**CRITICAL: Your confidence scores and justification explanations must align perfectly. If you assign low confidence, explain why in the justification. If you explain "high confidence," the score must reflect that.**

${this.buildVendorRulesContext(vendorRules)}

Return your response in TWO parts:

1. **JSON DATA**: Structured data extraction with confidence scores
2. **JUSTIFICATION REPORT**: Detailed reasoning that MATCHES your confidence scores

## PART 1: JSON DATA

{
  "document_metadata": {
    "document_type": "invoice",
    "extraction_timestamp": "2025-07-26T12:00:00Z",
    "overall_confidence": 0.85
  },
  "sap_invoice_fields": {
    "invoicing_party": {"value": "Company Name as written", "confidence": 0.95},
    "supplier_invoice_id_by_invcg_party": {"value": "Invoice number as shown", "confidence": 0.90},
    "company_code": {"value": "NEEDS_ASSIGNMENT", "confidence": 0.60},
    "supplier_invoice_transaction_type": {"value": "INVOICE", "confidence": 0.90},
    
    "document_date": {"value": "2024-01-15", "confidence": 0.85},
    "posting_date": {"value": "2024-01-15", "confidence": 0.80},
    
    "accounting_document_type": {"value": "NEEDS_ASSIGNMENT", "confidence": 0.60},
    "accounting_document_header_text": {"value": "Invoice from Company - INV123", "confidence": 0.75},
    "document_currency": {"value": "USD", "confidence": 0.90},
    "invoice_gross_amount": {"value": 1250.00, "confidence": 0.95},
    
    "gl_account": {"value": "NEEDS_ASSIGNMENT", "confidence": 0.60},
    "supplier_invoice_item_text": {"value": "Description as written", "confidence": 0.85},
    "debit_credit_code": {"value": "NEEDS_ASSIGNMENT", "confidence": 0.60},
    "supplier_invoice_item_amount": {"value": 1250.00, "confidence": 0.95},
    
    "tax_code": {"value": "NEEDS_ASSIGNMENT", "confidence": 0.60},
    "tax_jurisdiction": {"value": "US", "confidence": 0.80},
    
    "assignment_reference": {"value": "Reference if visible", "confidence": 0.80},
    "cost_center": {"value": "NEEDS_ASSIGNMENT", "confidence": 0.60},
    "profit_center": {"value": "NEEDS_ASSIGNMENT", "confidence": 0.60},
    "internal_order": {"value": "NOT_APPLICABLE", "confidence": 0.90},
    "wbs_element": {"value": "NOT_APPLICABLE", "confidence": 0.90}
  },
  "validation_flags": {
    "total_amount_verified": true,
    "date_format_valid": true,
    "required_fields_present": true,
    "currency_identified": true
  }
}

## PART 2: JUSTIFICATION REPORT

**ALIGNMENT REQUIREMENT: Your confidence explanations MUST match your assigned scores. Do not say "high confidence" if you scored it 0.4.**

### Field Extraction Justifications

For each field, explain using the SAME criteria used for confidence scoring:

**Template for each field:**
- **Field Name** (Confidence: X.X)
  - **Source Location**: Exact location on document (or "Not visible" if absent)
  - **Text Quality**: Clear/Blurry/Partially visible/Not readable
  - **Interpretation Required**: None/Minor/Significant  
  - **Confidence Reasoning**: Why this specific score was assigned
  - **Business Notes**: Accounting implications

### Confidence Scoring Standards (USE THESE EXACT CRITERIA):

**0.9-1.0 (Excellent):**
- Text is crystal clear, large, well-positioned
- No interpretation required
- Standard business formatting
- Example: "ACME CORPORATION" in document header

**0.7-0.9 (Good):**
- Text is readable but requires minor interpretation
- Standard positioning but may need formatting
- Example: "01/15/2024" needs conversion to "2024-01-15"

**0.5-0.7 (Fair):**
- Text is partially visible or unclear
- Requires significant interpretation
- Multiple possible meanings
- Example: Handwritten amounts, unclear dates

**0.3-0.6 (Poor):**
- NEEDS_ASSIGNMENT fields (not visible in document)
- Text is barely readable or highly ambiguous
- High risk of incorrect interpretation

**0.9+ (Not Applicable):**
- NOT_APPLICABLE fields that don't apply to document type
- Fields explicitly marked as irrelevant

### Document Analysis Summary
- Overall document quality assessment
- Missing information requiring manual assignment
- Confidence score distribution explanation

## EXTRACTION RULES:

**Consistency Mandate:**
- If you score a field 0.9, explain it as "high confidence due to clear visibility"
- If you score a field 0.4, explain it as "low confidence due to poor visibility/absence"
- NEVER say "high confidence" for scores below 0.8
- NEVER say "low confidence" for scores above 0.7

**Document-Only Principle:**
- Extract ONLY visible information
- Use "NEEDS_ASSIGNMENT" for missing business codes (score: 0.6)
- Use "NOT_APPLICABLE" for irrelevant fields (score: 0.9)

**Critical Requirements:**
- Confidence scores and justifications must tell the same story
- Every score must be explainable by document visibility and clarity
- No contradictions between numbers and explanations`
              },
              {
                type: 'file',
                file: {
                  file_id: fileId
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      }

      const response = await this.makeRequest(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.handleApiError(response, errorText)
      }

      const responseText = await response.text()
      let data: OpenAIAccountingResponse
      try {
        data = JSON.parse(responseText)
      } catch (jsonError) {
        throw new ExtractionError(
          ExtractionErrorType.INVALID_RESPONSE,
          'OpenAI returned invalid JSON response',
          jsonError
        )
      }
      
      // Calculate and log costs
      this.calculateAndLogCosts(data.usage)
      
      // Parse the extracted content
      const extractedContent = data.choices[0]?.message?.content
      if (!extractedContent) {
        throw new ExtractionError(
          ExtractionErrorType.INVALID_RESPONSE,
          'No content returned from OpenAI Accounting API'
        )
      }

      // Parse the two-part response: JSON + Justification Report
      const { jsonData, justificationReport } = this.parseStructuredResponse(extractedContent)
      
      // Parse JSON response
      let accountingData: DirectAccountingExtraction
      let documentMetadata: any = {}
      let validationFlags: any = {}
      
      try {
        const parsedData = JSON.parse(jsonData)
        // Extract the sap_invoice_fields from the structured response
        accountingData = parsedData.sap_invoice_fields || parsedData
        documentMetadata = parsedData.document_metadata || {}
        validationFlags = parsedData.validation_flags || {}
      } catch (parseError) {
        throw new ExtractionError(
          ExtractionErrorType.INVALID_RESPONSE,
          'Failed to parse OpenAI Accounting response as JSON',
          parseError
        )
      }

      // Convert to standard ExtractionResult format (temporary compatibility)
      const standardResult: ExtractionResult = {
        supplier_name: accountingData.invoicing_party,
        invoice_number: accountingData.supplier_invoice_id_by_invcg_party,
        invoice_date: accountingData.document_date,
        total_amount: accountingData.invoice_gross_amount,
        line_items: [accountingData.supplier_invoice_item_text],
        // Store all accounting fields in extraction result for direct access
        accounting_fields: accountingData,
        // Store AI justification report and metadata
        justification_report: justificationReport,
        document_metadata: documentMetadata,
        validation_flags: validationFlags
      }
      
      this.cost = this.lastTokenUsage.cost
      
      return standardResult

    } catch (error) {
      if (error instanceof ExtractionError) {
        throw error
      }

      throw new ExtractionError(
        ExtractionErrorType.API_ERROR,
        'Failed to extract accounting fields directly',
        error
      )
    }
  }

  private buildVendorRulesContext(vendorRules: any[]): string {
    if (!vendorRules || vendorRules.length === 0) {
      return ''
    }

    let context = '\n**VENDOR-SPECIFIC INSTRUCTIONS:**\n'
    context += 'The following vendor-specific rules should guide your extraction:\n\n'

    const rulesByType = vendorRules.reduce((acc, rule) => {
      if (!acc[rule.rule_type]) acc[rule.rule_type] = []
      acc[rule.rule_type].push(rule.instruction)
      return acc
    }, {})

    if (rulesByType.extraction_hint) {
      context += '📍 **Document Layout Hints:**\n'
      rulesByType.extraction_hint.forEach((instruction: string) => {
        context += `- ${instruction}\n`
      })
      context += '\n'
    }

    // Note: GL account assignment handled by existing business logic, not vendor hints

    if (rulesByType.cost_center_hint) {
      context += '🏢 **Cost Center Hints:**\n'
      rulesByType.cost_center_hint.forEach((instruction: string) => {
        context += `- ${instruction}\n`
      })
      context += '\n'
    }

    if (rulesByType.validation_rule) {
      context += '✓ **Validation Rules:**\n'
      rulesByType.validation_rule.forEach((instruction: string) => {
        context += `- ${instruction}\n`
      })
      context += '\n'
    }

    context += '**Use these vendor-specific instructions to improve extraction accuracy and provide more relevant field mappings.**\n'
    
    return context
  }

  private parseStructuredResponse(content: string): { jsonData: string; justificationReport: string } {
    try {
      // Look for JSON data in the response
      const jsonStartMarkers = ['```json', '{', '## PART 1:', '1. **JSON DATA**']
      const reportStartMarkers = ['## PART 2:', '2. **JUSTIFICATION REPORT**', '### Field Extraction', '## JUSTIFICATION REPORT']
      
      let jsonData = ''
      let justificationReport = ''
      
      // Try to extract JSON from various possible formats
      if (content.includes('```json')) {
        // Extract from code block
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          jsonData = jsonMatch[1].trim()
        }
      } else if (content.includes('{') && content.includes('}')) {
        // Try to find JSON object in the text
        const startIndex = content.indexOf('{')
        if (startIndex !== -1) {
          // Find the matching closing brace
          let braceCount = 0
          let endIndex = startIndex
          for (let i = startIndex; i < content.length; i++) {
            if (content[i] === '{') braceCount++
            if (content[i] === '}') braceCount--
            if (braceCount === 0) {
              endIndex = i
              break
            }
          }
          jsonData = content.substring(startIndex, endIndex + 1).trim()
        }
      }
      
      // Extract justification report (everything after JSON or after part 2 marker)
      const part2Index = content.search(/##\s*PART\s*2|2\.\s*\*\*JUSTIFICATION\s*REPORT|##\s*JUSTIFICATION\s*REPORT|###\s*Field\s*Extraction/i)
      
      if (part2Index !== -1) {
        justificationReport = content.substring(part2Index).trim()
      } else if (jsonData) {
        // If we found JSON, try to extract everything after it as the report
        const jsonEndIndex = content.lastIndexOf(jsonData) + jsonData.length
        const remainingContent = content.substring(jsonEndIndex).trim()
        
        // Look for markdown content (lines starting with #, -, *, etc.)
        if (remainingContent && (remainingContent.includes('#') || remainingContent.includes('**') || remainingContent.includes('-'))) {
          justificationReport = remainingContent
        }
      }
      
      // Fallback: if no structured format found, try to extract any JSON and treat rest as report
      if (!jsonData && content.includes('{')) {
        const firstBrace = content.indexOf('{')
        const lastBrace = content.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonData = content.substring(firstBrace, lastBrace + 1).trim()
          justificationReport = content.substring(lastBrace + 1).trim()
        }
      }
      
      // If still no JSON found, try the whole content as JSON (fallback)
      if (!jsonData) {
        jsonData = content.trim()
        justificationReport = 'No structured justification report provided.'
      }
      
      return { jsonData, justificationReport }
      
    } catch (error) {
      console.warn('⚠️ OpenAI Accounting: Failed to parse structured response, using content as JSON:', error)
      return { 
        jsonData: content.trim(), 
        justificationReport: 'Failed to extract justification report from AI response.' 
      }
    }
  }

  private async deleteUploadedFile(fileId: string): Promise<void> {
    try {
      const response = await this.makeRequest(`${this.config.baseUrl}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        }
      })

      if (response.ok) {
        console.log(`🗑️ OpenAI Accounting: Cleaned up uploaded file ${fileId}`)
      } else {
        console.warn(`⚠️ OpenAI Accounting: Failed to delete file ${fileId}`)
      }
    } catch (error) {
      console.warn(`⚠️ OpenAI Accounting: Error deleting file ${fileId}:`, error)
      // Don't throw - cleanup failure shouldn't break the main flow
    }
  }

  private calculateAndLogCosts(usage: OpenAIAccountingResponse['usage']) {
    // GPT-4o pricing (as of 2024)
    const inputCostPer1kTokens = 0.005   // $0.005 per 1k tokens
    const outputCostPer1kTokens = 0.015  // $0.015 per 1k tokens
    
    const inputCost = (usage.prompt_tokens / 1000) * inputCostPer1kTokens
    const outputCost = (usage.completion_tokens / 1000) * outputCostPer1kTokens
    const totalCost = inputCost + outputCost

    this.lastTokenUsage = {
      total: usage.total_tokens,
      cost: totalCost
    }

    console.log(`💰 OpenAI Accounting: Cost - Input: $${inputCost.toFixed(4)}, Output: $${outputCost.toFixed(4)}, Total: $${totalCost.toFixed(4)}`)
  }

  getName(): string {
    return 'OpenAI GPT-4o Direct Accounting'
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${this.config.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        }
      })

      return response.ok
    } catch (error) {
      console.error('❌ OpenAI Accounting Connection Test Failed:', error)
      return false
    }
  }
}