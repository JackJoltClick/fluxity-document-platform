'use client'

import { useParams, useRouter } from 'next/navigation'
import { useDocument, useUpdateDocumentField, useReprocessDocument, useRetryDocument } from '@/src/hooks/useDocument'
import { useAuthStore } from '@/src/stores/auth.store'
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
import { ExtractedDataDisplay } from '@/src/components/document/ExtractedDataDisplay'

import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CogIcon
} from '@heroicons/react/24/outline'

function DocumentDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const documentId = params.id as string

  // React Query hooks
  const { data: document, isLoading, error, refetch } = useDocument(documentId)
  const updateFieldMutation = useUpdateDocumentField()
  const reprocessMutation = useReprocessDocument()
  const retryMutation = useRetryDocument()

  // Get accounting fields from extracted data
  const rawAccountingFields = document?.extracted_data?.accounting_fields || {}
  
  // Transform accounting fields to extract values and confidence separately
  const accountingFields = Object.entries(rawAccountingFields).reduce((acc, [key, fieldData]) => {
    if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
      // Handle new format: {value, confidence}
      acc[key] = {
        value: fieldData.value,
        confidence: fieldData.confidence || 0
      };
    } else if (fieldData && typeof fieldData === 'object' && fieldData.value !== undefined) {
      // Handle nested value format
      acc[key] = {
        value: fieldData.value,
        confidence: fieldData.confidence || 0
      };
    } else {
      // Handle direct value format (legacy)
      acc[key] = {
        value: fieldData,
        confidence: 0.5
      };
    }
    return acc;
  }, {} as Record<string, {value: any, confidence: number}>);
  
  // Helper to get field value and confidence
  const getFieldData = (fieldName: string) => {
    return accountingFields[fieldName] || { value: null, confidence: 0 }
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
  
  // Handle manual field mapping
  const handleFieldMap = async (sourceKey: string, targetField: string) => {
    console.log('🔗 Mapping field:', sourceKey, '→', targetField)
    try {
      // Get the value from unmapped fields
      const unmappedValue = document?.extracted_data?.field_mappings?.unmapped?.[sourceKey]
      if (unmappedValue !== undefined) {
        await updateFieldMutation.mutateAsync({
          documentId,
          fieldKey: targetField,
          newValue: unmappedValue
        })
        console.log('✅ Field mapped successfully')
      }
    } catch (error) {
      console.error('❌ Failed to map field:', error)
    }
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
      // Ensure it's a number
      const conf = document.mapping_confidence;
      if (typeof conf === 'number') return conf;
      if (typeof conf === 'object' && conf?.value && typeof conf.value === 'number') return conf.value;
      if (typeof conf === 'object' && conf?.confidence && typeof conf.confidence === 'number') return conf.confidence;
    }
    
    // Fallback: calculate from individual field confidences
    const extractedData = document.extracted_data as any
    const fields = Object.keys(extractedData).filter(key => 
      typeof extractedData[key] === 'object' && 
      'confidence' in extractedData[key]
    )
    
    if (fields.length === 0) return 0
    
    const totalConfidence = fields.reduce((sum, key) => {
      const fieldConf = extractedData[key].confidence;
      // Ensure confidence is a number
      if (typeof fieldConf === 'number') return sum + fieldConf;
      if (typeof fieldConf === 'object' && fieldConf?.value && typeof fieldConf.value === 'number') return sum + fieldConf.value;
      if (typeof fieldConf === 'object' && fieldConf?.confidence && typeof fieldConf.confidence === 'number') return sum + fieldConf.confidence;
      return sum;
    }, 0)
    
    return totalConfidence / fields.length
  }

  // Get field confidence from extracted data
  const getFieldConfidence = (fieldKey: string): number => {
    if (!document?.extracted_data) return 0
    const extractedData = document.extracted_data as any
    const conf = extractedData[fieldKey]?.confidence;
    
    // Ensure confidence is a number
    if (typeof conf === 'number') return conf;
    if (typeof conf === 'object' && conf?.value && typeof conf.value === 'number') return conf.value;
    if (typeof conf === 'object' && conf?.confidence && typeof conf.confidence === 'number') return conf.confidence;
    return 0.5;
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
    overallConfidence: typeof overallConfidence === 'object' 
      ? JSON.stringify(overallConfidence) 
      : overallConfidence
  })

  return (
    <div className="space-y-8">
      <PageHeader
        title={document.filename}
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
                    : needsReview
                    ? 'This document requires review before export'
                    : 'Accounting fields are being processed'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <ConfidenceIndicator 
                  confidence={overallConfidence} 
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
          <div className="lg:col-span-3 space-y-8">
            <DynamicAccountingFields
              accountingFields={accountingFields}
              documentData={document}
              updateAccountingField={updateAccountingField}
              updateFieldMutation={updateFieldMutation}
            />
            
            {/* Extracted Data Display */}
            {document.extracted_data && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Extracted Data Mapping
                </h3>
                <ExtractedDataDisplay
                  extractedData={document.extracted_data}
                  onFieldMap={handleFieldMap}
                />
              </div>
            )}
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