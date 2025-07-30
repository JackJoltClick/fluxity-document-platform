import { supabaseAdmin } from '@/src/lib/supabase/auth-server'

export interface SecurityViolation {
  userId: string
  violation: string
  content: string
  timestamp: string
  ipAddress?: string
}

export class PromptSanitizerService {
  // Dangerous patterns that could be prompt injection attempts
  private readonly DANGEROUS_PATTERNS = [
    /ignore\s+(previous|all|above)\s+(instructions?|prompts?|rules?)/i,
    /forget\s+(everything|all|previous)/i,
    /disregard\s+(previous|all|above)/i,
    /new\s+instructions?\s*:/i,
    /system\s*:\s*/i,
    /admin\s*:\s*/i,
    /execute\s+(code|command|script)/i,
    /eval\s*\(/i,
    /import\s+\{/i,
    /require\s*\(/i,
    /\$\{.*\}/,  // Template literals
    /`.*`/,      // Backticks
    /<script/i,
    /javascript:/i,
    /onclick=/i,
    /onerror=/i,
  ]

  // Patterns for sensitive data extraction attempts
  private readonly SENSITIVE_DATA_PATTERNS = [
    /\b(ssn|social\s*security)\b/i,
    /\b(credit\s*card|cc\s*number)\b/i,
    /\b(bank\s*account|routing\s*number)\b/i,
    /\b(password|pwd|passwd)\b/i,
    /\b(api\s*key|secret\s*key|private\s*key)\b/i,
    /\b(access\s*token|bearer\s*token)\b/i,
    /\b\d{3}-?\d{2}-?\d{4}\b/,  // SSN pattern
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/,  // Credit card pattern
  ]

  // Maximum lengths
  private readonly MAX_INSTRUCTION_LENGTH = parseInt(process.env.MAX_RULE_LENGTH || '200')
  private readonly MAX_GL_CODE_LENGTH = 6
  private readonly MAX_COST_CENTER_LENGTH = 20

  // Valid patterns for accounting codes
  private readonly GL_ACCOUNT_PATTERN = /^\d{4,6}$/
  private readonly COST_CENTER_PATTERN = /^[A-Z0-9\-_]{1,20}$/i

  /**
   * Sanitize instruction text for safe inclusion in LLM prompts
   */
  sanitizeForLLMPrompt(instruction: string): string {
    if (!instruction || typeof instruction !== 'string') {
      return ''
    }

    // Trim and limit length
    let sanitized = instruction.trim().slice(0, this.MAX_INSTRUCTION_LENGTH)

    // Remove any null bytes or control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    // Replace multiple spaces with single space
    sanitized = sanitized.replace(/\s+/g, ' ')

    // Remove dangerous characters that could break prompt structure
    sanitized = sanitized
      .replace(/[<>]/g, '')  // Remove angle brackets
      .replace(/[\{\}]/g, '') // Remove curly braces
      .replace(/\\/g, '')     // Remove backslashes
      .replace(/\n/g, ' ')    // Replace newlines with spaces

    // Check for dangerous patterns and reject if found
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(sanitized)) {
        console.warn(`🚨 Security: Dangerous pattern detected in instruction: ${pattern}`)
        return '[INSTRUCTION REMOVED FOR SECURITY]'
      }
    }

    // Check for sensitive data patterns
    for (const pattern of this.SENSITIVE_DATA_PATTERNS) {
      if (pattern.test(sanitized)) {
        console.warn(`🚨 Security: Sensitive data pattern detected in instruction: ${pattern}`)
        return '[INSTRUCTION REMOVED - SENSITIVE DATA]'
      }
    }

    return sanitized
  }

  /**
   * Validate rule content before saving to database
   */
  validateRuleContent(instruction: string, ruleType: string): { valid: boolean; error?: string } {
    if (!instruction || typeof instruction !== 'string') {
      return { valid: false, error: 'Instruction must be a non-empty string' }
    }

    // Check length
    if (instruction.length > this.MAX_INSTRUCTION_LENGTH) {
      return { valid: false, error: `Instruction exceeds maximum length of ${this.MAX_INSTRUCTION_LENGTH} characters` }
    }

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(instruction)) {
        return { valid: false, error: 'Instruction contains potentially dangerous content' }
      }
    }

