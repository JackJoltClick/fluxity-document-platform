import { ExtractionService } from './extraction.interface'
import { OpenAIExtractionService } from './openai.service'
import { OpenAIFilesExtractionService } from './openai-files.service'
import { OpenAIAccountingExtractionService } from './openai-accounting.service'
import { MindeeExtractionService } from './mindee.service'
import { ExtractionResult, ExtractionError, ExtractionErrorType } from '@/src/types/extraction.types'

export type ExtractionServiceType = 'openai' | 'mindee' | 'auto'

export interface ExtractionRouterResult extends ExtractionResult {
  extraction_method: string
  total_cost: number
  services_used: string[]
  fallback_occurred: boolean
  decision_log: string[]
}

export class ExtractionRouterService implements ExtractionService {
  private openaiService: OpenAIExtractionService
  private openaiFilesService: OpenAIFilesExtractionService
  private openaiAccountingService: OpenAIAccountingExtractionService
  private mindeeService: MindeeExtractionService
  private serviceConfig: ExtractionServiceType
  private confidenceThreshold: number
  private decisionLog: string[] = []
  private servicesUsed: string[] = []
  private totalCost: number = 0

  constructor() {
    this.openaiService = new OpenAIExtractionService()
    this.openaiFilesService = new OpenAIFilesExtractionService()
    this.openaiAccountingService = new OpenAIAccountingExtractionService()
    this.mindeeService = new MindeeExtractionService()
    this.serviceConfig = (process.env.EXTRACTION_SERVICE as ExtractionServiceType) || 'auto'
    this.confidenceThreshold = parseFloat(process.env.EXTRACTION_CONFIDENCE_THRESHOLD || '0.7')
    
    console.log(`🔄 Extraction Router: Initialized with service='${this.serviceConfig}', threshold=${this.confidenceThreshold}`)
  }

  async extract(fileUrl: string, options?: { vendorId?: string; userId?: string }): Promise<ExtractionRouterResult> {
    this.decisionLog = []
    this.servicesUsed = []
    this.totalCost = 0
    let fallbackOccurred = false

    console.log(`🔄 Extraction Router: Starting extraction for ${fileUrl}`)
    this.logDecision(`Starting extraction with service config: ${this.serviceConfig}`)

    try {
      // Determine primary service based on configuration and file type
      const primaryService = this.determinePrimaryService(fileUrl)
      this.logDecision(`Primary service determined: ${primaryService}`)

      // Attempt extraction with primary service
      let result = await this.attemptExtraction(primaryService, fileUrl, options)
      
      // Check if fallback is needed (only for auto mode or if primary service fails)
      if (this.shouldFallback(result, primaryService)) {
        fallbackOccurred = true
        const fallbackService = this.determineFallbackService(primaryService)
        this.logDecision(`Fallback triggered - using ${fallbackService}`)
        
        try {
          result = await this.attemptExtraction(fallbackService, fileUrl, options)
        } catch (fallbackError) {
          this.logDecision(`Fallback service ${fallbackService} also failed`)
          throw new ExtractionError(
            ExtractionErrorType.API_ERROR,
            `Both ${primaryService} and ${fallbackService} services failed`,
            fallbackError
          )
        }
      }

      // Create router result with metadata
      const routerResult: ExtractionRouterResult = {
        ...result,
        extraction_method: this.servicesUsed.join(' → '),
        total_cost: this.totalCost,
        services_used: [...this.servicesUsed],
        fallback_occurred: fallbackOccurred,
        decision_log: [...this.decisionLog]
      }

      console.log(`✅ Extraction Router: Completed successfully with ${routerResult.extraction_method}`)
      console.log(`💰 Extraction Router: Total cost: $${this.totalCost.toFixed(4)}`)
      
      return routerResult

    } catch (error) {
      console.error('❌ Extraction Router: Error during extraction:', error)
      
      if (error instanceof ExtractionError) {
        throw error
      }
      
      throw new ExtractionError(
        ExtractionErrorType.NETWORK_ERROR,
        'Extraction router failed',
        error
      )
    }
  }

  private determinePrimaryService(fileUrl: string): 'openai' | 'mindee' {
    let primaryService: 'openai' | 'mindee'
    
    switch (this.serviceConfig) {
      case 'openai':
        // When explicitly configured for OpenAI, use it regardless of file type
        primaryService = 'openai'
        break
      case 'mindee':
        // When explicitly configured for Mindee, use it regardless of file type
        primaryService = 'mindee'
        break
      case 'auto':
      default:
        // For auto mode, intelligently route based on file type
        primaryService = this.getOptimalServiceForFile(fileUrl)
        break
    }
    
    console.log(`🔄 Extraction Router: Primary service determined: ${primaryService} (config: ${this.serviceConfig})`)
    return primaryService
  }

