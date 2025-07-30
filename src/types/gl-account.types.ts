export interface GLAccount {
  id: string
  code: string
  name: string
  department?: string
  keywords: string[]
  created_at: string
  updated_at: string
}

export interface GLAccountMatch {
  gl_account_id: string
  code: string
  name: string
  department?: string
  keywords: string[]
  match_score: number
}

export interface GLAccountSuggestion {
  line_item_id: string
  description: string
  gl_suggestions: GLAccountMatch[]
}

export interface CreateGLAccountRequest {
  code: string
  name: string
  department?: string
  keywords: string[]
}

export interface UpdateGLAccountRequest {
  code?: string
  name?: string
  department?: string
  keywords?: string[]
}

export interface GLAccountSearchParams {
  q?: string
  department?: string
  limit?: number
}

export interface GLAccountHealth {
  database: 'connected' | 'disconnected' | 'error'
  matching: 'active' | 'inactive' | 'error'
  total_accounts: number
  last_updated: string
}

export interface DocumentLineItemWithGL {
  id: string
  document_id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  gl_account_id?: string
  gl_account?: GLAccount
  suggested_gl_accounts?: GLAccountMatch[]
}

export interface GLAccountAssignment {
  line_item_id: string
  gl_account_id: string
  confidence_score?: number
  is_manual: boolean
}