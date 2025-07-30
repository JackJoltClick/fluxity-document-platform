import { ExtractionService } from './extraction.interface'
import { BaseExtractionService } from './base.service'
import { ExtractionResult, ExtractionError, ExtractionErrorType } from '@/src/types/extraction.types'

interface OpenAIFilesResponse {
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

export class OpenAIFilesExtractionService extends BaseExtractionService implements ExtractionService {
  private model = 'gpt-4o'
  private lastTokenUsage: { total: number; cost: number } = { total: 0, cost: 0 }

  constructor() {
    super({
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: 'https://api.openai.com/v1',
      timeout: 60000 // Extended timeout for file processing
    })
  }

  async extract(fileUrl: string): Promise<ExtractionResult> {
    this.validateUrl(fileUrl)

    try {
      // Step 1: Download and upload file to OpenAI Files API
      console.log('📄 OpenAI Files: Downloading PDF for upload...')
      const uploadedFile = await this.uploadFileToOpenAI(fileUrl)
      
      // Step 2: Use Chat Completions with file reference
      console.log('🤖 OpenAI Files: Processing PDF with GPT-4o...')
      const extractionResult = await this.extractFromUploadedFile(uploadedFile.id)
      
      // Step 3: Clean up - delete the uploaded file
      await this.deleteUploadedFile(uploadedFile.id)
      
      return extractionResult

    } catch (error) {
      console.error('❌ OpenAI Files Extraction: Error during extraction:', error)
      
      if (error instanceof ExtractionError) {
        throw error
      }

      throw new ExtractionError(
        ExtractionErrorType.NETWORK_ERROR,
        'Network error during OpenAI Files API request',
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
      console.log(`📤 OpenAI Files: Uploaded ${fileName} (${uploadResult.bytes} bytes)`)
      
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

  private async extractFromUploadedFile(fileId: string): Promise<ExtractionResult> {
    try {
      const payload = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the following information from this PDF document and return ONLY a JSON object with these exact fields:
                
                {
                  "supplier_name": {"value": "Company Name", "confidence": 0.95},
                  "invoice_number": {"value": "INV-12345", "confidence": 0.90},
                  "invoice_date": {"value": "2024-01-15", "confidence": 0.85},
                  "total_amount": {"value": "1250.00", "confidence": 0.95},
                  "line_items": [
                    {"value": "Item 1 - $100.00", "confidence": 0.90},
                    {"value": "Item 2 - $200.00", "confidence": 0.85}
                  ]
                }
                
                Rules:
                - Return confidence scores between 0 and 1
                - Use null for missing values
                - Extract line items as descriptive strings with amounts
                - Format dates as YYYY-MM-DD
                - Return ONLY the JSON object, no additional text`
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
        max_tokens: 1000,
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
      let data: OpenAIFilesResponse
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
          'No content returned from OpenAI Files API'
        )
      }

      // Clean the response by removing markdown code blocks if present
      let cleanedContent = extractedContent.trim()
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Parse JSON response
      let parsedData: any
      try {
        parsedData = JSON.parse(cleanedContent)
      } catch (parseError) {
        throw new ExtractionError(
          ExtractionErrorType.INVALID_RESPONSE,
          'Failed to parse OpenAI Files response as JSON',
          parseError
        )
      }

      // Use base class validation
      const validatedResult = this.createStandardResult(parsedData)
      this.cost = this.lastTokenUsage.cost
      
      return validatedResult

    } catch (error) {
      if (error instanceof ExtractionError) {
        throw error
      }

      throw new ExtractionError(
        ExtractionErrorType.API_ERROR,
        'Failed to extract from uploaded file',
        error
      )
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
        console.log(`🗑️ OpenAI Files: Cleaned up uploaded file ${fileId}`)
      } else {
        console.warn(`⚠️ OpenAI Files: Failed to delete file ${fileId}`)
      }
    } catch (error) {
      console.warn(`⚠️ OpenAI Files: Error deleting file ${fileId}:`, error)
      // Don't throw - cleanup failure shouldn't break the main flow
    }
  }

  private calculateAndLogCosts(usage: OpenAIFilesResponse['usage']) {
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

    console.log(`💰 OpenAI Files: Cost - Input: $${inputCost.toFixed(4)}, Output: $${outputCost.toFixed(4)}, Total: $${totalCost.toFixed(4)}`)
  }

  getName(): string {
    return 'OpenAI GPT-4o Files'
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
      console.error('❌ OpenAI Files Connection Test Failed:', error)
      return false
    }
  }
}