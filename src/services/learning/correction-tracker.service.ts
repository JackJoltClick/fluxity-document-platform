import { supabaseAdmin } from '@/src/lib/supabase/admin'

export interface CorrectionData {
  documentId: string
  fieldType: 'vendor_match' | 'gl_assignment' | 'extraction_field'
  originalValue: string
  correctedValue: string
  userId: string
  metadata?: Record<string, any>
}

export interface CorrectionRecord {
  id: string
  document_id: string
  field_type: string
  original_value: string
  corrected_value: string
  user_id: string
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export class CorrectionTrackerService {
  
  /**
   * Log a correction made by a user
   */
  async logCorrection(correction: CorrectionData): Promise<CorrectionRecord> {
    try {
      console.log('📚 Learning: Logging correction', {
        documentId: correction.documentId,
        fieldType: correction.fieldType,
        originalValue: correction.originalValue,
        correctedValue: correction.correctedValue
      })

      const { data, error } = await supabaseAdmin
        .from('corrections')
        .insert({
          document_id: correction.documentId,
          field_type: correction.fieldType,
          original_value: correction.originalValue,
          corrected_value: correction.correctedValue,
          user_id: correction.userId,
          metadata: correction.metadata || {}
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Learning: Failed to log correction:', error)
        throw new Error(`Failed to log correction: ${error.message}`)
      }

      console.log('✅ Learning: Correction logged successfully', { id: data.id })
      return data
    } catch (error) {
      console.error('❌ Learning: Error logging correction:', error)
      throw error
    }
  }

  /**
   * Get corrections for learning and improvement
   */
  async getCorrections(filters?: {
    fieldType?: string
    userId?: string
    documentId?: string
    limit?: number
  }): Promise<CorrectionRecord[]> {
    try {
      let query = supabaseAdmin
        .from('corrections')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.fieldType) {
        query = query.eq('field_type', filters.fieldType)
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters?.documentId) {
        query = query.eq('document_id', filters.documentId)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Learning: Failed to get corrections:', error)
        throw new Error(`Failed to get corrections: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('❌ Learning: Error getting corrections:', error)
      throw error
    }
  }

  /**
   * Get vendor correction patterns for improving matching
   */
  async getVendorCorrectionPatterns(userId?: string): Promise<Array<{
    original_value: string
    corrected_value: string
    frequency: number
    last_corrected: string
  }>> {
    try {
      let query = supabaseAdmin
        .from('corrections')
        .select('original_value, corrected_value, created_at')
        .eq('field_type', 'vendor_match')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to get vendor correction patterns: ${error.message}`)
      }

      // Group corrections by original -> corrected mapping
      const patterns = new Map<string, {
        corrected_value: string
        frequency: number
        last_corrected: string
      }>()

      data?.forEach(correction => {
        const key = `${correction.original_value}:${correction.corrected_value}`
        const existing = patterns.get(key)
        
        if (existing) {
          existing.frequency += 1
          if (correction.created_at > existing.last_corrected) {
            existing.last_corrected = correction.created_at
          }
        } else {
          patterns.set(key, {
            corrected_value: correction.corrected_value,
            frequency: 1,
            last_corrected: correction.created_at
          })
        }
      })

      // Convert to array and sort by frequency
      return Array.from(patterns.entries()).map(([key, value]) => {
        const [original_value] = key.split(':')
        return {
          original_value,
          corrected_value: value.corrected_value,
          frequency: value.frequency,
          last_corrected: value.last_corrected
        }
      }).sort((a, b) => b.frequency - a.frequency)

    } catch (error) {
      console.error('❌ Learning: Error getting vendor correction patterns:', error)
      throw error
    }
  }

  /**
   * Get GL assignment correction patterns for improving mapping
   */
  async getGLCorrectionPatterns(userId?: string): Promise<Array<{
    original_value: string
    corrected_value: string
    frequency: number
    last_corrected: string
  }>> {
    try {
      let query = supabaseAdmin
        .from('corrections')
        .select('original_value, corrected_value, created_at')
        .eq('field_type', 'gl_assignment')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to get GL correction patterns: ${error.message}`)
      }

      // Group corrections by original -> corrected mapping
      const patterns = new Map<string, {
        corrected_value: string
        frequency: number
        last_corrected: string
      }>()

      data?.forEach(correction => {
        const key = `${correction.original_value}:${correction.corrected_value}`
        const existing = patterns.get(key)
        
        if (existing) {
          existing.frequency += 1
          if (correction.created_at > existing.last_corrected) {
            existing.last_corrected = correction.created_at
          }
        } else {
          patterns.set(key, {
            corrected_value: correction.corrected_value,
            frequency: 1,
            last_corrected: correction.created_at
          })
        }
      })

      // Convert to array and sort by frequency
      return Array.from(patterns.entries()).map(([key, value]) => {
        const [original_value] = key.split(':')
        return {
          original_value,
          corrected_value: value.corrected_value,
          frequency: value.frequency,
          last_corrected: value.last_corrected
        }
      }).sort((a, b) => b.frequency - a.frequency)

    } catch (error) {
      console.error('❌ Learning: Error getting GL correction patterns:', error)
      throw error
    }
  }

  /**
   * Track vendor correction and create alias if needed
   */
  async trackVendorCorrection(
    documentId: string,
    originalVendorName: string,
    correctedVendorId: string,
    correctedVendorName: string,
    userId: string
  ): Promise<{ correction: CorrectionRecord; aliasCreated: boolean }> {
    try {
      // Log the correction
      const correction = await this.logCorrection({
        documentId,
        fieldType: 'vendor_match',
        originalValue: originalVendorName,
        correctedValue: correctedVendorName,
        userId,
        metadata: {
          corrected_vendor_id: correctedVendorId,
          original_vendor_name: originalVendorName
        }
      })

      // Attempt to create alias if the original name differs from corrected name
      let aliasCreated = false
      if (originalVendorName.toLowerCase().trim() !== correctedVendorName.toLowerCase().trim()) {
        try {
          // Check if alias already exists
          const { data: existingAlias } = await supabaseAdmin
            .from('vendor_aliases')
            .select('id')
            .eq('vendor_id', correctedVendorId)
            .eq('alias', originalVendorName.trim())
            .single()

          if (!existingAlias) {
            const { error: aliasError } = await supabaseAdmin
              .from('vendor_aliases')
              .insert({
                vendor_id: correctedVendorId,
                alias: originalVendorName.trim(),
                confidence: 0.9,
                source: 'user_correction',
                created_by: userId
              })

            if (!aliasError) {
              aliasCreated = true
              console.log('✅ Learning: Alias created successfully', {
                vendorId: correctedVendorId,
                alias: originalVendorName.trim()
              })
            } else {
              console.warn('⚠️ Learning: Failed to create alias, but correction logged:', aliasError.message)
            }
          } else {
            console.log('ℹ️ Learning: Alias already exists, skipping creation')
          }
        } catch (aliasError) {
          console.warn('⚠️ Learning: Alias creation failed, but correction logged:', aliasError)
        }
      }

      return { correction, aliasCreated }
    } catch (error) {
      console.error('❌ Learning: Error tracking vendor correction:', error)
      throw error
    }
  }

  /**
   * Get health status of the learning system
   */
  async getHealthStatus(): Promise<{
    corrections: string
    aliases: string
    recent_corrections: number
    total_corrections: number
  }> {
    try {
      // Get total corrections count
      const { count: totalCorrections, error: totalError } = await supabaseAdmin
        .from('corrections')
        .select('id', { count: 'exact', head: true })

      // If table doesn't exist, return appropriate status
      if (totalError && totalError.code === 'PGRST116') {
        return {
          corrections: 'inactive',
          aliases: 'disabled',
          recent_corrections: 0,
          total_corrections: 0
        }
      }

      if (totalError) {
        throw new Error(`Failed to get total corrections: ${totalError.message}`)
      }

      // Get recent corrections (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count: recentCorrections, error: recentError } = await supabaseAdmin
        .from('corrections')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo)

      if (recentError) {
        throw new Error(`Failed to get recent corrections: ${recentError.message}`)
      }

      // Check if alias functionality is working
      const { data: aliasTest, error: aliasError } = await supabaseAdmin
        .from('vendor_aliases')
        .select('id')
        .limit(1)

      const aliasStatus = aliasError ? 'error' : 'enabled'

      return {
        corrections: 'active',
        aliases: aliasStatus,
        recent_corrections: recentCorrections || 0,
        total_corrections: totalCorrections || 0
      }
    } catch (error) {
      console.error('❌ Learning: Error getting health status:', error)
      return {
        corrections: 'error',
        aliases: 'error',
        recent_corrections: 0,
        total_corrections: 0
      }
    }
  }
}