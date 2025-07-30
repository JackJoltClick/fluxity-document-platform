import { supabaseAdmin } from '@/src/lib/supabase/auth-server'
import {
  GLAccount,
  GLAccountMatch,
  GLAccountSuggestion,
  CreateGLAccountRequest,
  UpdateGLAccountRequest,
  GLAccountSearchParams,
  GLAccountHealth,
  GLAccountAssignment
} from '@/src/types/gl-account.types'

export class GLService {
  async createGLAccount(glAccount: CreateGLAccountRequest): Promise<GLAccount> {
    try {
      const { data, error } = await supabaseAdmin
        .from('gl_accounts')
        .insert([glAccount])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create GL account: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('GLService.createGLAccount error:', error)
      throw error
    }
  }

  async updateGLAccount(id: string, updates: UpdateGLAccountRequest): Promise<GLAccount> {
    try {
      const { data, error } = await supabaseAdmin
        .from('gl_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update GL account: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('GLService.updateGLAccount error:', error)
      throw error
    }
  }

  async deleteGLAccount(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('gl_accounts')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete GL account: ${error.message}`)
      }
    } catch (error) {
      console.error('GLService.deleteGLAccount error:', error)
      throw error
    }
  }

  async getGLAccount(id: string): Promise<GLAccount | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('gl_accounts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Failed to get GL account: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('GLService.getGLAccount error:', error)
      throw error
    }
  }

  async searchGLAccounts(params: GLAccountSearchParams = {}): Promise<GLAccount[]> {
    try {
      let query = supabaseAdmin
        .from('gl_accounts')
        .select('*')

      if (params.q) {
        query = query.or(`name.ilike.%${params.q}%,code.ilike.%${params.q}%,department.ilike.%${params.q}%`)
      }

      if (params.department) {
        query = query.eq('department', params.department)
      }

      query = query.order('code', { ascending: true })

      if (params.limit) {
        query = query.limit(params.limit)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to search GL accounts: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('GLService.searchGLAccounts error:', error)
      throw error
    }
  }

  async getAllGLAccounts(): Promise<GLAccount[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('gl_accounts')
        .select('*')
        .order('code', { ascending: true })

      if (error) {
        throw new Error(`Failed to get all GL accounts: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('GLService.getAllGLAccounts error:', error)
      throw error
    }
  }

  async matchGLAccountsByDescription(description: string, limit: number = 5): Promise<GLAccountMatch[]> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('match_gl_accounts_by_description', {
          description,
          limit_results: limit
        })

      if (error) {
        throw new Error(`Failed to match GL accounts: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('GLService.matchGLAccountsByDescription error:', error)
      throw error
    }
  }

  async getGLSuggestionsForDocument(documentId: string): Promise<GLAccountSuggestion[]> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_gl_suggestions_for_line_items', {
          doc_id: documentId
        })

      if (error) {
        throw new Error(`Failed to get GL suggestions: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('GLService.getGLSuggestionsForDocument error:', error)
      throw error
    }
  }

  async assignGLAccountToLineItem(assignment: GLAccountAssignment): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('document_line_items')
        .update({ gl_account_id: assignment.gl_account_id })
        .eq('id', assignment.line_item_id)

      if (error) {
        throw new Error(`Failed to assign GL account: ${error.message}`)
      }
    } catch (error) {
      console.error('GLService.assignGLAccountToLineItem error:', error)
      throw error
    }
  }

  async removeGLAccountFromLineItem(lineItemId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('document_line_items')
        .update({ gl_account_id: null })
        .eq('id', lineItemId)

      if (error) {
        throw new Error(`Failed to remove GL account: ${error.message}`)
      }
    } catch (error) {
      console.error('GLService.removeGLAccountFromLineItem error:', error)
      throw error
    }
  }

  async getHealthStatus(): Promise<GLAccountHealth> {
    try {
      // Test database connection
      const { data: accounts, error: accountsError } = await supabaseAdmin
        .from('gl_accounts')
        .select('id')
        .limit(1)

      if (accountsError) {
        return {
          database: 'error',
          matching: 'error',
          total_accounts: 0,
          last_updated: new Date().toISOString()
        }
      }

      // Test matching function
      const { data: matchTest, error: matchError } = await supabaseAdmin
        .rpc('match_gl_accounts_by_description', {
          description: 'test',
          limit_results: 1
        })

      if (matchError) {
        return {
          database: 'connected',
          matching: 'error',
          total_accounts: 0,
          last_updated: new Date().toISOString()
        }
      }

      // Get total count
      const { count, error: countError } = await supabaseAdmin
        .from('gl_accounts')
        .select('*', { count: 'exact', head: true })

      const totalAccounts = countError ? 0 : (count || 0)

      return {
        database: 'connected',
        matching: 'active',
        total_accounts: totalAccounts,
        last_updated: new Date().toISOString()
      }
    } catch (error) {
      console.error('GLService.getHealthStatus error:', error)
      return {
        database: 'error',
        matching: 'error',
        total_accounts: 0,
        last_updated: new Date().toISOString()
      }
    }
  }
}