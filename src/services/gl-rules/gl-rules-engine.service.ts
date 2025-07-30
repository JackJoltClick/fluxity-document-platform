import { supabaseAdmin } from '@/src/lib/supabase/auth-server'
import { 
  CompanyGLRule, 
  GLRuleConditions, 
  GLRuleMatch, 
  GLRuleEvaluationResult,
  GLRuleApplication,
  GL_RULE_SCORING,
  GL_RULE_THRESHOLDS,
  GLRuleTestResult
} from '@/src/types/gl-rules.types'

export interface LineItemData {
  description: string
  amount: number
  vendor_name?: string
  date?: string
  category?: string
  document_id?: string
  index?: number
}

export class GLRulesEngineService {
  
  /**
   * Get all active GL rules for a user, ordered by priority
   */
  async getActiveRulesForUser(userId: string): Promise<CompanyGLRule[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('company_gl_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch GL rules: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error fetching GL rules:', error)
      throw error
    }
  }

  /**
   * Evaluate a single rule against line item data
   */
  evaluateRule(rule: CompanyGLRule, lineItem: LineItemData): GLRuleMatch | null {
    let score = 0
    const matchedConditions: string[] = []
    const conditions = rule.conditions

    // Check exclusion keywords first - these disqualify entirely
    if (conditions.exclude_keywords?.length) {
      const description = lineItem.description.toLowerCase()
      for (const keyword of conditions.exclude_keywords) {
        if (description.includes(keyword.toLowerCase())) {
          return null // Rule disqualified
        }
      }
    }

    // Vendor pattern matching (30 points)
    if (conditions.vendor_patterns?.length && lineItem.vendor_name) {
      const vendorName = lineItem.vendor_name.toLowerCase()
      for (const pattern of conditions.vendor_patterns) {
        try {
          const regex = new RegExp(pattern.toLowerCase(), 'i')
          if (regex.test(vendorName) || vendorName.includes(pattern.toLowerCase())) {
            score += GL_RULE_SCORING.VENDOR_PATTERNS
            matchedConditions.push('vendor_patterns')
            break
          }
        } catch (e) {
          // If regex fails, try exact match
          if (vendorName.includes(pattern.toLowerCase())) {
            score += GL_RULE_SCORING.VENDOR_PATTERNS
            matchedConditions.push('vendor_patterns')
            break
          }
        }
      }
    }

    // Amount range matching (20 points)
    if (conditions.amount_range) {
      const { min, max } = conditions.amount_range
      const amount = Math.abs(lineItem.amount)
      
      let amountMatches = true
      if (min !== undefined && amount < min) amountMatches = false
      if (max !== undefined && amount > max) amountMatches = false
      
      if (amountMatches) {
        score += GL_RULE_SCORING.AMOUNT_RANGE
        matchedConditions.push('amount_range')
      }
    }

    // Exact description matching (35 points) - check before keywords
    if (conditions.exact_descriptions?.length) {
      const description = lineItem.description.toLowerCase()
      for (const exactDesc of conditions.exact_descriptions) {
        if (description === exactDesc.toLowerCase()) {
          score += GL_RULE_SCORING.EXACT_DESCRIPTIONS
          matchedConditions.push('exact_descriptions')
          break
        }
      }
    }

    // Keyword matching (25 points) - only if no exact match
    if (conditions.keywords?.length && !matchedConditions.includes('exact_descriptions')) {
      const description = lineItem.description.toLowerCase()
      let keywordMatches = 0
      
      for (const keyword of conditions.keywords) {
        if (description.includes(keyword.toLowerCase())) {
          keywordMatches++
        }
      }
      
      // Partial scoring for keywords (full points if all keywords match)
      if (keywordMatches > 0) {
        const keywordScore = (keywordMatches / conditions.keywords.length) * GL_RULE_SCORING.KEYWORDS
        score += keywordScore
        matchedConditions.push('keywords')
      }
    }

    // Date range matching (10 points)
    if (conditions.date_range && lineItem.date) {
      const itemDate = new Date(lineItem.date)
      const { start, end } = conditions.date_range
      
      let dateMatches = true
      if (start && itemDate < new Date(start)) dateMatches = false
      if (end && itemDate > new Date(end)) dateMatches = false
      
      if (dateMatches) {
        score += GL_RULE_SCORING.DATE_CONDITIONS
        matchedConditions.push('date_range')
      }
    }

    // Category matching (bonus points)
    if (conditions.line_item_category?.length && lineItem.category) {
      if (conditions.line_item_category.includes(lineItem.category)) {
        score += 5 // Bonus points for category match
        matchedConditions.push('line_item_category')
      }
    }

    // Only return match if some conditions were met
    if (matchedConditions.length === 0) {
      return null
    }

    // Calculate confidence based on score and number of conditions met
    const maxPossibleScore = this.calculateMaxScore(conditions)
    const confidence = Math.min(score / maxPossibleScore, 1.0)

    return {
      rule,
      score,
      matched_conditions: matchedConditions,
      confidence,
      should_auto_apply: rule.actions.auto_assign === true && confidence >= GL_RULE_THRESHOLDS.AUTO_APPLY_MIN_CONFIDENCE,
      requires_approval: rule.actions.requires_approval === true
    }
  }

  /**
   * Calculate maximum possible score for given conditions
   */
  private calculateMaxScore(conditions: GLRuleConditions): number {
    let maxScore = 0
    
    if (conditions.vendor_patterns?.length) maxScore += GL_RULE_SCORING.VENDOR_PATTERNS
    if (conditions.amount_range) maxScore += GL_RULE_SCORING.AMOUNT_RANGE
    if (conditions.exact_descriptions?.length) {
      maxScore += GL_RULE_SCORING.EXACT_DESCRIPTIONS
    } else if (conditions.keywords?.length) {
      maxScore += GL_RULE_SCORING.KEYWORDS
    }
    if (conditions.date_range) maxScore += GL_RULE_SCORING.DATE_CONDITIONS
    if (conditions.line_item_category?.length) maxScore += 5 // Bonus points
    
    return Math.max(maxScore, GL_RULE_SCORING.MAX_SCORE)
  }

  /**
   * Evaluate all rules for a line item and return best matches
   */
  async evaluateLineItem(
    userId: string, 
    lineItem: LineItemData, 
    aiSuggestion?: { gl_code: string; confidence: number }
  ): Promise<GLRuleEvaluationResult> {
    try {
      const rules = await this.getActiveRulesForUser(userId)
      const matches: GLRuleMatch[] = []

      // Evaluate each rule
      for (const rule of rules) {
        const match = this.evaluateRule(rule, lineItem)
        if (match && match.confidence >= GL_RULE_THRESHOLDS.SUGGEST_MIN_CONFIDENCE) {
          matches.push(match)
        }
      }

      // Sort matches by priority first, then confidence
      matches.sort((a, b) => {
        if (a.rule.priority !== b.rule.priority) {
          return b.rule.priority - a.rule.priority
        }
        return b.confidence - a.confidence
      })

      const bestMatch = matches[0]

      // Determine final suggestion
      let final_suggestion: GLRuleEvaluationResult['final_suggestion']

      if (bestMatch && (bestMatch.rule.actions.override_ai || !aiSuggestion)) {
        final_suggestion = {
          gl_code: bestMatch.rule.actions.gl_code,
          source: 'rule',
          confidence: bestMatch.confidence,
          auto_applied: bestMatch.should_auto_apply
        }
      } else if (aiSuggestion) {
        final_suggestion = {
          gl_code: aiSuggestion.gl_code,
          source: 'ai',
          confidence: aiSuggestion.confidence,
          auto_applied: false
        }
      } else {
        final_suggestion = {
          gl_code: '',
          source: 'manual',
          confidence: 0,
          auto_applied: false
        }
      }

      return {
        matches,
        best_match: bestMatch,
        ai_suggestion: aiSuggestion,
        final_suggestion
      }
    } catch (error) {
      console.error('Error evaluating line item:', error)
      throw error
    }
  }

  /**
   * Apply a rule to a line item and record the application
   */
  async applyRuleToLineItem(
    documentId: string,
    lineItemIndex: number,
    ruleMatch: GLRuleMatch
  ): Promise<GLRuleApplication> {
    try {
      const application: Omit<GLRuleApplication, 'id'> = {
        document_id: documentId,
        rule_id: ruleMatch.rule.id,
        line_item_index: lineItemIndex,
        applied_gl_code: ruleMatch.rule.actions.gl_code,
        confidence_score: ruleMatch.confidence,
        was_overridden: false,
        applied_at: new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin
        .from('gl_rule_applications')
        .insert(application)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to record rule application: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error applying rule:', error)
      throw error
    }
  }

  /**
   * Mark a rule application as overridden
   */
  async markRuleAsOverridden(applicationId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('gl_rule_applications')
        .update({ was_overridden: true })
        .eq('id', applicationId)

      if (error) {
        throw new Error(`Failed to mark rule as overridden: ${error.message}`)
      }
    } catch (error) {
      console.error('Error marking rule as overridden:', error)
      throw error
    }
  }

  /**
   * Test a rule against sample data
   */
  testRule(conditions: GLRuleConditions, testData: LineItemData): GLRuleTestResult {
    const mockRule: CompanyGLRule = {
      id: 'test',
      user_id: 'test',
      rule_name: 'Test Rule',
      priority: 0,
      is_active: true,
      conditions,
      actions: { gl_code: 'TEST-001' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const match = this.evaluateRule(mockRule, testData)

    if (!match) {
      return {
        matched: false,
        score: 0,
        matched_conditions: [],
        explanation: 'Rule did not match the test data'
      }
    }

    const explanation = this.generateMatchExplanation(match, testData)

    return {
      matched: true,
      score: match.score,
      matched_conditions: match.matched_conditions,
      explanation
    }
  }

  /**
   * Generate human-readable explanation of rule match
   */
  private generateMatchExplanation(match: GLRuleMatch, testData: LineItemData): string {
    const explanations: string[] = []

    if (match.matched_conditions.includes('vendor_patterns')) {
      explanations.push(`Vendor "${testData.vendor_name}" matches pattern`)
    }
    if (match.matched_conditions.includes('amount_range')) {
      explanations.push(`Amount $${testData.amount} falls within range`)
    }
    if (match.matched_conditions.includes('exact_descriptions')) {
      explanations.push(`Description matches exactly`)
    }
    if (match.matched_conditions.includes('keywords')) {
      explanations.push(`Description contains required keywords`)
    }
    if (match.matched_conditions.includes('date_range')) {
      explanations.push(`Date falls within specified range`)
    }

    return `Rule matched with ${match.score}% confidence: ${explanations.join(', ')}`
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('company_gl_rules')
        .select('id')
        .limit(1)

      return !error
    } catch (error) {
      console.error('GL Rules engine connection test failed:', error)
      return false
    }
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{ engine: string; database: string }> {
    try {
      const isConnected = await this.testConnection()
      return {
        engine: 'active',
        database: isConnected ? 'connected' : 'disconnected'
      }
    } catch (error) {
      return {
        engine: 'error',
        database: 'error'
      }
    }
  }
}