    // Check for sensitive data patterns
    for (const pattern of this.SENSITIVE_DATA_PATTERNS) {
      if (pattern.test(instruction)) {
        return { valid: false, error: 'Instruction appears to reference sensitive data' }
      }
    }

    // Additional validation based on rule type
    if (ruleType === 'cost_center_hint') {
      // Check if instruction mentions cost centers in expected format
      const ccMatch = instruction.match(/Cost\s*Center\s*([A-Z0-9\-_]+)/i)
      if (ccMatch && !this.COST_CENTER_PATTERN.test(ccMatch[1])) {
        return { valid: false, error: 'Cost center must be alphanumeric with hyphens/underscores only' }
      }
    }

    return { valid: true }
  }

  /**
   * Validate extracted values before applying to documents
   */
  validateExtractedValue(value: string, type: 'gl_account' | 'cost_center'): { valid: boolean; sanitized?: string } {
    if (!value || typeof value !== 'string') {
      return { valid: false }
    }

    const trimmed = value.trim()

    if (type === 'gl_account') {
      // Remove any non-numeric characters
      const numeric = trimmed.replace(/\D/g, '')
      
      if (!this.GL_ACCOUNT_PATTERN.test(numeric)) {
        return { valid: false }
      }

      // Check for reasonable GL account ranges (e.g., 1000-9999 or 100000-999999)
      const numericValue = parseInt(numeric)
      if (numericValue < 1000 || numericValue > 999999) {
        return { valid: false }
      }

      return { valid: true, sanitized: numeric }
    }

    if (type === 'cost_center') {
      // Convert to uppercase and remove invalid characters
      const sanitized = trimmed.toUpperCase().replace(/[^A-Z0-9\-_]/g, '')
      
      if (!this.COST_CENTER_PATTERN.test(sanitized) || sanitized.length > this.MAX_COST_CENTER_LENGTH) {
        return { valid: false }
      }

      // Prevent SQL injection patterns
      if (sanitized.includes('--') || sanitized.includes('/*') || sanitized.includes('*/')) {
        return { valid: false }
      }

      return { valid: true, sanitized }
    }

    return { valid: false }
  }

  /**
   * Log security violations for monitoring
   */
  async logSecurityViolation(
    userId: string, 
    violation: string, 
    content: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('security_violations')
        .insert({
          user_id: userId,
          violation_type: violation,
          content: content.slice(0, 500), // Limit logged content
          ip_address: ipAddress,
          timestamp: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to log security violation:', error)
      }

      // Also log to console for immediate visibility
      console.error(`🚨 SECURITY VIOLATION: User ${userId} - ${violation}`, {
        content: content.slice(0, 200),
        timestamp: new Date().toISOString(),
        ipAddress
      })

      // TODO: Add alerting for repeated violations
    } catch (error) {
      console.error('Error logging security violation:', error)
    }
  }

  /**
   * Check if user should be rate limited based on recent violations
   */
  async shouldBlockUser(userId: string): Promise<boolean> {
    try {
      // Count recent violations (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      const { count, error } = await supabaseAdmin
        .from('security_violations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('timestamp', oneHourAgo)

      if (error) {
        console.error('Error checking user violations:', error)
        return false
      }

      // Block if more than 5 violations in the last hour
      return (count || 0) > 5
    } catch (error) {
      console.error('Error in shouldBlockUser:', error)
      return false
    }
  }

  /**
   * Sanitize all vendor rules before passing to LLM
   */
  sanitizeVendorRules(rules: any[]): any[] {
    return rules.map(rule => ({
      ...rule,
      instruction: this.sanitizeForLLMPrompt(rule.instruction)
    })).filter(rule => rule.instruction !== '[INSTRUCTION REMOVED FOR SECURITY]')
  }
}