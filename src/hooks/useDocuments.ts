import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase/client'
import { useAuthStore } from '@/src/stores/auth.store'
import { Document, DocumentsResponse } from '@/src/types/document.types'


export function useDocuments() {
  const { user } = useAuthStore()
  
  return useQuery<DocumentsResponse>({
    queryKey: ['documents'],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not found')
      }
      
      const { data: documents, error: queryError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (queryError) {
        // If table doesn't exist, return empty array
        if (queryError.code === 'PGRST116') {
          return { success: true, documents: [], total: 0 }
        }
        throw new Error(queryError.message)
      }
      
      const result = { success: true, documents: documents || [], total: documents?.length || 0 }
      
      // Debug logging for queue tracking
      if (documents && documents.length > 0) {
        console.log('📊 QUEUE: Document statuses:', documents.map(d => ({
          id: d.id.substring(0, 8),
          filename: d.filename,
          status: d.status,
          created: new Date(d.created_at).toLocaleTimeString()
        })))
      }
      
      return result
    },
    refetchInterval: (data) => {
      // Poll every 3 seconds if there are pending or processing documents
      const documents = (data as any)?.documents || []
      const hasActiveDocs = documents.some((doc: any) => 
        doc.status === 'pending' || doc.status === 'processing'
      )
      return hasActiveDocs ? 3000 : false // 3 seconds if active, no polling if all completed
    },
    staleTime: 0, // Always consider data stale for real-time updates
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user, // Only run when user exists
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (documentData: { filename: string; file_url: string; status?: string }) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create document')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

// Types are now imported from '@/src/types/document.types'