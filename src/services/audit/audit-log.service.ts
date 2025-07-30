import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AuditLogEntry } from '@/src/lib/validation/accounting.schemas'

export interface AuditLogOptions {
  document_id: string
  field_name: string
  input_value: string | number | null
  output_value: string | number | null
  confidence_score: number
  reasoning: string
  mapping_source: 'manual_edit' | 'field_reprocess' | 'full_reprocess' | 'initial_mapping'
}

export class AuditLogService {
  private supabase

  constructor() {
    const cookieStore = cookies()
    this.supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
  }

  /**
   * Log an accounting field change or mapping decision
   */
  async logFieldChange(options: AuditLogOptions): Promise<void> {
    try {
      // Convert values to strings for storage
      const inputValueStr = this.valueToString(options.input_value)
      const outputValueStr = this.valueToString(options.output_value)

      const { error } = await this.supabase
        .from('business_logic_audit')
        .insert({
          document_id: options.document_id,
          field_name: options.field_name,
          input_value: inputValueStr,
          output_value: outputValueStr,
          confidence_score: options.confidence_score,
          reasoning: options.reasoning,
          mapping_source: options.mapping_source,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to create audit log entry:', error)
        // Don't throw - audit logging shouldn't break the main operation
      } else {
        console.log(`✅ AUDIT: Logged ${options.mapping_source} for field ${options.field_name} in document ${options.document_id}`)
      }
    } catch (error) {
      console.error('Audit logging error:', error)
      // Don't throw - audit logging shouldn't break the main operation
    }
  }

  /**
   * Log multiple field changes in a batch (for reprocessing)
   */
  async logBatchFieldChanges(documentId: string, changes: Array<{
    field_name: string
    input_value: string | number | null
    output_value: string | number | null
    confidence_score: number
    reasoning: string
    mapping_source: 'manual_edit' | 'field_reprocess' | 'full_reprocess' | 'initial_mapping'
  }>): Promise<void> {
    try {
      const auditEntries = changes.map(change => ({
        document_id: documentId,
        field_name: change.field_name,
        input_value: this.valueToString(change.input_value),
        output_value: this.valueToString(change.output_value),
        confidence_score: change.confidence_score,
        reasoning: change.reasoning,
        mapping_source: change.mapping_source,
        created_at: new Date().toISOString()
      }))

      const { error } = await this.supabase
        .from('business_logic_audit')
        .insert(auditEntries)

      if (error) {
        console.error('Failed to create batch audit log entries:', error)
      } else {
        console.log(`✅ AUDIT: Logged ${changes.length} field changes for document ${documentId}`)
      }
    } catch (error) {
      console.error('Batch audit logging error:', error)
    }
  }

  /**
   * Get audit trail for a specific document
   */
  async getDocumentAuditTrail(documentId: string): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('business_logic_audit')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch audit trail:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching audit trail:', error)
      return []
    }
  }

  /**
   * Get audit trail for a specific field across all documents
   */
  async getFieldAuditTrail(fieldName: string, limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('business_logic_audit')
        .select('*')
        .eq('field_name', fieldName)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to fetch field audit trail:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching field audit trail:', error)
      return []
    }
  }

  /**
   * Get audit statistics for reporting
   */
  async getAuditStats(startDate?: string, endDate?: string): Promise<{
    totalChanges: number
    changesBySource: Record<string, number>
    changesByField: Record<string, number>
    averageConfidence: number
  }> {
    try {
      let query = this.supabase
        .from('business_logic_audit')
        .select('mapping_source, field_name, confidence_score')

      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data, error } = await query

      if (error || !data) {
        console.error('Failed to fetch audit stats:', error)
        return {
          totalChanges: 0,
          changesBySource: {},
          changesByField: {},
          averageConfidence: 0
        }
      }

      const stats = {
        totalChanges: data.length,
        changesBySource: {} as Record<string, number>,
        changesByField: {} as Record<string, number>,
        averageConfidence: 0
      }

      let totalConfidence = 0

      for (const entry of data) {
        // Count by source
        stats.changesBySource[entry.mapping_source] = 
          (stats.changesBySource[entry.mapping_source] || 0) + 1

        // Count by field
        stats.changesByField[entry.field_name] = 
          (stats.changesByField[entry.field_name] || 0) + 1

        // Sum confidence
        totalConfidence += entry.confidence_score || 0
      }

      stats.averageConfidence = data.length > 0 ? totalConfidence / data.length : 0

      return stats
    } catch (error) {
      console.error('Error calculating audit stats:', error)
      return {
        totalChanges: 0,
        changesBySource: {},
        changesByField: {},
        averageConfidence: 0
      }
    }
  }

  /**
   * Convert any value to string for database storage
   */
  private valueToString(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value.toString()
    return String(value)
  }
}

// Singleton instance for easy use
let auditLogService: AuditLogService

export function getAuditLogService(): AuditLogService {
  if (!auditLogService) {
    auditLogService = new AuditLogService()
  }
  return auditLogService
}