'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import VendorCombobox from './VendorCombobox'
import { VendorMatch, VendorComboboxOption, VendorMatchingRequest } from '@/src/types/vendor-matching'
import { useAuthStore } from '@/src/stores/auth.store'

interface VendorMatchingSectionProps {
  documentId: string
  supplierName?: string
  onMatchConfirmed?: (match: VendorMatch) => void
}

export default function VendorMatchingSection({
  documentId,
  supplierName,
  onMatchConfirmed
}: VendorMatchingSectionProps) {
  const [selectedVendor, setSelectedVendor] = useState<VendorComboboxOption | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [learningFeedback, setLearningFeedback] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // Fetch existing vendor matches
  const queryKey = useMemo(() => ['vendor-matches', documentId], [documentId])
  
  const { data: existingMatches, isLoading: isLoadingMatches } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/documents/${documentId}/vendor-matches`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch vendor matches')
      }
      
      return result.data as VendorMatch[]
    },
    refetchOnWindowFocus: false,
  })

  // Get confirmed match (most recent one if multiple exist)
  const confirmedMatches = existingMatches?.filter(match => match.is_confirmed) || []
  const sortedConfirmedMatches = confirmedMatches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const confirmedMatch = sortedConfirmedMatches[0]

  // Auto-expand if we have a supplier name but no confirmed match
  useEffect(() => {
    if (supplierName && !confirmedMatch && !isLoadingMatches) {
      setIsExpanded(true)
    }
  }, [supplierName, confirmedMatch, isLoadingMatches])

  // Create vendor match mutation
  const createMatchMutation = useMutation({
    mutationFn: async (request: Omit<VendorMatchingRequest, 'document_id'>) => {
      const response = await fetch(`/api/documents/${documentId}/vendor-matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create vendor match')
      }
      
      return result.data
    }
  })

  // Confirm vendor match mutation
  const confirmMatchMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const response = await fetch(`/api/documents/${documentId}/vendor-matches/${vendorId}`, {
        method: 'PUT'
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to confirm vendor match')
      }
      
      return result.data
    },
    onSuccess: (data) => {
      if (onMatchConfirmed) {
        onMatchConfirmed(data)
      }
      
      // Delay invalidation to prevent loops
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['vendor-matches', documentId] })
      }, 100)
    }
  })


  // Track vendor correction for learning with automatic alias creation
  const trackVendorCorrection = async (originalValue: string, correctedVendor: VendorComboboxOption) => {
    if (!user) {
      return
    }
    
    try {
      const requestBody = {
        documentId,
        originalVendorName: originalValue,
        correctedVendorId: correctedVendor.value,
        correctedVendorName: correctedVendor.label
      }
      
      const response = await fetch('/api/corrections/vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      const result = await response.json()
      
      if (result.success) {
        const aliasCreated = result.data?.alias_created || false
        const message = aliasCreated
          ? '✅ Learning from correction - alias created for future matching!'
          : '✅ Learning from correction - future suggestions will improve!'
        
        setLearningFeedback(message)
        setTimeout(() => {
          setLearningFeedback(null)
        }, 4000)
      }
    } catch (error) {
      console.error('Vendor learning error:', error)
    }
  }

  const handleConfirmMatch = async (vendor: VendorComboboxOption | null) => {
    if (!vendor) return
    try {
      setSelectedVendor(vendor)
      
      // Check if this is a correction (different from original)
      const isCorrection = supplierName && supplierName.toLowerCase().trim() !== vendor.label.toLowerCase().trim()
      
      // Track correction if this is different from the original supplier name
      if (isCorrection) {
        await trackVendorCorrection(supplierName, vendor)
      }
      
      // First create the match if it doesn't exist
      const createMatchRequest = {
        vendor_id: vendor.value,
        confidence: 1.0, // 100% confidence for manual user selection
        is_confirmed: false
      }
      
      await createMatchMutation.mutateAsync(createMatchRequest)
      
      // Then confirm it
      await confirmMatchMutation.mutateAsync(vendor.value)
      
      setSelectedVendor(null)
      setIsExpanded(false)
    } catch (error) {
      console.error('Handle confirm match error:', error)
    }
  }

  if (isLoadingMatches) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Loading vendor information...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Vendor Matching</h2>
          {confirmedMatch && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Confirmed
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {confirmedMatch ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Confirmed Vendor</h3>
                <p className="text-lg font-semibold text-gray-900 mt-1">{confirmedMatch.vendor_name}</p>
                {confirmedMatch.vendor_tax_id && (
                  <p className="text-sm text-gray-500">Tax ID: {confirmedMatch.vendor_tax_id}</p>
                )}
                {confirmedMatch.vendor_aliases && confirmedMatch.vendor_aliases.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Aliases: {confirmedMatch.vendor_aliases.join(', ')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Confidence</div>
                <div className="text-lg font-semibold text-green-600">
                  {Math.round(confirmedMatch.confidence * 100)}%
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                {isExpanded ? 'Hide' : 'Change'} vendor selection
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {supplierName && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Extracted Supplier: {supplierName}
                </h3>
                <p className="text-sm text-blue-800">
                  Select a vendor from your database to match with this supplier.
                </p>
              </div>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {isExpanded ? 'Hide vendor selection' : 'Select vendor for this document'}
                </span>
                <span className="text-gray-400">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </div>
            </button>
          </div>
        )}
        
        {isExpanded && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search and select vendor
              </label>
              <VendorCombobox
                value={selectedVendor}
                onChange={handleConfirmMatch}
                placeholder="Search vendors..."
              />
            </div>
            
            {(createMatchMutation.isPending || confirmMatchMutation.isPending) && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                <span>Saving vendor match...</span>
              </div>
            )}
            
            {(createMatchMutation.error || confirmMatchMutation.error) && (
              <div className="text-sm text-red-600">
                Error: {(createMatchMutation.error || confirmMatchMutation.error)?.message}
              </div>
            )}
            
            {learningFeedback && (
              <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                <span>{learningFeedback}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}