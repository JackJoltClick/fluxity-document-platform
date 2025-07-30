import { ExtractionResult, ExtractionError, ExtractionErrorType } from '@/src/types/extraction.types'

export interface ServiceConfig {
  apiKey: string
  timeout?: number
  retries?: number
  baseUrl: string
}

export abstract class BaseExtractionService {
  protected config: ServiceConfig
  protected cost: number = 0
  
  constructor(config: ServiceConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config
    }
    
    if (!this.config.apiKey) {
      throw new ExtractionError(
        ExtractionErrorType.CONFIGURATION_ERROR,
        'API key is required'
      )
    }
  }

  protected async makeRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ExtractionError(
          ExtractionErrorType.TIMEOUT,
          `Request timed out after ${this.config.timeout}ms`
        )
      }
      
      throw new ExtractionError(
        ExtractionErrorType.NETWORK_ERROR,
        'Network error during API request',
        error
      )
    }
  }

  protected validateUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new ExtractionError(
        ExtractionErrorType.INVALID_RESPONSE,
        'Invalid file URL provided'
      )
    }

    try {
      new URL(url)
    } catch {
      throw new ExtractionError(
        ExtractionErrorType.INVALID_RESPONSE,
        'Invalid file URL format'
      )
    }
  }

  protected validateField(field: any, fieldName: string) {
    if (!field || typeof field !== 'object') {
      return { value: null, confidence: 0.0 }
    }

    return {
      value: field.value || null,
      confidence: this.validateConfidence(field.confidence)
    }
  }

  protected validateConfidence(confidence: any): number {
    if (typeof confidence !== 'number' || isNaN(confidence)) {
      return 0.0
    }
    return Math.max(0, Math.min(1, confidence))
  }

  protected validateLineItems(items: any): Array<{value: string | null, confidence: number}> {
    if (!Array.isArray(items)) {
      return []
    }

    return items.map((item, index) => {
      if (!item || typeof item !== 'object') {
        return { value: null, confidence: 0.0 }
      }

      return {
        value: item.value || null,
        confidence: this.validateConfidence(item.confidence)
      }
    })
  }

  protected createStandardResult(data: any): ExtractionResult {
    return {
      supplier_name: this.validateField(data.supplier_name, 'supplier_name'),
      invoice_number: this.validateField(data.invoice_number, 'invoice_number'),
      invoice_date: this.validateField(data.invoice_date, 'invoice_date'),
      total_amount: this.validateField(data.total_amount, 'total_amount'),
      line_items: this.validateLineItems(data.line_items)
    }
  }

  protected handleApiError(response: Response, errorText: string): never {
    switch (response.status) {
      case 401:
        throw new ExtractionError(
          ExtractionErrorType.AUTHENTICATION_ERROR,
          'Invalid API key or unauthorized access'
        )
      case 402:
        throw new ExtractionError(
          ExtractionErrorType.QUOTA_EXCEEDED,
          'API quota exceeded'
        )
      case 413:
        throw new ExtractionError(
          ExtractionErrorType.FILE_TOO_LARGE,
          'File too large for API'
        )
      case 415:
        throw new ExtractionError(
          ExtractionErrorType.UNSUPPORTED_FORMAT,
          'Unsupported file format'
        )
      case 429:
        throw new ExtractionError(
          ExtractionErrorType.RATE_LIMIT_EXCEEDED,
          'API rate limit exceeded'
        )
      default:
        throw new ExtractionError(
          ExtractionErrorType.API_ERROR,
          `API error: ${response.status} ${response.statusText}`,
          errorText
        )
    }
  }

  getCost(): number {
    return this.cost
  }

  abstract getName(): string
  abstract extract(fileUrl: string): Promise<ExtractionResult>
  abstract testConnection(): Promise<boolean>
}