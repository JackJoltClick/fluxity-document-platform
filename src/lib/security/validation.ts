// Security validation utilities

/**
 * Validates UUID format to prevent enumeration attacks
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Sanitizes filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/\.+/g, '.') // Remove multiple dots
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .substring(0, 255) // Limit length
}

/**
 * Validates file type against allowed types
 */
export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType)
}

/**
 * Validates file size
 */
export function validateFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize
}

/**
 * Validates URL format for file downloads
 */
export function validateFileUrl(url: string, allowedDomains: string[]): boolean {
  try {
    const urlObj = new URL(url)
    
    // Check if domain is in allowed list
    const isAllowedDomain = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    )
    
    if (!isAllowedDomain) {
      return false
    }
    
    // Only allow HTTPS
    if (urlObj.protocol !== 'https:') {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Rate limiting key generator
 */
export function generateRateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Sanitizes error messages for production
 */
export function sanitizeErrorMessage(error: unknown, isDevelopment: boolean): string {
  if (isDevelopment) {
    return error instanceof Error ? error.message : String(error)
  }
  
  // Generic error message for production
  return 'An error occurred while processing your request'
}

/**
 * Validates content type from file buffer (basic check)
 */
export function validateContentType(buffer: Buffer, expectedType: string): boolean {
  // Basic magic number validation
  const magicNumbers: Record<string, Buffer[]> = {
    'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
    'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])], // JPEG
    'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])], // PNG
  }
  
  const signatures = magicNumbers[expectedType]
  if (!signatures) return true // Skip validation for unknown types
  
  return signatures.some(signature => 
    buffer.subarray(0, signature.length).equals(signature)
  )
}