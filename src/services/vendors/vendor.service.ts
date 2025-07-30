import { supabaseAdmin } from '@/src/lib/supabase/auth-server'

export interface Vendor {
  id: string
  name: string
  tax_id: string | null
  created_at: string
  updated_at: string
  aliases?: VendorAlias[]
}

export interface VendorAlias {
  id: string
  vendor_id: string
  alias: string
  created_at: string
}


export interface CreateVendorData {
  name: string
  tax_id?: string
  aliases?: string[]
}

export class VendorService {

  /**
   * Get all vendors with their aliases
   */
  async getAllVendors(): Promise<Vendor[]> {
    try {
      const { data: vendors, error } = await supabaseAdmin
        .from('vendors')
        .select(`
          *,
          aliases:vendor_aliases(*)
        `)
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch vendors: ${error.message}`)
      }

      return vendors || []
    } catch (error) {
      console.error('Get vendors error:', error)
      throw error
    }
  }

  /**
   * Get vendor by ID with aliases
   */
  async getVendorById(vendorId: string): Promise<Vendor | null> {
    try {
      const { data: vendor, error } = await supabaseAdmin
        .from('vendors')
        .select(`
          *,
          aliases:vendor_aliases(*)
        `)
        .eq('id', vendorId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw new Error(`Failed to fetch vendor: ${error.message}`)
      }

      return vendor
    } catch (error) {
      console.error('Get vendor error:', error)
      throw error
    }
  }

  /**
   * Create a new vendor with optional aliases
   */
  async createVendor(vendorData: CreateVendorData): Promise<Vendor> {
    try {
      // Create the vendor
      const { data: vendor, error: vendorError } = await supabaseAdmin
        .from('vendors')
        .insert({
          name: vendorData.name,
          tax_id: vendorData.tax_id || null
        })
        .select()
        .single()

      if (vendorError) {
        throw new Error(`Failed to create vendor: ${vendorError.message}`)
      }

      // Add aliases if provided
      if (vendorData.aliases && vendorData.aliases.length > 0) {
        const aliases = vendorData.aliases.map(alias => ({
          vendor_id: vendor.id,
          alias: alias.trim()
        }))

        const { error: aliasError } = await supabaseAdmin
          .from('vendor_aliases')
          .insert(aliases)

        if (aliasError) {
          console.error('Failed to create aliases:', aliasError)
          // Don't throw here - vendor was created successfully
        }
      }

      // Return the vendor with aliases
      return await this.getVendorById(vendor.id) || vendor
    } catch (error) {
      console.error('Create vendor error:', error)
      throw error
    }
  }

  /**
   * Update vendor information
   */
  async updateVendor(vendorId: string, updates: Partial<CreateVendorData>): Promise<Vendor> {
    try {
      const { data: vendor, error } = await supabaseAdmin
        .from('vendors')
        .update({
          name: updates.name,
          tax_id: updates.tax_id || null
        })
        .eq('id', vendorId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update vendor: ${error.message}`)
      }

      return await this.getVendorById(vendor.id) || vendor
    } catch (error) {
      console.error('Update vendor error:', error)
      throw error
    }
  }

  /**
   * Delete vendor and all associated aliases
   */
  async deleteVendor(vendorId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('vendors')
        .delete()
        .eq('id', vendorId)

      if (error) {
        throw new Error(`Failed to delete vendor: ${error.message}`)
      }
    } catch (error) {
      console.error('Delete vendor error:', error)
      throw error
    }
  }

  /**
   * Add alias to existing vendor
   */
  async addAlias(vendorId: string, alias: string): Promise<VendorAlias> {
    try {
      const { data: aliasData, error } = await supabaseAdmin
        .from('vendor_aliases')
        .insert({
          vendor_id: vendorId,
          alias: alias.trim()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to add alias: ${error.message}`)
      }

      return aliasData
    } catch (error) {
      console.error('Add alias error:', error)
      throw error
    }
  }

  /**
   * Remove alias from vendor
   */
  async removeAlias(aliasId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('vendor_aliases')
        .delete()
        .eq('id', aliasId)

      if (error) {
        throw new Error(`Failed to remove alias: ${error.message}`)
      }
    } catch (error) {
      console.error('Remove alias error:', error)
      throw error
    }
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('vendors')
        .select('id')
        .limit(1)

      return !error
    } catch (error) {
      console.error('Vendor service connection test failed:', error)
      return false
    }
  }
}