'use client'

import { useState } from 'react'
import { useDocuments } from '@/src/hooks/useDocuments'
import ErrorBoundary from '@/src/components/ErrorBoundary'
import { SimpleMappingWarning } from '@/src/components/SimpleMappingWarning'
import { Document } from '@/src/types/document.types'
import { PageHeader } from '@/src/components/design-system/layout/PageHeader'
import { LoadingState } from '@/src/components/design-system/feedback/LoadingState'
import { ErrorState } from '@/src/components/design-system/feedback/ErrorState'
import { EmptyState } from '@/src/components/design-system/feedback/EmptyState'
import { DocumentCard } from '@/src/components/design-system/dashboard/DocumentCard'
import { BulkExportButton } from '@/src/components/export/BulkExportButton'
import { 
  FunnelIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'

type AccountingStatus = 'needs_mapping' | 'ready_for_export' | 'exported'

// Extended Document interface with accounting fields
interface DocumentWithAccounting extends Document {
  accounting_status?: AccountingStatus
  mapping_confidence?: number
  company_code?: string
  gl_account?: string
  requires_review?: boolean
}

function DocumentsContent() {
  const { data, isLoading, error, refetch } = useDocuments()
  
  // Filter and selection state
  const [accountingStatusFilter, setAccountingStatusFilter] = useState<AccountingStatus | 'all'>('all')
  const [confidenceFilter, setConfidenceFilter] = useState<number>(0)
  const [showExportReady, setShowExportReady] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Bulk action functions
  const markSelectedAsExportReady = async () => {
    setBulkActionLoading(true)
    try {
      await Promise.all(selectedDocuments.map(documentId => 
        fetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accounting_status: 'ready_for_export' })
        })
      ))
      setSelectedDocuments([])
      refetch()
    } catch (error) {
      console.error('Failed to mark documents as export ready:', error)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const markSelectedForReview = async () => {
    setBulkActionLoading(true)
    try {
      await Promise.all(selectedDocuments.map(documentId => 
        fetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requires_review: true })
        })
      ))
      setSelectedDocuments([])
      refetch()
    } catch (error) {
      console.error('Failed to mark documents for review:', error)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const reprocessSelected = async () => {
    setBulkActionLoading(true)
    try {
      await Promise.all(selectedDocuments.map(documentId => 
        fetch(`/api/documents/${documentId}/reprocess`, {
          method: 'POST'
        })
      ))
      setSelectedDocuments([])
      refetch()
    } catch (error) {
      console.error('Failed to reprocess documents:', error)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  const toggleSelectAll = () => {
    const completedDocuments = (documents as DocumentWithAccounting[])
      .filter(doc => doc.status === 'completed')
      .map(doc => doc.id)
    
    setSelectedDocuments(prev => 
      prev.length === completedDocuments.length 
        ? [] 
        : completedDocuments
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Documents"
          subtitle="Manage and process your document intelligence"
          status={{
            type: 'operational',
            label: 'Document processing active',
            animated: true
          }}
          primaryAction={{
            label: 'Upload Document',
            href: '/documents/upload'
          }}
        />
        
        <LoadingState
          variant="spinner"
          size="lg"
          message="Loading documents..."
          centered
        >
          <p className="text-base text-gray-500 font-light">
            Fetching your document intelligence data
          </p>
        </LoadingState>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Documents"
          subtitle="Manage and process your document intelligence"
          status={{
            type: 'error',
            label: 'Connection error'
          }}
          primaryAction={{
            label: 'Upload Document',
            href: '/documents/upload'
          }}
        />
        
        <ErrorState
          title="Failed to load documents"
          message={error.message || 'An unexpected error occurred while fetching your documents'}
          primaryAction={{
            label: 'Try Again',
            onClick: () => refetch()
          }}
        />
      </div>
    )
  }

  const documents = data?.documents || []
  
  // Filter documents based on accounting criteria
  const filteredDocuments = (documents as DocumentWithAccounting[]).filter(doc => {
    // Accounting status filter
    if (accountingStatusFilter !== 'all' && doc.accounting_status !== accountingStatusFilter) {
      return false
    }
    
    // Confidence filter
    if (confidenceFilter > 0 && (doc.mapping_confidence || 0) < confidenceFilter) {
      return false
    }
    
    // Export ready filter
    if (showExportReady && doc.accounting_status !== 'ready_for_export') {
      return false
    }
    
    return true
  })
  
  // Calculate status counts for summary
  const statusCounts = documents.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Calculate accounting status counts
  const accountingCounts = (documents as DocumentWithAccounting[]).reduce((acc, doc) => {
    if (doc.status === 'completed') {
      const status = doc.accounting_status || 'needs_mapping'
      acc[status] = (acc[status] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)
  
  const processingCount = (statusCounts.pending || 0) + (statusCounts.processing || 0)
  const exportReadyCount = accountingCounts.ready_for_export || 0

  if (documents.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Documents"
          subtitle="Manage and process your document intelligence"
          status={{
            type: 'offline',
            label: 'Ready for documents'
          }}
          primaryAction={{
            label: 'Upload Document',
            href: '/documents/upload'
          }}
        />
        
        <EmptyState
          title="No documents yet"
          description="Start by uploading your first document to begin intelligent document processing"
          primaryAction={{
            label: 'Upload Your First Document',
            href: '/documents/upload'
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documents"
        subtitle={`${documents.length} documents • ${exportReadyCount} ready for export`}
        status={processingCount > 0 ? {
          type: 'processing',
          label: `${processingCount} processing`,
          animated: true
        } : exportReadyCount > 0 ? {
          type: 'operational',
          label: `${exportReadyCount} ready for export`
        } : {
          type: 'operational',
          label: 'All documents processed'
        }}
        primaryAction={{
          label: 'Upload Document',
          href: '/documents/upload'
        }}
      />

      {/* Simple Mapping Mode Warning */}
      <SimpleMappingWarning dismissible={true} />

      {/* Filters and Bulk Actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Accounting Filters</h3>
            {selectedDocuments.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  {selectedDocuments.length} selected
                </span>
                <button
                  onClick={markSelectedAsExportReady}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Mark Export Ready
                </button>
                <button
                  onClick={markSelectedForReview}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                  Requires Review
                </button>
                <button
                  onClick={reprocessSelected}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-4 h-4 mr-2 ${bulkActionLoading ? 'animate-spin' : ''}`} />
                  Re-process
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accounting Status
              </label>
              <select
                value={accountingStatusFilter}
                onChange={(e) => setAccountingStatusFilter(e.target.value as AccountingStatus | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="needs_mapping">Needs Mapping</option>
                <option value="ready_for_export">Ready for Export</option>
                <option value="exported">Exported</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Confidence ({Math.round(confidenceFilter * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  checked={showExportReady}
                  onChange={(e) => setShowExportReady(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Export Ready Only
                </span>
              </label>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setAccountingStatusFilter('all')
                  setConfidenceFilter(0)
                  setShowExportReady(false)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Export Section */}
      {filteredDocuments.length > 0 && (
        <BulkExportButton 
          documents={filteredDocuments as DocumentWithAccounting[]} 
          className="mb-6"
        />
      )}

      {/* Documents List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-light text-gray-900 tracking-tight">Document Library</h2>
            <div className="flex items-center space-x-6">
              {documents.some(doc => doc.status === 'completed') && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.length === (documents as DocumentWithAccounting[]).filter(doc => doc.status === 'completed').length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All Completed
                  </span>
                </label>
              )}
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-500 font-medium">
                  {filteredDocuments.length} of {documents.length} documents
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {filteredDocuments.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents match your filters</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filter criteria to see more results.
              </p>
            </div>
          ) : (
            filteredDocuments.map((document: DocumentWithAccounting) => (
              <div key={document.id} className="relative">
                {document.status === 'completed' && (
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(document.id)}
                      onChange={() => toggleDocumentSelection(document.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                <DocumentCard
                  document={{
                    id: document.id,
                    filename: document.filename,
                    source: document.source as 'email' | 'upload',
                    created_at: document.created_at,
                    status: document.status as any,
                    extraction_cost: document.extraction_cost || undefined,
                    extraction_method: document.extraction_method || undefined,
                    email_metadata: document.email_metadata || undefined,
                    // Accounting fields
                    accounting_status: document.accounting_status,
                    mapping_confidence: document.mapping_confidence,
                    company_code: document.company_code,
                    gl_account: document.gl_account,
                    requires_review: document.requires_review
                  }}
                  actions={[
                    {
                      label: 'View Details',
                      href: `/documents/${document.id}`,
                      variant: 'primary'
                    },
                    {
                      label: 'Download',
                      href: document.file_url,
                      variant: 'secondary'
                    }
                  ]}
                  className={document.status === 'completed' ? 'pl-16' : undefined}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <ErrorBoundary>
      <DocumentsContent />
    </ErrorBoundary>
  )
}