import { ExtractionService } from './extraction.interface'
import { BaseExtractionService } from './base.service'
import { ExtractionResult, ExtractionError, ExtractionErrorType } from '@/src/types/extraction.types'

interface OpenAIResponse {
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

export class OpenAIExtractionService extends BaseExtractionService implements ExtractionService {
  private model = 'gpt-4o'
  private lastTokenUsage: { total: number; cost: number } = { total: 0, cost: 0 }

  constructor() {
    super({
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      timeout: 30000
    })
  }

  async extract(fileUrl: string): Promise<ExtractionResult> {
    this.validateUrl(fileUrl)

    // Fetch the file and convert to base64 for OpenAI Vision API
    const fileData = await this.prepareFileForVision(fileUrl)

    try {
      const payload = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the following information from this invoice/document and return ONLY a JSON object with these exact fields:
                
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
                type: 'image_url',
                image_url: {
                  url: fileData.dataUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1 // Low temperature for consistent extraction
      }

      
      const response = await this.makeRequest(this.config.baseUrl, {
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
      let data: OpenAIResponse
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
          'No content returned from OpenAI API'
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
          'Failed to parse OpenAI response as JSON',
          parseError
        )
      }

      // Use base class validation
      const validatedResult = this.createStandardResult(parsedData)
      this.cost = this.lastTokenUsage.cost
      
      return validatedResult

    } catch (error) {
      console.error('❌ OpenAI Extraction: Error during extraction:', error)
      
      if (error instanceof ExtractionError) {
        throw error
      }

      throw new ExtractionError(
        ExtractionErrorType.NETWORK_ERROR,
        'Network error during OpenAI API request',
        error
      )
    }
  }


  private async prepareFileForVision(fileUrl: string): Promise<{ dataUrl: string; mimeType: string }> {
    try {
      // Fetch the file with size limit check
      const response = await this.makeRequest(fileUrl, { method: 'GET' })
      
      if (!response.ok) {
        throw new ExtractionError(
          ExtractionErrorType.INVALID_RESPONSE,
          `File URL is not accessible (${response.status})`
        )
      }

      // Check file size from Content-Length header
      const contentLength = response.headers.get('content-length')
      const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB limit
      
      if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
        throw new ExtractionError(
          ExtractionErrorType.FILE_TOO_LARGE,
          `File too large: ${(parseInt(contentLength) / 1024 / 1024).toFixed(2)}MB (max: 50MB)`
        )
      }

      // Get the content type
      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      
      // Convert to buffer with memory-efficient processing
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Final size check after download
      if (buffer.length > MAX_FILE_SIZE) {
        throw new ExtractionError(
          ExtractionErrorType.FILE_TOO_LARGE,
          `File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (max: 50MB)`
        )
      }

      // Validate file content and type
      const fileValidation = this.validateFileContent(buffer, contentType, fileUrl)
      if (!fileValidation.isValid) {
        throw new ExtractionError(
          ExtractionErrorType.UNSUPPORTED_FORMAT,
          fileValidation.error || 'File validation failed'
        )
      }

      // Memory-efficient base64 conversion for large files
      let base64: string
      try {
        if (buffer.length > 10 * 1024 * 1024) { // 10MB+
          // For large files, use streaming conversion to reduce memory pressure
          base64 = this.convertToBase64Chunked(buffer)
        } else {
          base64 = buffer.toString('base64')
        }
      } catch (memoryError) {
        throw new ExtractionError(
          ExtractionErrorType.NETWORK_ERROR,
          'Memory error during file processing - file may be too large',
          memoryError
        )
      }
      
      // Create data URL with validated MIME type
      const dataUrl = `data:${fileValidation.mimeType};base64,${base64}`
      
      console.log(`📄 OpenAI: Prepared ${fileValidation.fileType} for Vision API: ${(buffer.length / 1024).toFixed(2)}KB`)
      
      // Clear buffer from memory explicitly for large files
      if (buffer.length > 10 * 1024 * 1024) {
        buffer.fill(0) // Clear sensitive data
      }
      
      return { dataUrl, mimeType: fileValidation.mimeType }
    } catch (error) {
      if (error instanceof ExtractionError) {
        throw error
      }
      
      throw new ExtractionError(
        ExtractionErrorType.NETWORK_ERROR,
        'Failed to prepare file for Vision API',
        error
      )
    }
  }

