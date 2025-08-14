'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useDocument, useUpdateDocumentField, useReprocessDocument, useRetryDocument } from '@/src/hooks/useDocument'
import { useAuthStore } from '@/src/stores/auth.store'
import { supabase } from '@/src/lib/supabase/client'
import { StatusBadge, CostDisplay } from '@/src/components/StatusBadge'
import ErrorBoundary from '@/src/components/ErrorBoundary'
import VendorMatchingSection from '@/src/components/VendorMatchingSection'
import { SimpleMappingWarning } from '@/src/components/SimpleMappingWarning'
import { PageHeader } from '@/src/components/design-system/layout/PageHeader'
import { LoadingState } from '@/src/components/design-system/feedback/LoadingState'
import { ErrorState } from '@/src/components/design-system/feedback/ErrorState'
import { ProcessingProgress } from '@/src/components/design-system/feedback/ProcessingProgress'

// Accounting Components
import { AccountingStatusBadge } from '@/src/components/accounting/AccountingStatusBadge'
import { ConfidenceIndicator } from '@/src/components/accounting/ConfidenceIndicator'
import { DynamicAccountingFields } from '@/src/components/accounting/DynamicAccountingFields'
import { JustificationReport } from '@/src/components/JustificationReport'

// Export Components
import { ExcelExportButton } from '@/src/components/export/ExcelExportButton'

import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CogIcon
} from '@heroicons/react/24/outline'

interface ClientSchema {
  id: string
  name: string
  description: string | null
  columns: { name: string; description: string }[]
}

function DocumentDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const documentId = params.id as string

  // Client schema state
  const [clientSchema, setClientSchema] = useState<ClientSchema | null>(null)
  const [schemaLoading, setSchemaLoading] = useState(false)

  // React Query hooks
  const { data: document, isLoading, error, refetch } = useDocument(documentId)
  const updateFieldMutation = useUpdateDocumentField()
  const reprocessMutation = useReprocessDocument()
  const retryMutation = useRetryDocument()

  // Fetch client schema if document has one
  useEffect(() => {
    const fetchClientSchema = async () => {
      if (!document?.client_schema_id) return
      
      try {
        setSchemaLoading(true)
        const { data, error } = await supabase
          .from('client_schemas')
          .select('id, name, description, columns')
          .eq('id', document.client_schema_id)
          .single()

        if (error) {
          console.error('Error fetching client schema:', error)
          return
        }

        setClientSchema(data)
      } catch (error) {
        console.error('Failed to fetch client schema:', error)
      } finally {
        setSchemaLoading(false)
      }
    }
    
    if (document?.client_schema_id && !clientSchema) {
      fetchClientSchema()
    }
  }, [document?.client_schema_id, clientSchema])

  // Determine if using dynamic schema or legacy accounting fields
  const isUsingDynamicSchema = !!(document?.client_schema_id && clientSchema)
  
  // Debug logging to see what data we have
  console.log('🔍 Document Data Debug:', {
    documentId: document?.id,
    hasExtractedData: !!document?.extracted_data,
    extractedDataKeys: document?.extracted_data ? Object.keys(document.extracted_data) : [],
    hasFields: !!document?.extracted_data?.fields,
    fieldKeys: document?.extracted_data?.fields ? Object.keys(document.extracted_data.fields).slice(0, 5) : [],
    metadata: document?.extracted_data?.metadata,
    extractionMethod: document?.extraction_method
  })
  
  // UNIFIED APPROACH: All data is now in extracted_data.fields
  let fieldsData: Record<string, any> = {}
  
  if (document?.extracted_data) {
    // New unified structure
    if (document.extracted_data.fields) {
      fieldsData = document.extracted_data.fields
    }
    // Fallback for old data structure (backwards compatibility)
    else if (document.extracted_data.client_fields) {
      fieldsData = document.extracted_data.client_fields
    }
    else if (document.extracted_data.accounting_fields) {
      fieldsData = document.extracted_data.accounting_fields
    }
    else {
      // Very old format - direct fields
      fieldsData = document.extracted_data
    }
  }
  
  // Helper to get field value and confidence
  const getFieldData = (fieldName: string) => {
    return fieldsData[fieldName] || { value: null, confidence: 0 }
  }
  
  // Update accounting field using React Query
  const updateAccountingField = async (fieldKey: string, newValue: string | number | boolean) => {
    try {
      await updateFieldMutation.mutateAsync({
        documentId,
        fieldKey,
        newValue
      })
    } catch (error) {
      console.error('Error updating field:', error)
      throw error // Re-throw so the component can handle it
    }
  }

  // Mark as ready for export
  const markReadyForExport = async () => {
    console.log('🔄 BUTTON CLICKED: Marking document as ready for export...')
    console.log('📊 BEFORE UPDATE - Current document state:', {
      accounting_status: document?.accounting_status,
      requires_review: document?.requires_review
    })
    
    try {
      const result = await updateFieldMutation.mutateAsync({
        documentId,
        updates: {
          requires_review: false,
          accounting_status: 'ready_for_export'
        }
      })
      
      console.log('✅ UPDATE SUCCESS - API returned:', result)
      console.log('📊 AFTER UPDATE - Document should be:', {
        accounting_status: 'ready_for_export',
        requires_review: false
      })
      
    } catch (error) {
      console.error('❌ UPDATE FAILED:', error)
    }
  }

  // Mark as requires review
  const markRequiresReview = async () => {
    console.log('🔄 Marking document as requires review...')
    try {
      await updateAccountingField('requires_review', true)
      console.log('✅ Document marked as requires review')
    } catch (error) {
      console.error('❌ Failed to mark as requires review:', error)
    }
  }

  // Re-process all accounting fields
  const reprocessAllFields = () => {
    console.log('🔄 Starting reprocess for document:', documentId)
    reprocessMutation.mutate(documentId, {
      onSuccess: (data) => {
        console.log('✅ Reprocess completed successfully:', data)
      },
      onError: (error) => {
        console.error('❌ Reprocess failed:', error)
      }
    })
  }

  // Retry failed document processing
  const retryProcessing = () => {
    retryMutation.mutate(documentId)
  }

  // Calculate overall confidence for accounting fields
  const calculateOverallConfidence = () => {
    if (!document || !document.extracted_data) return 0
    
    // Use the mapping_confidence if available (set by Stage 19)
    if (document.mapping_confidence !== undefined) {
      return document.mapping_confidence
    }
    
    // Fallback: calculate from individual field confidences
    const extractedData = document.extracted_data as any
    // For multi-model extraction, fields are nested under accounting_fields
    const fieldsSource = extractedData.accounting_fields || extractedData
    const fields = Object.keys(fieldsSource).filter(key => 
      typeof fieldsSource[key] === 'object' && 
      'confidence' in fieldsSource[key]
    )
    
    if (fields.length === 0) return 0
    
    const totalConfidence = fields.reduce((sum, key) => {
      return sum + (fieldsSource[key].confidence || 0)
    }, 0)
    
    return totalConfidence / fields.length
  }

  // Get field confidence from extracted data
  const getFieldConfidence = (fieldKey: string): number => {
    if (!document?.extracted_data) return 0
    const extractedData = document.extracted_data as any
    // For multi-model extraction, fields are nested under accounting_fields
    const fieldsSource = extractedData.accounting_fields || extractedData
    return fieldsSource[fieldKey]?.confidence || 0.5
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Document Details"
          breadcrumb={{
            label: 'Back to Documents',
            href: '/documents'
          }}
        />
        
        <LoadingState
          variant="spinner"
          size="lg"
          message="Loading document..."
          centered
        >
          <p className="text-base text-gray-500 font-light">
            Fetching document and accounting details
          </p>
        </LoadingState>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Document Details"
          breadcrumb={{
            label: 'Back to Documents',
            href: '/documents'
          }}
        />
        
        <ErrorState
          title="Failed to load document"
          message={error.message}
          primaryAction={{
            label: 'Try Again',
            onClick: () => refetch()
          }}
        />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Document Details"
          breadcrumb={{
            label: 'Back to Documents',
            href: '/documents'
          }}
        />
        
        <ErrorState
          title="Document not found"
          message="The document you're looking for doesn't exist or you don't have access to it."
          variant="warning"
        />
      </div>
    )
  }

  const overallConfidence = calculateOverallConfidence()
  const isAccountingReady = document.accounting_status === 'ready_for_export'
  const needsReview = document.requires_review

  // Debug logging for UI state changes
  console.log('🎯 UI State Debug:', {
    documentId: document.id,
    accounting_status: document.accounting_status,
    requires_review: document.requires_review,
    isAccountingReady,
    needsReview,
    overallConfidence,
    hasFullText: !!document.full_text,
    fullTextLength: document.full_text?.length || 0,
    fullTextPreview: document.full_text?.substring(0, 100) || 'No full text'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Streamlined Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a href="/documents" className="text-gray-500 hover:text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </a>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{document.filename}</h1>
                  <div className="flex items-center mt-1 space-x-3 text-sm text-gray-500">
                    <StatusBadge status={document.status} />
                    {document.accounting_status && (
                      <AccountingStatusBadge status={document.accounting_status} />
                    )}
                    <span>•</span>
                    <span>{new Date(document.updated_at || document.created_at).toLocaleDateString()}</span>
                    {document.extraction_cost && (
                      <>
                        <span>•</span>
                        <span>${document.extraction_cost.toFixed(3)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <a
                  href={document.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Original
                </a>
                <ExcelExportButton
                  document={document}
                  variant="primary"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Processing Status */}
        {(document.status === 'pending' || document.status === 'processing' || document.status === 'queued' || document.status === 'failed') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {document.status === 'failed' ? (
              <ProcessingProgress
                status="failed"
                progress={100}
                infoText={document.error_message || undefined}
                onRetry={retryProcessing}
                retrying={retryMutation.isPending}
              />
            ) : (
              <ProcessingProgress
                status={document.status === 'queued' ? 'processing' : document.status as 'pending' | 'processing'}
                progress={document.status === 'pending' ? 5 : document.status === 'queued' ? 25 : 50}
                infoText={document.status === 'queued' ? 'Document queued for Lambda processing' : undefined}
              />
            )}
          </div>
        )}

        {/* Quick Actions Bar - Only for completed documents */}
        {document.status === 'completed' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Confidence:</span>
                  <ConfidenceIndicator 
                    confidence={document.overall_confidence || overallConfidence} 
                    variant="badge"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Review Status:</span>
                  {needsReview ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Needs Review
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Approved
                    </span>
                  )}
                </div>
                {document.extraction_method && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Method:</span>
                    <span className="text-sm font-medium text-gray-700">{document.extraction_method}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={reprocessAllFields}
                  disabled={reprocessMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowPathIcon className={`w-4 h-4 mr-1.5 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
                  Reprocess
                </button>
                
                {!isAccountingReady && (
                  <button
                    onClick={markReadyForExport}
                    disabled={updateFieldMutation.isPending}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                    Mark Ready
                  </button>
                )}
                
                {!needsReview && (
                  <button
                    onClick={markRequiresReview}
                    disabled={updateFieldMutation.isPending}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Flag for Review
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        {document.status === 'completed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Document Info & Extracted Text */}
            <div className="lg:col-span-1 space-y-6">
              {/* Document Info Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Document Information</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <dt className="text-xs text-gray-500">Source</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {document.source === 'email' ? '📧 Email' : '📤 Manual Upload'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(document.created_at).toLocaleString()}
                    </dd>
                  </div>
                  {document.extraction_models && document.extraction_models.length > 0 && (
                    <div>
                      <dt className="text-xs text-gray-500">AI Models Used</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {document.extraction_models.join(', ')}
                      </dd>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Matching */}
              {fieldsData && (
                <VendorMatchingSection 
                  documentId={documentId}
                  supplierName={
                    fieldsData.supplier_name?.value || 
                    fieldsData.invoicing_party?.value || 
                    fieldsData.vendor_name?.value as string
                  }
                  onMatchConfirmed={(match) => {
                    console.log('Vendor match confirmed:', match)
                  }}
                />
              )}

              {/* Extracted Text - Collapsible */}
              {document.full_text && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <details className="group">
                    <summary className="px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-900">Extracted Text</h3>
                        <span className="ml-2 text-xs text-gray-500">({document.full_text.length} chars)</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="p-4">
                      <div className="bg-gray-50 rounded p-3 max-h-96 overflow-y-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                          {document.full_text}
                        </pre>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(document.full_text || '')}
                        className="mt-3 inline-flex items-center px-2.5 py-1 border border-gray-300 text-xs rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                  </details>
                </div>
              )}

              {/* AI Justification Report */}
              {document.extracted_data && (
                <JustificationReport
                  report={(document.extracted_data as any).justification_report}
                  documentMetadata={(document.extracted_data as any).document_metadata}
                  validationFlags={(document.extracted_data as any).validation_flags}
                />
              )}
            </div>

            {/* Right Column - Accounting Fields (2/3 width) */}
            <div className="lg:col-span-2">
              <DynamicAccountingFields
                accountingFields={fieldsData}
                documentData={document}
                updateAccountingField={updateAccountingField}
                updateFieldMutation={updateFieldMutation}
                clientSchema={clientSchema}
                isUsingDynamicSchema={isUsingDynamicSchema}
                schemaLoading={schemaLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DocumentDetailsPage() {
  return (
    <ErrorBoundary>
      <DocumentDetailsContent />
    </ErrorBoundary>
  )
}