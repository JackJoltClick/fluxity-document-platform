export interface GLRuleConditions {
  // Vendor-based conditions (30 points)
  vendor_patterns?: string[] // Array of regex patterns or exact matches
  
  // Amount-based conditions (20 points)  
  amount_range?: {
    min?: number
    max?: number
  }
  
  // Description-based conditions (25 points for keywords, 35 for exact)
  keywords?: string[] // Keywords that must be present
  exact_descriptions?: string[] // Exact description matches
  exclude_keywords?: string[] // Keywords that disqualify the rule
  
  // Date-based conditions (10 points)
  date_range?: {
    start?: string // ISO date string
    end?: string // ISO date string
  }
  
  // Additional conditions
  line_item_category?: string[]
  document_type?: string[]
}

export interface GLRuleActions {
  gl_code: string // The GL code to assign
  auto_assign?: boolean // Whether to auto-apply without user approval
  requires_approval?: boolean // Whether to flag for manual approval
  confidence_threshold?: number // Minimum confidence to apply (0.0 - 1.0)
  override_ai?: boolean // Whether this rule overrides AI suggestions
}

export interface CompanyGLRule {
  id: string
  user_id: string
  rule_name: string
  priority: number
  is_active: boolean
  conditions: GLRuleConditions
  actions: GLRuleActions
  created_at: string
  updated_at: string
}

export interface GLRuleApplication {
  id: string
  document_id: string
  rule_id: string
  line_item_index: number
  applied_gl_code: string
  confidence_score: number
  was_overridden: boolean
  applied_at: string
  rule?: CompanyGLRule // Populated when needed
}

export interface GLRuleMatch {
  rule: CompanyGLRule
  score: number
  matched_conditions: string[]
  confidence: number
  should_auto_apply: boolean
  requires_approval: boolean
}

export interface GLRuleEvaluationResult {
  matches: GLRuleMatch[]
  best_match?: GLRuleMatch
  ai_suggestion?: {
    gl_code: string
    confidence: number
  }
  final_suggestion: {
    gl_code: string
    source: 'rule' | 'ai' | 'manual'
    confidence: number
    auto_applied: boolean
  }
}

export interface CreateGLRuleRequest {
  rule_name: string
  priority: number
  is_active?: boolean
  conditions: GLRuleConditions
  actions: GLRuleActions
}

export interface UpdateGLRuleRequest extends Partial<CreateGLRuleRequest> {
  id: string
}

export interface GLRuleTestRequest {
  conditions: GLRuleConditions
  test_data: {
    vendor_name?: string
    amount?: number
    description?: string
    date?: string
    line_item_category?: string
  }
}

export interface GLRuleTestResult {
  matched: boolean
  score: number
  matched_conditions: string[]
  explanation: string
}

export interface GLRuleStats {
  total_applications: number
  successful_applications: number
  override_rate: number
  last_applied_at?: string
}

// Scoring weights for rule evaluation
export const GL_RULE_SCORING = {
  VENDOR_PATTERNS: 30,
  AMOUNT_RANGE: 20,
  KEYWORDS: 25,
  EXACT_DESCRIPTIONS: 35,
  DATE_CONDITIONS: 10,
  MAX_SCORE: 100
} as const

// Rule evaluation thresholds
export const GL_RULE_THRESHOLDS = {
  AUTO_APPLY_MIN_CONFIDENCE: 0.8,
  SUGGEST_MIN_CONFIDENCE: 0.5,
  HIGH_CONFIDENCE: 0.9
} as const