  private getOptimalServiceForFile(fileUrl: string): 'openai' | 'mindee' {
    const fileExtension = fileUrl.split('.').pop()?.toLowerCase()
    
    // OpenAI Vision API only supports image formats (not PDFs)
    const openaiSupportedFormats = ['png', 'jpeg', 'jpg', 'gif', 'webp']
    
    if (fileExtension && openaiSupportedFormats.includes(fileExtension)) {
      this.logDecision(`File type '${fileExtension}' is supported by OpenAI Vision API - routing to OpenAI`)
      return 'openai'
    } else {
      this.logDecision(`File type '${fileExtension}' is not supported by OpenAI Vision API - routing to Mindee`)
      return 'mindee'
    }
  }

  private determineFallbackService(primaryService: 'openai' | 'mindee'): 'openai' | 'mindee' {
    return primaryService === 'openai' ? 'mindee' : 'openai'
  }

  private shouldFallback(result: ExtractionResult, primaryService: 'openai' | 'mindee'): boolean {
    // Only fallback in auto mode
    if (this.serviceConfig !== 'auto') {
      return false
    }

    // Check if confidence is below threshold for key fields
    const keyFields = [result.supplier_name, result.total_amount, result.invoice_date]
    const lowConfidenceFields = keyFields.filter(field => field.confidence < this.confidenceThreshold)
    
    if (lowConfidenceFields.length > 0) {
      this.logDecision(`Low confidence detected in ${lowConfidenceFields.length} key fields (threshold: ${this.confidenceThreshold})`)
      return true
    }

    // Check if critical fields are missing
    const criticalFields = [result.supplier_name, result.total_amount]
    const missingCriticalFields = criticalFields.filter(field => !field.value)
    
    if (missingCriticalFields.length > 0) {
      this.logDecision(`Missing critical fields: ${missingCriticalFields.length}`)
      return true
    }

    return false
  }

  private async attemptExtraction(serviceType: 'openai' | 'mindee', fileUrl: string, options?: { vendorId?: string; userId?: string }): Promise<ExtractionResult> {
    let service: ExtractionService
    let serviceName: string
    
    if (serviceType === 'openai') {
      // Check if it's a PDF - use appropriate OpenAI service
      const fileExtension = fileUrl.split('.').pop()?.toLowerCase()
      const isPdf = fileExtension === 'pdf'
      const isSimpleMappingMode = process.env.SIMPLE_MAPPING_MODE === 'true'
      
      if (isPdf && isSimpleMappingMode) {
        service = this.openaiAccountingService
        serviceName = 'openai-accounting'
        this.logDecision(`Using OpenAI Accounting API for direct field extraction`)
      } else if (isPdf) {
        service = this.openaiFilesService
        serviceName = 'openai-files'
        this.logDecision(`Using OpenAI Files API for PDF processing`)
      } else {
        service = this.openaiService
        serviceName = 'openai-vision'
        this.logDecision(`Using OpenAI Vision API for image processing`)
      }
    } else {
      service = this.mindeeService
      serviceName = 'mindee'
    }
    
    console.log(`🔄 Extraction Router: Attempting extraction with ${serviceName}`)
    this.logDecision(`Attempting extraction with ${serviceName}`)
    
    try {
      const result = serviceName === 'openai-accounting' 
        ? await (service as any).extract(fileUrl, options)
        : await service.extract(fileUrl)
      const cost = service.getCost()
      
      this.servicesUsed.push(serviceName)
      this.totalCost += cost
      
      this.logDecision(`${serviceName} extraction successful - Cost: $${cost.toFixed(4)}`)
      
      // Log confidence scores for decision making
      this.logDecision(`Confidence scores - supplier: ${result.supplier_name.confidence}, total: ${result.total_amount.confidence}, date: ${result.invoice_date.confidence}`)
      
      return result
      
    } catch (error) {
      this.logDecision(`${serviceName} extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  private logDecision(message: string): void {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}`
    this.decisionLog.push(logEntry)
    console.log(`🔄 Extraction Router: ${message}`)
  }

  getName(): string {
    return `Extraction Router (${this.serviceConfig})`
  }

  getCost(): number {
    return this.totalCost
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔄 Extraction Router: Testing service connections...')
      
      const openaiConnected = await this.openaiService.testConnection()
      const openaiFilesConnected = await this.openaiFilesService.testConnection()
      const mindeeConnected = await this.mindeeService.testConnection()
      
      console.log(`🔄 Extraction Router: OpenAI Vision connected: ${openaiConnected}, OpenAI Files connected: ${openaiFilesConnected}, Mindee connected: ${mindeeConnected}`)
      
      // Router is considered connected if at least one service is available
      const isConnected = openaiConnected || openaiFilesConnected || mindeeConnected
      
      if (!isConnected) {
        console.error('❌ Extraction Router: No services are available')
      }
      
      return isConnected
      
    } catch (error) {
      console.error('❌ Extraction Router: Connection test failed:', error)
      return false
    }
  }

  // Get current router configuration
  getConfiguration(): {
    serviceConfig: ExtractionServiceType
    confidenceThreshold: number
    availableServices: string[]
  } {
    return {
      serviceConfig: this.serviceConfig,
      confidenceThreshold: this.confidenceThreshold,
      availableServices: ['openai-vision', 'openai-files', 'mindee']
    }
  }
}