  private convertToBase64Chunked(buffer: Buffer): string {
    // Process buffer in 1MB chunks to reduce memory pressure
    const CHUNK_SIZE = 1024 * 1024 // 1MB chunks
    const chunks: string[] = []
    
    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      const chunk = buffer.subarray(i, Math.min(i + CHUNK_SIZE, buffer.length))
      chunks.push(chunk.toString('base64'))
    }
    
    return chunks.join('')
  }

  private validateFileContent(buffer: Buffer, contentType: string, fileUrl: string): {
    isValid: boolean;
    error?: string;
    mimeType: string;
    fileType: 'PDF' | 'image';
  } {
    // Check for malicious patterns first
    const maliciousPatterns = [
      // JavaScript execution patterns
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      // Executable file signatures
      /^MZ/, // Windows PE
      /^\x7FELF/, // Linux ELF
      /^\xCA\xFE\xBA\xBE/, // Java class file
      // Suspicious strings
      /eval\s*\(/i,
      /document\.write/i,
    ];

    const bufferString = buffer.toString('ascii', 0, Math.min(1024, buffer.length));
    for (const pattern of maliciousPatterns) {
      if (pattern.test(bufferString)) {
        return {
          isValid: false,
          error: 'File contains potentially malicious content',
          mimeType: contentType,
          fileType: 'image'
        };
      }
    }

    // Validate PDF files
    if (contentType.includes('pdf') || fileUrl.toLowerCase().endsWith('.pdf')) {
      // Check PDF magic number
      if (!buffer.subarray(0, 4).toString('ascii').startsWith('%PDF')) {
        return {
          isValid: false,
          error: 'Invalid PDF file: missing PDF header',
          mimeType: contentType,
          fileType: 'PDF'
        };
      }

      // Check for PDF trailer
      const bufferEnd = buffer.subarray(Math.max(0, buffer.length - 1024)).toString('ascii');
      if (!bufferEnd.includes('%%EOF')) {
        return {
          isValid: false,
          error: 'Invalid PDF file: missing EOF marker',
          mimeType: contentType,
          fileType: 'PDF'
        };
      }

      return {
        isValid: true,
        mimeType: 'application/pdf',
        fileType: 'PDF'
      };
    }

    // Validate image files
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    const isImageByUrl = imageExtensions.some(ext => fileUrl.toLowerCase().endsWith(`.${ext}`));
    const isImageByContentType = contentType.includes('image/');

    if (isImageByUrl || isImageByContentType) {
      // Check common image magic numbers
      const magicNumbers = {
        png: [0x89, 0x50, 0x4E, 0x47],
        jpg: [0xFF, 0xD8, 0xFF],
        gif: [0x47, 0x49, 0x46],
        webp: [0x52, 0x49, 0x46, 0x46] // RIFF header for WebP
      };

      let validImageType: string | null = null;
      
      // Check PNG
      if (buffer.length >= 4 && buffer.subarray(0, 4).every((byte, i) => byte === magicNumbers.png[i])) {
        validImageType = 'image/png';
      }
      // Check JPEG
      else if (buffer.length >= 3 && buffer.subarray(0, 3).every((byte, i) => byte === magicNumbers.jpg[i])) {
        validImageType = 'image/jpeg';
      }
      // Check GIF
      else if (buffer.length >= 3 && buffer.subarray(0, 3).every((byte, i) => byte === magicNumbers.gif[i])) {
        validImageType = 'image/gif';
      }
      // Check WebP (RIFF header + WEBP signature)
      else if (buffer.length >= 12 && 
               buffer.subarray(0, 4).every((byte, i) => byte === magicNumbers.webp[i]) &&
               buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
        validImageType = 'image/webp';
      }

      if (!validImageType) {
        return {
          isValid: false,
          error: 'Invalid image file: unrecognized or corrupted image format',
          mimeType: contentType,
          fileType: 'image'
        };
      }

      return {
        isValid: true,
        mimeType: validImageType,
        fileType: 'image'
      };
    }

    return {
      isValid: false,
      error: `Unsupported file type: ${contentType}`,
      mimeType: contentType,
      fileType: 'image'
    };
  }

  private calculateAndLogCosts(usage: OpenAIResponse['usage']) {
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

  }


  getName(): string {
    return 'OpenAI GPT-4o'
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        }
      })

      return response.ok
    } catch (error) {
      console.error('❌ OpenAI Connection Test Failed:', error)
      return false
    }
  }
}