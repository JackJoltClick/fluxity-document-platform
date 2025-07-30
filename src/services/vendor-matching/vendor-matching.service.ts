import { supabaseAdmin } from '@/src/lib/supabase/auth-server'
import { 
  DocumentVendor, 
  VendorMatch, 
  PotentialVendorMatch, 
  VendorMatchingRequest,
  VendorMatchingHealth 
} from '@/src/types/vendor-matching'

export class VendorMatchingService {
  
  async findPotentialMatches(supplierName: string, limit: number = 5): Promise<PotentialVendorMatch[]> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('find_potential_vendor_matches', {
          supplier_name: supplierName,
          result_limit: limit
        })

      if (error) {
        throw new Error(`Failed to find potential matches: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('VendorMatchingService.findPotentialMatches error:', error)
      throw error
    }
  }

  async getDocumentVendorMatches(documentId: string): Promise<VendorMatch[]> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_vendor_matches_for_document', {
          doc_id: documentId
        })

      if (error) {
        console.error('Error getting document vendor matches:', error)
        throw new Error(`Failed to get document vendor matches: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('VendorMatchingService.getDocumentVendorMatches error:', error)
      throw error
    }
  }

  async createVendorMatch(request: VendorMatchingRequest): Promise<DocumentVendor> {
    try {
      // Check if match already exists
      const { data: existingMatch } = await supabaseAdmin
        .from('document_vendors')
        .select('*')
        .eq('document_id', request.document_id)
        .eq('vendor_id', request.vendor_id)
        .single()

      if (existingMatch) {
        // Update existing match
        const { data, error } = await supabaseAdmin
          .from('document_vendors')
          .update({
            confidence: request.confidence,
            is_confirmed: request.is_confirmed || false,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMatch.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating vendor match:', error)
          throw new Error(`Failed to update vendor match: ${error.message}`)
        }

        return data
      } else {
        // Create new match
        const { data, error } = await supabaseAdmin
          .from('document_vendors')
          .insert({
            document_id: request.document_id,
            vendor_id: request.vendor_id,
            confidence: request.confidence,
            is_confirmed: request.is_confirmed || false
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating vendor match:', error)
          throw new Error(`Failed to create vendor match: ${error.message}`)
        }

        return data
      }
    } catch (error) {
      console.error('VendorMatchingService.createVendorMatch error:', error)
      throw error
    }
  }

  async confirmVendorMatch(documentId: string, vendorId: string): Promise<DocumentVendor> {
    try {
      // First, unconfirm all other vendor matches for this document
      const { error: unconfirmError } = await supabaseAdmin
        .from('document_vendors')
        .update({
          is_confirmed: false,
          updated_at: new Date().toISOString()
        })
        .eq('document_id', documentId)
        .neq('vendor_id', vendorId)

      if (unconfirmError) {
        console.error('Error unconfirming other vendor matches:', unconfirmError)
        throw new Error(`Failed to unconfirm other vendor matches: ${unconfirmError.message}`)
      }

      // Then confirm the selected vendor match
      const { data, error } = await supabaseAdmin
        .from('document_vendors')
        .update({
          is_confirmed: true,
          updated_at: new Date().toISOString()
        })
        .eq('document_id', documentId)
        .eq('vendor_id', vendorId)
        .select()
        .single()

      if (error) {
        console.error('Error confirming vendor match:', error)
        throw new Error(`Failed to confirm vendor match: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('VendorMatchingService.confirmVendorMatch error:', error)
      throw error
    }
  }

  async deleteVendorMatch(documentId: string, vendorId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('document_vendors')
        .delete()
        .eq('document_id', documentId)
        .eq('vendor_id', vendorId)

      if (error) {
        console.error('Error deleting vendor match:', error)
        throw new Error(`Failed to delete vendor match: ${error.message}`)
      }
    } catch (error) {
      console.error('VendorMatchingService.deleteVendorMatch error:', error)
      throw error
    }
  }

  async getHealthStatus(): Promise<VendorMatchingHealth> {
    try {
      // Test database connection
      const { data: testData, error: testError } = await supabaseAdmin
        .from('document_vendors')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('Vendor matching health check failed:', testError)
        return {
          vendors: 'error',
          similarity: 'error',
          database: 'disconnected'
        }
      }

      // Test similarity function
      const { data: similarityData, error: similarityError } = await supabaseAdmin
        .rpc('find_potential_vendor_matches', {
          supplier_name: 'test',
          result_limit: 1
        })

      if (similarityError) {
        console.error('Similarity function health check failed:', similarityError)
        return {
          vendors: 'active',
          similarity: 'error',
          database: 'connected'
        }
      }

      return {
        vendors: 'active',
        similarity: 'enabled',
        database: 'connected'
      }
    } catch (error) {
      console.error('VendorMatchingService.getHealthStatus error:', error)
      return {
        vendors: 'error',
        similarity: 'error',
        database: 'error'
      }
    }
  }

  async searchVendors(query: string, limit: number = 10): Promise<PotentialVendorMatch[]> {
    try {
      if (!query.trim()) {
        return []
      }

      const results = await this.findPotentialMatches(query, limit)
      return results
    } catch (error) {
      console.error('VendorMatchingService.searchVendors error:', error)
      throw error
    }
  }
}