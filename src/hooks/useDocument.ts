import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/src/stores/auth.store'
import { DocumentStatusType } from '@/src/types/document.types'

// Extended Document interface with accounting fields
export interface DocumentWithAccounting {
  id: string
  filename: string
  file_url: string
  status: DocumentStatusType
  created_at: string
  updated_at?: string
  user_id: string
  source?: string
  extraction_cost?: number | null
  extraction_method?: string | null
  error_message?: string
  extracted_data?: any
  
  // Accounting workflow fields
  accounting_status?: 'needs_mapping' | 'ready_for_export' | 'exported'
  mapping_confidence?: number
  requires_review?: boolean
  
  // 21 Accounting Fields
  company_code?: string | null
  supplier_invoice_transaction_type?: string | null
  invoicing_party?: string | null
  supplier_invoice_id_by_invcg_party?: string | null
  document_date?: string | null
  posting_date?: string | null
  accounting_document_type?: string | null
  accounting_document_header_text?: string | null
  document_currency?: string | null
  invoice_gross_amount?: number | null
  gl_account?: string | null
  supplier_invoice_item_text?: string | null
  debit_credit_code?: string | null
  supplier_invoice_item_amount?: number | null
  tax_code?: string | null
  tax_jurisdiction?: string | null
  assignment_reference?: string | null
  cost_center?: string | null
  profit_center?: string | null
  internal_order?: string | null
  wbs_element?: string | null
}

export function useDocument(documentId: string) {
  const { user } = useAuthStore()
  
  return useQuery<DocumentWithAccounting>({
    queryKey: ['document', documentId],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      console.log('🔍 Fetching document:', documentId)
      
      const response = await fetch(`/api/documents/${documentId}`, {
        credentials: 'include'
      })
      
      console.log('📡 Document fetch response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Document fetch error:', error)
        throw new Error(error.error || 'Failed to fetch document')
      }
      
      const result = await response.json()
      console.log('📄 Document API response:', result)
      
      // The API returns { success: true, document: {...} }, so extract the document
      if (result.success && result.document) {
        console.log('✅ Document extracted successfully:', result.document.filename)
        return result.document
      }
      
      console.error('❌ Invalid response format:', result)
      throw new Error('Invalid response format')
    },
    enabled: !!user && !!documentId,
    refetchInterval: (query) => {
      // Poll every 3 seconds if document is processing
      const data = query.state.data
      return data?.status === 'pending' || data?.status === 'processing' ? 3000 : false
    },
    staleTime: 0, // Always consider data stale for real-time updates
  })
}

export function useUpdateDocumentField() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ documentId, fieldKey, newValue, updates }: {
      documentId: string
      fieldKey?: string
      newValue?: string | number | boolean
      updates?: Record<string, any>
    }) => {
      const payload = updates || { [fieldKey!]: newValue }
      console.log('🔄 Updating document:', documentId, 'with payload:', payload)
      
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      
      console.log('📡 Update field response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Update field error:', error)
        throw new Error(error.error || 'Failed to update field')
      }
      
      const result = await response.json()
      console.log('📄 Update field response:', result)
      
      // The API returns { success: true, document: {...} }, so extract the document
      if (result.success && result.document) {
        console.log('✅ Field updated successfully, document updated')
        return result.document
      }
      
      console.error('❌ Invalid response format:', result)
      throw new Error('Invalid response format')
    },
    onSuccess: (data, variables) => {
      console.log('💾 Mutation success data received:', {
        fieldKey: variables.fieldKey,
        newValue: variables.newValue,
        updatedDocument: data
      })
      
      console.log('📋 Updated document accounting_status:', data.accounting_status)
      console.log('📋 Updated document requires_review:', data.requires_review)
      
      // Force refresh the current document query (this will trigger a refetch)
      queryClient.invalidateQueries({ queryKey: ['document', variables.documentId] })
      
      // Also invalidate documents list to refresh status
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      
      console.log('🔄 React Query cache invalidated for document:', variables.documentId)
    },
  })
}

export function useReprocessDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}/reprocess`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reprocess document')
      }
      
      const result = await response.json()
      
      // Handle response format
      if (result.success && result.document) {
        return result.document
      } else if (result.document) {
        return result.document
      }
      
      return result
    },
    onSuccess: (data, documentId) => {
      // Update the document cache
      queryClient.setQueryData(['document', documentId], data)
      
      // Force refresh the current document query
      queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      
      // Invalidate documents list
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      
      console.log('🔄 React Query cache updated after reprocess for document:', documentId)
    },
  })
}

export function useRetryDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}/retry`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to retry document')
      }
      
      const result = await response.json()
      
      // Handle response format
      if (result.success && result.document) {
        return result.document
      } else if (result.document) {
        return result.document
      }
      
      return result
    },
    onSuccess: (data, documentId) => {
      // Update the document cache
      queryClient.setQueryData(['document', documentId], data)
      
      // Force refresh the current document query
      queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      
      // Invalidate documents list
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      
      console.log('🔄 React Query cache updated after retry for document:', documentId)
    },
  })
}