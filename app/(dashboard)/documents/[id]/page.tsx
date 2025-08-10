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
  const hasClientFields = !!(document?.extracted_data?.client_fields)
  
  // Get fields data based on schema type
  const fieldsData = isUsingDynamicSchema && hasClientFields 
    ? document?.extracted_data?.client_fields || {}
    : document?.extracted_data?.accounting_fields || {}
  
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
    overallConfidence
  })

  return (
    <div className="space-y-8">
      <PageHeader
        title={document.filename}
        subtitle={
          isUsingDynamicSchema && clientSchema
            ? `Schema: ${clientSchema.name} (${clientSchema.columns.length} columns)`
            : document.extraction_method === 'dynamic-schema-mapping'
            ? 'Dynamic Schema Processing'
            : 'Legacy Accounting Fields (21 columns)'
        }
        breadcrumb={{
          label: 'Back to Documents',
          href: '/documents'
        }}
        primaryAction={{
          label: 'View File',
          href: document.file_url
        }}
        actions={
          <div className="flex items-center space-x-4">
            <StatusBadge status={document.status} />
            {document.accounting_status && (
              <AccountingStatusBadge status={document.accounting_status} />
            )}
            {isUsingDynamicSchema && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                Dynamic Schema
              </span>
            )}
            <CostDisplay 
              cost={document.extraction_cost ?? null} 
              method={document.extraction_method ?? null}
              className="text-sm"
            />
            <span className="text-xs text-gray-400">
              Updated: {new Date(document.updated_at || document.created_at).toLocaleTimeString()}
            </span>
          </div>
        }
      />

      {/* Simple Mapping Mode Warning - Context aware */}
      <SimpleMappingWarning context="accounting" dismissible={true} />

      {/* Processing Progress */}
      {(document.status === 'pending' || document.status === 'processing' || document.status === 'queued') && (
        <ProcessingProgress
          status={document.status === 'queued' ? 'processing' : document.status as 'pending' | 'processing'}
          progress={document.status === 'pending' ? 5 : document.status === 'queued' ? 25 : 50}
          infoText={document.status === 'queued' ? 'Document queued for Lambda processing' : undefined}
        />
      )}

      {/* Error State with Retry */}
      {document.status === 'failed' && (
        <ProcessingProgress
          status="failed"
          progress={100}
          infoText={document.error_message || undefined}
          onRetry={retryProcessing}
          retrying={retryMutation.isPending}
        />
      )}

      {/* Multi-Model Extraction Info (if available) */}
      {document.status === 'completed' && document.extraction_models && document.extraction_models.length > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CogIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Multi-Model Extraction
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Extracted using: {document.extraction_models.join(' + ')}
                  {document.overall_confidence && (
                    <span className="ml-2">
                      • Overall confidence: {(document.overall_confidence * 100).toFixed(1)}%
                    </span>
                  )}
                </p>
                {document.validation_errors && document.validation_errors.length > 0 && (
                  <p className="mt-1 text-orange-700">
                    ⚠️ {document.validation_errors.length} validation {document.validation_errors.length === 1 ? 'issue' : 'issues'} found
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accounting Overview */}
      {document.status === 'completed' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-light text-gray-900 tracking-tight">Accounting Status</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isAccountingReady 
                    ? 'This document is ready for export to your accounting system'
                    : needsReview || document.requires_review
                    ? 'This document requires review before export'
                    : 'Accounting fields are being processed'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <ConfidenceIndicator 
                  confidence={document.overall_confidence || overallConfidence} 
                  variant="bar"
                  className="w-48"
                />
              </div>
            </div>
            
            {/* Context-specific warning for high confidence scores */}
            {overallConfidence > 0.8 && (
              <div className="mt-4">
                <SimpleMappingWarning context="confidence" dismissible={true} className="text-sm" />
              </div>
            )}
          </div>
          
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <div className="mt-1">
                    {document.accounting_status ? (
                      <AccountingStatusBadge status={document.accounting_status} />
                    ) : (
                      <span className="text-sm text-gray-500">Processing...</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Overall Confidence</div>
                  <div className="mt-1">
                    <ConfidenceIndicator confidence={overallConfidence} variant="badge" />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Requires Review</div>
                  <div className="mt-1">
                    {needsReview ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        No
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Export Button - Always available for completed documents */}
                <ExcelExportButton
                  document={document}
                  variant="outline"
                  size="md"
                  onExportStart={() => console.log('📤 Starting Excel export for document:', document.id)}
                  onExportComplete={() => console.log('✅ Excel export completed successfully')}
                  onExportError={(error) => console.error('❌ Excel export failed:', error)}
                />
                
                <button
                  onClick={reprocessAllFields}
                  disabled={reprocessMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-4 h-4 mr-2 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
                  Re-process All
                </button>
                
                {!isAccountingReady && (
                  <button
                    onClick={markReadyForExport}
                    disabled={updateFieldMutation.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Mark Ready for Export
                  </button>
                )}
                
                <button
                  onClick={markRequiresReview}
                  disabled={updateFieldMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                  Requires Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Layout: Document Preview + Accounting Fields */}
      {document.status === 'completed' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Document Preview - Left 40% */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Info */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Document Preview
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Filename</dt>
                    <dd className="text-sm text-gray-900 font-medium">{document.filename}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Source</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        document.source === 'email' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {document.source === 'email' ? '📧 Email' : '📤 Upload'}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">
                      {document.source === 'email' ? 'Received' : 'Uploaded'}
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(document.created_at).toLocaleString()}
                    </dd>
                  </div>
                  {document.extraction_method && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Extraction Method</dt>
                      <dd className="text-sm text-gray-900">{document.extraction_method}</dd>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    View Original Document
                  </a>
                </div>
              </div>
            </div>

            {/* Vendor Matching Section */}
            {document.extracted_data && (
              <VendorMatchingSection 
                documentId={documentId}
                supplierName={document.extracted_data.supplier_name?.value as string}
                onMatchConfirmed={(match) => {
                  console.log('Vendor match confirmed:', match)
                }}
              />
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

          {/* Accounting Fields - Right 60% */}
          <div className="lg:col-span-3">
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
  )
}

export default function DocumentDetailsPage() {
  return (
    <ErrorBoundary>
      <DocumentDetailsContent />
    </ErrorBoundary>
  )
}