import { supabaseAdmin } from '@/src/lib/supabase/auth-server'

export interface VendorExtractionRule {
  id: string
  vendor_id: string
  user_id: string
  rule_type: 'extraction_hint' | 'cost_center_hint' | 'validation_rule'
  instruction: string
  is_active: boolean
  created_at: string
}

export interface CreateVendorExtractionRuleData {
  vendor_id: string
  rule_type: 'extraction_hint' | 'cost_center_hint' | 'validation_rule'
  instruction: string
}

export interface UpdateVendorExtractionRuleData {
  rule_type?: 'extraction_hint' | 'cost_center_hint' | 'validation_rule'
  instruction?: string
  is_active?: boolean
}

export class VendorExtractionRulesService {

  /**
   * Get all extraction rules for a vendor
   */
  async getVendorExtractionRules(vendorId: string): Promise<VendorExtractionRule[]> {
    try {
      const { data: rules, error } = await supabaseAdmin
        .from('vendor_extraction_rules')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch vendor extraction rules: ${error.message}`)
      }

      return rules || []
    } catch (error) {
      console.error('Get vendor extraction rules error:', error)
      throw error
    }
  }

  /**
   * Get extraction rule by ID
   */
  async getExtractionRuleById(ruleId: string): Promise<VendorExtractionRule | null> {
    try {
      const { data: rule, error } = await supabaseAdmin
        .from('vendor_extraction_rules')
        .select('*')
        .eq('id', ruleId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw new Error(`Failed to fetch extraction rule: ${error.message}`)
      }

      return rule
    } catch (error) {
      console.error('Get extraction rule error:', error)
      throw error
    }
  }

  /**
   * Create a new vendor extraction rule
   */
  async createExtractionRule(ruleData: CreateVendorExtractionRuleData, userId: string): Promise<VendorExtractionRule> {
    try {
      const { data: rule, error } = await supabaseAdmin
        .from('vendor_extraction_rules')
        .insert({
          vendor_id: ruleData.vendor_id,
          user_id: userId,
          rule_type: ruleData.rule_type,
          instruction: ruleData.instruction
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create extraction rule: ${error.message}`)
      }

      return rule
    } catch (error) {
      console.error('Create extraction rule error:', error)
      throw error
    }
  }

  /**
   * Update extraction rule
   */
  async updateExtractionRule(ruleId: string, updates: UpdateVendorExtractionRuleData): Promise<VendorExtractionRule> {
    try {
      const { data: rule, error } = await supabaseAdmin
        .from('vendor_extraction_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update extraction rule: ${error.message}`)
      }

      return rule
    } catch (error) {
      console.error('Update extraction rule error:', error)
      throw error
    }
  }

  /**
   * Delete extraction rule
   */
  async deleteExtractionRule(ruleId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('vendor_extraction_rules')
        .delete()
        .eq('id', ruleId)

      if (error) {
        throw new Error(`Failed to delete extraction rule: ${error.message}`)
      }
    } catch (error) {
      console.error('Delete extraction rule error:', error)
      throw error
    }
  }

  /**
   * Find active extraction rules for a vendor (used by extraction process)
   */
  async findActiveExtractionRules(vendorId: string, userId: string): Promise<VendorExtractionRule[]> {
    try {
      const { data: rules, error } = await supabaseAdmin
        .rpc('find_vendor_extraction_rules', {
          vendor_id_param: vendorId,
          user_id_param: userId
        })

      if (error) {
        throw new Error(`Failed to find active extraction rules: ${error.message}`)
      }

      return rules || []
    } catch (error) {
      console.error('Find active extraction rules error:', error)
      throw error
    }
  }

  /**
   * Toggle rule active status
   */
  async toggleRuleActive(ruleId: string, isActive: boolean): Promise<VendorExtractionRule> {
    try {
      const { data: rule, error } = await supabaseAdmin
        .from('vendor_extraction_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to toggle rule status: ${error.message}`)
      }

      return rule
    } catch (error) {
      console.error('Toggle rule active error:', error)
      throw error
    }
  }

  /**
   * Get extraction rules with vendor information
   */
  async getExtractionRulesWithVendors(userId: string): Promise<(VendorExtractionRule & { vendor: { name: string } })[]> {
    try {
      const { data: rules, error } = await supabaseAdmin
        .from('vendor_extraction_rules')
        .select(`
          *,
          vendor:vendors(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch extraction rules with vendors: ${error.message}`)
      }

      return rules || []
    } catch (error) {
      console.error('Get extraction rules with vendors error:', error)
      throw error
    }
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('vendor_extraction_rules')
        .select('id')
        .limit(1)

      return !error
    } catch (error) {
      console.error('Vendor extraction rules service connection test failed:', error)
      return false
    }
  }
}