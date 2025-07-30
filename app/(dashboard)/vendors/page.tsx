'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Vendor } from '@/src/services/vendors/vendor.service'
import ErrorBoundary from '@/src/components/ErrorBoundary'
import { VendorModal } from '@/src/components/VendorModal'
import { PageHeader } from '@/src/components/design-system/layout/PageHeader'
import { SearchInput } from '@/src/components/design-system/forms/SearchInput'
import { DataTable } from '@/src/components/design-system/layout/DataTable'
import { Button } from '@/src/components/design-system/foundations/Button'
import { EmptyState } from '@/src/components/design-system/feedback/EmptyState'
import { ErrorState } from '@/src/components/design-system/feedback/ErrorState'
import { LoadingState } from '@/src/components/design-system/feedback/LoadingState'

interface VendorResponse {
  success: boolean
  vendors: Vendor[]
  total: number
  error?: string
}

function VendorsContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  // Fetch vendors with optional search
  const { data, isLoading, error, refetch } = useQuery<VendorResponse>({
    queryKey: ['vendors', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      
      const response = await fetch(`/api/vendors?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch vendors')
      }
      return response.json()
    },
    refetchOnWindowFocus: false,
  })

  // Delete vendor mutation
  const deleteVendorMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete vendor')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setIsModalOpen(true)
  }

  const handleDelete = (vendor: Vendor) => {
    if (window.confirm(`Are you sure you want to delete "${vendor.name}"?`)) {
      deleteVendorMutation.mutate(vendor.id)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingVendor(null)
  }

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['vendors'] })
    handleModalClose()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vendors"
          subtitle="Manage your vendor database"
          actions={
            <Button disabled>
              <span className="mr-2">➕</span>
              Add Vendor
            </Button>
          }
        />
        <LoadingState message="Loading vendors..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vendors"
          subtitle="Manage your vendor database"
          actions={
            <Button onClick={() => setIsModalOpen(true)}>
              <span className="mr-2">➕</span>
              Add Vendor
            </Button>
          }
        />
        <ErrorState
          title="Failed to load vendors"
          message={error instanceof Error ? error.message : 'An unexpected error occurred'}
          primaryAction={{
            label: "Try Again",
            onClick: () => refetch()
          }}
        />
      </div>
    )
  }

  const vendors = data?.vendors || []

  const vendorColumns = [
    {
      key: 'vendor',
      label: 'Vendor',
      render: (vendor: Vendor) => (
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">🏢</span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {vendor.name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {vendor.tax_id && (
                <span>Tax ID: {vendor.tax_id}</span>
              )}
              <span>
                Added {new Date(vendor.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'aliases',
      label: 'Aliases',
      render: (vendor: Vendor) => (
        vendor.aliases && vendor.aliases.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {vendor.aliases.map((alias) => (
              <span
                key={alias.id}
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
              >
                {alias.alias}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">No aliases</span>
        )
      )
    }
  ]

  const vendorActions = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: handleEdit,
      variant: 'primary' as const
    },
    {
      key: 'delete',
      label: deleteVendorMutation.isPending ? 'Deleting...' : 'Delete',
      onClick: handleDelete,
      variant: 'danger' as const,
      disabled: () => deleteVendorMutation.isPending
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        subtitle={`Manage your vendor database (${vendors.length} vendors)`}
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <span className="mr-2">➕</span>
            Add Vendor
          </Button>
        }
      />

      <SearchInput
        placeholder="Search vendors by name or alias..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onClear={() => setSearchQuery('')}
        clearable
        containerClassName="bg-white rounded-lg shadow p-4"
      />

      {vendors.length === 0 ? (
        <EmptyState
          icon="🏢"
          title={searchQuery ? 'No vendors found' : 'No vendors yet'}
          description={
            searchQuery 
              ? `No vendors match "${searchQuery}". Try a different search term.`
              : 'Start by adding your first vendor to the database'
          }
        >
          {!searchQuery && (
            <Button onClick={() => setIsModalOpen(true)}>
              Add Your First Vendor
            </Button>
          )}
        </EmptyState>
      ) : (
        <DataTable
          data={vendors}
          columns={vendorColumns}
          actions={vendorActions}
          getRowKey={(vendor) => vendor.id}
          caption={searchQuery ? `Search Results for "${searchQuery}"` : 'All Vendors'}
        />
      )}

      {/* Vendor Modal */}
      <VendorModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        vendor={editingVendor}
      />
    </div>
  )
}

export default function VendorsPage() {
  return (
    <ErrorBoundary>
      <VendorsContent />
    </ErrorBoundary>
  )
}