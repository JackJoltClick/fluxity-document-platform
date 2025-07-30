'use client'

import { useQuery } from '@tanstack/react-query'

interface SystemModeResponse {
  success: boolean
  simple_mapping_mode: boolean
  processing_mode: 'direct_mapping' | 'business_rules' | 'unknown'
  message: string
}

/**
 * Hook to check if simple mapping mode is active
 * Uses React Query for caching and follows existing patterns
 */
export function useSystemMode() {
  return useQuery({
    queryKey: ['system-mode'],
    queryFn: async (): Promise<SystemModeResponse> => {
      const response = await fetch('/api/system/mapping-mode')
      if (!response.ok) {
        throw new Error('Failed to fetch system mode')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - mode rarely changes
    gcTime: 10 * 60 * 1000, // Keep in garbage collection for 10 minutes
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  })
}

/**
 * Simple helper hook that just returns the boolean value
 */
export function useIsSimpleMappingMode(): boolean {
  const { data } = useSystemMode()
  return data?.simple_mapping_mode ?? false
}