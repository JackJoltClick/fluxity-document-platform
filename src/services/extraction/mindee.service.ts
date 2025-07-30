import { ExtractionService } from './extraction.interface'
import { BaseExtractionService } from './base.service'
import { ExtractionResult, ExtractionError, ExtractionErrorType } from '@/src/types/extraction.types'

export class MindeeExtractionService extends BaseExtractionService implements ExtractionService {
  private fixedCost = 0.035 // Mindee's per-document cost
  private modelId = '0148557e-18b3-4d9b-9515-962074ebc365' // Custom model ID

  constructor() {
    super({
      apiKey: process.env.MINDEE_API_KEY || '',
      baseUrl: 'https://api-v2.mindee.net/v2/inferences/enqueue',
      timeout: 60000, // Longer timeout for polling
      retries: 30
    })
    
    this.cost = this.fixedCost
  }

  async extract(fileUrl: string): Promise<ExtractionResult> {
    this.validateUrl(fileUrl)

    try {
      // Download the file to process with Mindee
      const fileResponse = await this.makeRequest(fileUrl)
      
      if (!fileResponse.ok) {
        console.error('❌ Mindee Extraction: Failed to download file:', fileResponse.status)
        throw new ExtractionError(
          ExtractionErrorType.NETWORK_ERROR,
          `Failed to download file (${fileResponse.status})`
        )
      }

      const fileBuffer = await fileResponse.arrayBuffer()
      const fileName = this.getFileNameFromUrl(fileUrl)
      
      // Create form data for Mindee V2 API
      const formData = new FormData()
      formData.append('model_id', this.modelId)
      formData.append('rag', 'false')
      formData.append('file', new Blob([fileBuffer]), fileName)
      
      const headers = {
        'Authorization': this.config.apiKey
      }
      
      // Step 1: Enqueue the file
      const enqueueResponse = await this.makeRequest(this.config.baseUrl, {
        method: 'POST',
        headers,
        body: formData
      })
      
      if (!enqueueResponse.ok) {
        const errorText = await enqueueResponse.text()
        console.error('❌ Mindee Extraction: Enqueue failed:', enqueueResponse.status, errorText)
        this.handleApiError(enqueueResponse, errorText)
      }
      
      const enqueueData = await enqueueResponse.json()
      const jobData = enqueueData.job
      const pollingUrl = jobData.polling_url
      
      // Step 2: Poll for results
      await new Promise(resolve => setTimeout(resolve, 3000)) // Initial wait
      
      const maxRetries = this.config.retries || 30
      const pollingInterval = 2
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const pollResponse = await this.makeRequest(pollingUrl, {
          headers,
          redirect: 'manual' // Handle redirects manually
        })
        
        if (pollResponse.status === 302 || pollResponse.status === 200) {
          const pollData = await pollResponse.json()
          const jobStatus = pollData.job?.status
          
          if (pollResponse.status === 302 || jobStatus === 'Processed') {
            const resultUrl = pollData.job?.result_url
            
            // Step 3: Get final results
            const resultResponse = await this.makeRequest(resultUrl, { headers })
            
            if (!resultResponse.ok) {
              console.error('❌ Mindee Extraction: Failed to get results:', resultResponse.status)
              const errorText = await resultResponse.text()
              this.handleApiError(resultResponse, errorText)
            }
            
            const resultData = await resultResponse.json()
            
            // Transform V2 response to our ExtractionResult format
            const result = this.transformMindeeV2Response(resultData)
            
            return result
          }
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollingInterval * 1000))
      }
      
      console.error('❌ Mindee Extraction: Polling timed out')
      throw new ExtractionError(
        ExtractionErrorType.TIMEOUT,
        `Polling timed out after ${maxRetries} attempts`
      )

    } catch (error) {
      console.error('❌ Mindee Extraction: Error during extraction:', error)
      
      if (error instanceof ExtractionError) {
        throw error
      }
      
      throw new ExtractionError(
        ExtractionErrorType.NETWORK_ERROR,
        error instanceof Error ? error.message : 'Unknown error during Mindee extraction',
        error
      )
    }
  }

  private transformMindeeV2Response(resultData: any): ExtractionResult {
    // V2 API uses inference.result.fields structure
    const fields = resultData.inference?.result?.fields
    
    if (!fields) {
      throw new ExtractionError(
        ExtractionErrorType.INVALID_RESPONSE,
        'No fields data in response'
      )
    }
    
    // Transform line items with proper descriptions
    const lineItems = fields.line_items?.items?.map((item: any, index: number) => {
      const itemFields = item.fields || {}
      const description = itemFields.description?.value || `Item ${index + 1}`
      const quantity = itemFields.quantity?.value || 1
      const unitPrice = itemFields.unit_price?.value || 0
      const totalPrice = itemFields.total_price?.value || 0
      
      const itemDescription = `${description} (${quantity} × $${unitPrice}) = $${totalPrice}`
      
      return {
        value: itemDescription,
        confidence: this.validateConfidence(item.confidence) || 0.8
      }
    }) || []
    
    // Create standardized data structure
    const standardizedData = {
      supplier_name: {
        value: fields.supplier_name?.value || null,
        confidence: fields.supplier_name?.confidence || 0.8
      },
      invoice_number: {
        value: fields.invoice_number?.value || null,
        confidence: fields.invoice_number?.confidence || 0.8
      },
      invoice_date: {
        value: fields.date?.value || null,
        confidence: fields.date?.confidence || 0.8
      },
      total_amount: {
        value: fields.total_amount?.value?.toString() || null,
        confidence: fields.total_amount?.confidence || 0.8
      },
      line_items: lineItems
    }
    
    return this.createStandardResult(standardizedData)
  }



  private getFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const fileName = pathname.split('/').pop() || 'document'
      return fileName
    } catch {
      return 'document'
    }
  }

  getName(): string {
    return 'Mindee Invoice API'
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test the API key with a direct REST API call to V2 API
      const response = await this.makeRequest('https://api-v2.mindee.net/v2/inferences/enqueue', {
        method: 'POST',
        headers: {
          'Authorization': this.config.apiKey
        }
      })
      
      // We expect a 400 error (bad request) because we're not sending a document
      // But if we get 401, it means the API key is invalid
      // If we get 400, it means the API key is valid but we're missing the document
      if (response.status === 401) {
        console.error('❌ Mindee Service: API key is invalid or revoked')
        return false
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Mindee Service: Connection test failed:', error)
      return false
    }
  }
}